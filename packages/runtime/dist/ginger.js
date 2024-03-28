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
function hFragment(vNodes) {
    return {
        type: DOMTypes.FRAGMENT,
        children: mapTextNodes(withoutNulls(vNodes)),
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
    if( value == null ) {
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

const vdom = h( 'div', {}, [
    hString('Hello World!'),
    hFragment([
        h('p', {class: 'paragraph'}, ['This is a paragraph']),
        h('p', {class: 'paragraph'}, ['This is another paragraph']),
    ]),
]);
mountDOM(vdom, document.body);
