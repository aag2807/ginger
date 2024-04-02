class H {
    tag = '';
    props = {};
    children = [];
    type = ''
    el = null;
    static from(tag, props, children, type = DOMTypes.ELEMENT) {
        const h = new H();
        h.tag = tag;
        h.props = props;
        h.children = children;
        h.type = type;
        return h;
    }
}

const withoutNulls = (collection) => collection.filter((item) => item !== null);
const mapTextNodes = (children) => {
    return children.map((child) => {
        if (typeof child === 'string') {
            return hString(child);
        }
        return child;
    });
};
class ArrayDiffOperators {
    static add = 'add';
    static remove = 'remove';
    static move = 'move';
    static noop = 'noop';
}
class ArrayWithOriginalIndices {
    #array = [];
    #originalIndices = [];
    #equalsFn;
    constructor(array, equalsFn) {
        this.#array = array;
        this.#originalIndices = array.map((_, i) => i);
        this.#equalsFn = equalsFn;
    }
    get length() {
        return this.#array.length;
    }
    isRemoval(index, newArray) {
        if (index > this.length) {
            return false;
        }
        const item = this.#array[index];
        const indexInNewArray = newArray.findIndex((newItem) => this.#equalsFn(item, newItem));
        return indexInNewArray === -1;
    }
    removeItem(index) {
        const operation = {
            op: ArrayDiffOperators.remove,
            index,
            item: this.#array[index],
        };
        this.#array.splice(index, 1);
        this.#originalIndices.splice(index, 1);
        return operation;
    }
    isNoop(index, newArray) {
        if (index > this.length) {
            return false;
        }
        const item = this.#array[index];
        const newItem = newArray[index];
        return this.#equalsFn(item, newItem);
    }
    originalIndexAt(index) {
        return this.#originalIndices[index];
    }
    noopItem(index) {
        return {
            op: ArrayDiffOperators.noop,
            originalIndex: this.originalIndexAt(index),
            index,
            item: this.#array[index],
        }
    }
    isAddition(item, fromIdx) {
        return this.findIndexFrom(item, fromIdx) === -1;
    }
    findIndexFrom(item, fromIdx) {
        for (let i = fromIdx; i < this.length; i++) {
            if (this.#equalsFn(this.#array[i], item)) {
                return i;
            }
        }
        return -1;
    }
    addItem(item, index) {
        const operation = {
            op: ArrayDiffOperators.add,
            index,
            item,
        };
        this.#array.splice(index, 0, item);
        this.#originalIndices.splice(index, 0, -1);
        return operation;
    }
    moveItem(item, toIndex) {
        const fromIndex = this.findIndexFrom(item, toIndex);
        const operation = {
            op: ArrayDiffOperators.move,
            originalIndex: this.originalIndexAt(fromIndex),
            from: fromIndex,
            index: toIndex,
            item: this.#array[fromIndex],
        };
        const [_item] = this.#array.splice(fromIndex, 1);
        this.#array.splice(toIndex, 0, _item);
        const [originalIndex] = this.#originalIndices.splice(fromIndex, 1);
        this.#originalIndices.splice(toIndex, 0, originalIndex);
        return operation;
    }
    removeItemsAfter(index) {
        const operations = [];
        while (this.length > index) {
            operations.push(this.removeItem(index));
        }
        return operations;
    }
}
function arraysDiffSequence(
    oldArray,
    newArray,
    equalsFn = (a, b) => a === b
) {
    const sequence = [];
    const array = new ArrayWithOriginalIndices(oldArray, equalsFn);
    for (let index = 0; index < newArray.length; index++) {
        if (array.isRemoval(index, newArray)) {
            sequence.push(array.removeItem(index));
            index--;
            continue;
        }
        if (array.isNoop(index, newArray)) {
            sequence.push(array.noopItem(index));
            continue;
        }
        const item = newArray[index];
        if (array.isAddition(item, index)) {
            sequence.push(array.addItem(item, index));
            continue;
        }
        sequence.push(array.moveItem(item, index));
    }
    sequence.push(...array.removeItemsAfter(newArray.length));
    return sequence;
}

class DOMTypes {
    static TEXT = 'text';
    static ELEMENT = 'element';
    static COMMENT = 'comment';
    static FRAGMENT = 'fragment';
}
function h(tag, props, children = []) {
    return H.from(tag, props, mapTextNodes(withoutNulls(children)));
}
function hString(str) {
    return {
        type: DOMTypes.TEXT,
        value: str
    };
}
function hFragment(vNodes) {
    return {
        type: DOMTypes.FRAGMENT,
        children: mapTextNodes(withoutNulls(vNodes)),
    }
}
function extractChildren(vdom) {
    if (!vdom.children) {
        return [];
    }
    const children = [];
    for (const child of vdom.children) {
        if (child.type === DOMTypes.FRAGMENT) {
            children.push(...extractChildren(child));
        } else {
            children.push(child);
        }
    }
    return children;
}

const removeTextNode = (vNode) => {
    const {el} = vNode;
    el.remove();
};
const removeEventListeners = (listeners, el) => {
    Object.entries(listeners).forEach(([eventName, handler]) => {
        el.removeEventListener(eventName, handler);
    });
};
const removeElementNode = (vNode) => {
    const {el, children, listeners} = vNode;
    el.remove();
    children.forEach(child => destroyDOM(child));
    if (listeners) {
        removeEventListeners(listeners, el);
        delete vNode.listeners;
    }
};
const removeFragmentNodes = (vNode) => {
    vNode.children.forEach(child => destroyDOM(child));
};
function destroyDOM(vNode) {
    const {type} = vNode;
    switch (type) {
        case DOMTypes.TEXT:
            removeTextNode(vNode);
            break;
        case DOMTypes.ELEMENT:
            removeElementNode(vNode);
            break;
        case DOMTypes.FRAGMENT:
            removeFragmentNodes(vNode);
            break;
        default:
            throw new Error(`Unrecognized vNode type: ${type}`);
    }
    delete vNode.el;
}

class Dispatcher {
    #subs = new Map()
    #afterHandlers = []
    subscribe(commandName, handler) {
        if (!this.#subs.has(commandName)) {
            this.#subs.set(commandName, []);
        }
        const handlers = this.#subs.get(commandName);
        if (handlers.includes(handler)) {
            return () => {}
        }
        handlers.push(handler);
        return () => {
            const idx = handlers.indexOf(handler);
            handlers.splice(idx, 1);
        }
    }
    afterEveryCommand(handler) {
        this.#afterHandlers.push(handler);
        return () => {
            const idx = this.#afterHandlers.indexOf(handler);
            this.#afterHandlers.splice(idx, 1);
        }
    }
    dispatch(commandName, payload) {
        if (this.#subs.has(commandName)) {
            this.#subs.get(commandName).forEach((handler) => handler(payload));
        } else {
            console.warn(`No handlers for command: ${commandName}`);
        }
        this.#afterHandlers.forEach((handler) => handler());
    }
}

function addEventListeners(listeners = {}, el) {
    const addedListeners = {};
    Object.entries(listeners).forEach(([eventName, handler]) => {
        const listener = addEventListener(eventName, handler, el);
        addedListeners[eventName] = listener;
    });
    return addedListeners
}
function addEventListener(eventName, handler, el) {
    el.addEventListener(eventName, handler);
    return handler
}

function setAttributes(el, attrs) {
    const { class: className, style, ...otherAttrs } = attrs;
    delete otherAttrs.key;
    if (className) {
        setClass(el, className);
    }
    if (style) {
        Object.entries(style).forEach(([prop, value]) => {
            setStyle(el, prop, value);
        });
    }
    for (const [name, value] of Object.entries(otherAttrs)) {
        setAttribute(el, name, value);
    }
}
function setAttribute(el, name, value) {
    if (value == null) {
        removeAttribute(el, name);
    } else if (name.startsWith('data-')) {
        el.setAttribute(name, value);
    } else {
        el[name] = value;
    }
}
function removeAttribute(el, name) {
    try {
        el[name] = null;
    } catch {
        console.warn(`Failed to set "${name}" to null on ${el.tagName}`);
    }
    el.removeAttribute(name);
}
function setStyle(el, name, value) {
    el.style[name] = value;
}
function removeStyle(el, name) {
    el.style[name] = null;
}
function setClass(el, className) {
    el.className = '';
    if (typeof className === 'string') {
        el.className = className;
    }
    if (Array.isArray(className)) {
        el.classList.add(...className);
    }
}

function mountDOM(vNode, parent, index = null) {
    switch (vNode.type) {
        case DOMTypes.TEXT:
            createTextNode(vNode, parent, index);
            break;
        case DOMTypes.ELEMENT:
            createElementNode(vNode, parent, index);
            break;
        case DOMTypes.FRAGMENT:
            createFragmentNodes(vNode, parent, index);
            break;
        default:
            throw new Error(`Unrecognized vNode type: ${vNode.type}`);
    }
}
const createTextNode = (vdom, parentEl, index) => {
    const {value} = vdom;
    const textNode = document.createTextNode(value);
    vdom.el = textNode;
    insert(textNode, parentEl, index);
};
const addProps = (el, props, vdom) => {
    const {on: events, ...attrs} = props;
    vdom.listeners = addEventListeners(events, el);
    setAttributes(el, attrs);
};
const createElementNode = (vdom, parentEl, index) => {
    const {tag, props, children} = vdom;
    const element = document.createElement(tag);
    addProps(element, props, vdom);
    vdom.el = element;
    children.forEach(child => mountDOM(child, element));
    insert(element, parentEl, index);
};
const createFragmentNodes = (vdom, parentEl, index) => {
    const {children} = vdom;
    vdom.el = parentEl;
    children.forEach((child, i) =>
        mountDOM(child, parentEl, index ? index + i : null)
    );
};
function insert(el, parentEl, index) {
    if (index < 0) {
        throw new Error('Index is less than 0')
    }
    if (!!index) {
        parentEl.append(el);
        return;
    }
    const children = parentEl.children;
    if (index >= children.length) {
        parentEl.append(el);
    } else {
        parentEl.insertBefore(el, children[index]);
    }
}

function areNodesEqual(nodeA, nodeB) {
    if (nodeA.type !== nodeB.type) {
        return false;
    }
    if (nodeA.type === DOMTypes.ELEMENT) {
        const {tag: tagA} = nodeA;
        const {tag: tagB} = nodeB;
        return tagA === tagB;
    }
    return true;
}

const objectsDiff = (a, b) => {
    const oldKeys = Object.keys(a);
    const newKeys = Object.keys(b);
    return {
        added: newKeys.filter((key) => !oldKeys.includes(key)),
        removed: oldKeys.filter((key) => !newKeys.includes(key)),
        updated: oldKeys.filter((key) => newKeys.includes(key) && a[key] !== b[key]),
    }
};

function isNotEmptyString(str) {
    return str !== ''
}
function isNotBlankOrEmptyString(str) {
    return isNotEmptyString(str.trim())
}

function patchDOM(oldDom, newDom, parentEl) {
    if (!areNodesEqual(oldDom, newDom)) {
        const index = findIndexInParent(parentEl, oldDom.el);
        destroyDOM(oldDom);
        mountDOM(newDom, parentEl, index);
        return newDom;
    }
    newDom.el = oldDom.el;
    switch (newDom.type) {
        case DOMTypes.TEXT:
            patchText(oldDom, newDom);
            return newDom;
        case DOMTypes.ELEMENT:
            patchElement(oldDom, newDom);
            break;
    }
    patchChildren(oldDom, newDom);
    return newDom;
}
function findIndexInParent(parentEl, el) {
    const index = Array.from(parentEl.childNodes).indexOf(el);
    if (index < 0) {
        return null;
    }
    return index;
}
function patchText(oldDom, newDom) {
    const {el} = oldDom;
    const {value: oldText} = oldDom;
    const {value: newText} = newDom;
    if (oldText !== newText) {
        el.nodeValue = newText;
    }
}
function patchElement(oldDom, newDom) {
    const {el} = oldDom;
    const {
        class: oldClass,
        style: oldStyle,
        on: oldEvents,
        ...oldAttrs
    } = oldDom.props;
    const {
        class: newClass,
        style: newStyle,
        on: newEvents,
        ...newAttrs
    } = newDom.props;
    const {listeners: oldListeners} = oldDom;
    patchAttrs(el, oldAttrs, newAttrs);
    patchClasses(el, oldClass, newClass);
    patchStyles(el, oldStyle, newStyle);
    newDom.listeners = patchEvents(el, oldListeners, oldEvents, newEvents);
}
function patchAttrs(el, oldAttrs, newAttrs) {
    const {added, removed, updated} = objectsDiff(oldAttrs, newAttrs);
    for (const attr of removed) {
        removeAttribute(el, attr);
    }
    for (const attr of added.concat(updated)) {
        el.setAttribute(attr, newAttrs[attr]);
    }
}
function patchClasses(el, oldClass, newClass) {
    const oldClasses = toClassList(oldClass);
    const newClasses = toClassList(newClass);
    const {added, removed} = objectsDiff(oldClasses, newClasses);
    if (!!removed.length) {
        el.classList.remove(...removed);
    }
    if (!!added.length) {
        el.classList.add(...added);
    }
}
function toClassList(classes = '') {
    return Array.isArray(classes)
        ? classes.filter(isNotBlankOrEmptyString)
        : classes.split(/(\s+)/).filter(isNotBlankOrEmptyString)
}
function patchStyles(el, oldStyle = {}, newStyle = {}) {
    const {added, removed, updated} = objectsDiff(oldStyle, newStyle);
    for (const style of removed) {
        removeStyle(el, style);
    }
    for (const style of added.concat(updated)) {
        setStyle(el, style, newStyle[style]);
    }
}
function patchEvents(
    el,
    oldListeners = {},
    oldEvents = {},
    newEvents = {}
) {
    const {removed, added, updated} = objectsDiff(oldEvents, newEvents);
    for (const event of removed.concat(updated)) {
        el.removeEventListener(event, oldListeners[event]);
    }
    const addedListeners = {};
    for (const event of added.concat(updated)) {
        const listener = addEventListener(event, newEvents[event], el);
        addedListeners[event] = listener;
    }
    return addedListeners
}
function patchChildren( oldDom, newDom)
{
    const oldChildren = extractChildren(oldDom);
    const newChildren = extractChildren(newDom);
    const parentEl = oldDom.el;
    const diffSeq = arraysDiffSequence(
        oldChildren,
        newChildren,
        areNodesEqual
    );
    for ( const operation of diffSeq )
    {
        const { originalIndex, index, item } = operation;
        switch (operation.op)
        {
            case ArrayDiffOperators.add:
                mountDOM(item, parentEl, index);
                break;
            case ArrayDiffOperators.remove:
                destroyDOM(item);
                break;
            case ArrayDiffOperators.move:
                const oldChild = oldChildren[originalIndex];
                const newChild = newChildren[index];
                const el = oldChild.el;
                const elAtTargetIndex = parentEl.childNodes[index];
                parentEl.insertBefore(el, elAtTargetIndex);
                patchDOM(oldChild, newChild, parentEl);
                break;
            case ArrayDiffOperators.noop:
                patchDOM(oldChildren[originalIndex], newChildren[index], parentEl);
                break;
        }
    }
}

function createApp({state, view, reducers = {}}) {
    let parentEl = null;
    let vdom = null;
    let isMounted = false;
    const dispatcher = new Dispatcher();
    const subscriptions = [dispatcher.afterEveryCommand(renderApp)];
    function emit(eventName, payload) {
        dispatcher.dispatch(eventName, payload);
    }
    for (const actionName in reducers) {
        const reducer = reducers[actionName];
        const subs = dispatcher.subscribe(actionName, (payload) => {
            state = reducer(state, payload);
        });
        subscriptions.push(subs);
    }
    function renderApp() {
        const newVDOM = view(state, emit);
        vdom = patchDOM(vdom, newVDOM, parentEl);
    }

    return {
        mount(_parentEl) {
            if (isMounted) {
                throw new Error('App is already mounted')
            }
            parentEl = _parentEl;
            vdom = view(state, emit);
            mountDOM(vdom, parentEl);
            isMounted = true;
            return this
        },
        unmount() {
            destroyDOM(vdom);
            vdom = null;
            subscriptions.forEach((unsubscribe) => unsubscribe());
            isMounted = false;
        },
        emit(eventName, payload) {
            emit(eventName, payload);
        },
    }
}

export { createApp, h, hFragment, hString };
