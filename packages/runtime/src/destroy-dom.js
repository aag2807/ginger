import {DOMTypes} from './h'

const removeTextNode = (vNode) => {
    const {el} = vNode;
    el.remove();
}

const removeEventListeners = (listeners, el) => {
    Object.entries(listeners).forEach(([eventName, handler]) => {
        el.removeEventListener(eventName, handler);
    });
}

const removeElementNode = (vNode) => {
    const {el, children, listeners} = vNode;
    el.remove();
    children.forEach(child => destroyDOM(child));

    if (listeners) {
        removeEventListeners(listeners, el);
        delete vNode.listeners;
    }

}

const removeFragmentNodes = (vNode) => {
    vNode.children.forEach(child => destroyDOM(child));
}

export function destroyDOM(vNode) {
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

    delete vNode.el
}
