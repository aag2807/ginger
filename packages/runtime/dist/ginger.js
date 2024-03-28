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

const addEventListener = (eventName, handler, el) => {
    el.addEventListener(eventName, handler);
    return handler;
};
const addEventListeners = (listeners = {}, el) => {
    const addedListeners = {};
    Object.entries(listeners).forEach(([eventName, handler]) => {
        addedListeners[eventName] = addEventListener(eventName, handler, el);
    });
    return addedListeners
};

const setClass = (el, className) => {
    el.className = '';
    if (typeof className == 'string') {
        el.className = className;
    }
    if (Array.isArray(className)) {
        el.classList.add(...className);
    }
};
const setStyle = (el, prop, value) => {
    el.style[prop] = value;
};
const removeAttribute = (el, name) => {
    el[name] = null;
    el.removeAttribute(name);
};
const setAttribute = (el, name, value) => {
    if (value == null) {
        removeAttribute(el, name);
    } else if (name.startsWith('data-')) {
        el.setAttribute(name, value);
    } else {
        el[name] = value;
    }
};
const setAttributes = (el, attrs) => {
    const {class: className, style, ...otherAttrs} = attrs;
    if (className) {
        setClass(el, className);
    }
    if (style) {
        Object.entries(style).forEach(([prop, value]) => {
            setStyle(el, prop, value);
        });
    }
    for (const [name, value] of Object.entries(otherAttrs)) {
        setAttribute(name, value);
    }
};

function mountDOM(vNode, parent) {
    switch (vNode.type) {
        case DOMTypes.TEXT:
            createTextNode(vNode, parent);
            break;
        case DOMTypes.ELEMENT:
            createElementNode(vNode, parent);
            break;
        case DOMTypes.FRAGMENT:
            createFragmentNodes(vNode, parent);
            break;
        default:
            throw new Error(`Unrecognized vNode type: ${vNode.type}`);
    }
}
const createTextNode = (vdom, parentEl) => {
    const {value} = vdom;
    const textNode = document.createTextNode(value);
    vdom.el = textNode;
    parentEl.appendChild(textNode);
};
const addProps = (el, props, vdom) => {
    const { on: events, ...attrs} = props;
    vdom.listeners = addEventListeners(events, el);
    setAttributes(el, attrs);
};
const createElementNode = (vdom, parentEl) => {
    const {tag, props, children} = vdom;
    const element = document.createElement(tag);
    addProps(element, props, vdom);
    vdom.el = element;
    children.forEach(child => mountDOM(child, element));
    parentEl.appendChild(element);
};
const createFragmentNodes = (vdom, parentEl) => {
    const {children} = vdom;
    vdom.el = parentEl;
    children.forEach(child => mountDOM(child, parentEl));
};

function createApp({ state, view, reducers = {} }) {
    let parentEl = null;
    let vdom = null;
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
        if (vdom) {
            destroyDOM(vdom);
        }
        vdom = view(state, emit);
        mountDOM(vdom, parentEl);
    }
    return {
        mount(_parentEl) {
            parentEl = _parentEl;
            renderApp();
            return this
        },
        unmount() {
            destroyDOM(vdom);
            vdom = null;
            subscriptions.forEach((unsubscribe) => unsubscribe());
        },
        emit(eventName, payload) {
            emit(eventName, payload);
        },
    }
}

createApp({
    state: 0,
    reducers: {
        add: (state, amount) => state + amount,
    },
    view: (state, emit) =>
        h(
            'button',
            { on: { click: () => emit('add', 1) } },
            [hString(state)]
        ),
}).mount(document.body);
