class H {
    tag = '';
    props = {};
    children = [];
    type = ''
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

function mountDOM(vNode, parent) {
    switch (vNode.type) {
        case DOMTypes.TEXT:
            createTextNode(vNode, parent);
            break;
        case DOMTypes.ELEMENT:
            break;
        case DOMTypes.FRAGMENT:
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

const MessageComponent = ( {level, message }) =>
{
    return h('div', {class: `message message--${level}`}, [
        h('p', {}, [message])
    ])
};
const msg = MessageComponent({level: 'error', message: 'This is an info message'});
mountDOM(hString("Hello world"), document.body);
