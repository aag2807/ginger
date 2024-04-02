import {DOMTypes} from './h'
import {addEventListeners} from "./events";
import {setAttributes} from "./attributes";

/**
 * @param vNode
 * @param {HTMLElement} parent
 * @param {null|number} index
 * */
export function mountDOM(vNode, parent, index = null) {
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

/**
 * @param vdom
 * @param {HTMLElement} parentEl
 * @param {null|number} index
 */
export const createTextNode = (vdom, parentEl, index) => {
    const {value} = vdom;

    const textNode = document.createTextNode(value);
    vdom.el = textNode;

    insert(textNode, parentEl, index);
}

const addProps = (el, props, vdom) => {
    const {on: events, ...attrs} = props;
    vdom.listeners = addEventListeners(events, el)
    setAttributes(el, attrs);
}

/**
 * @param {H} vdom
 * @param {HTMLElement} parentEl
 * @param {null|number} index
 */
export const createElementNode = (vdom, parentEl, index) => {
    const {tag, props, children} = vdom

    const element = document.createElement(tag);
    addProps(element, props, vdom)
    vdom.el = element;

    children.forEach(child => mountDOM(child, element));
    insert(element, parentEl, index);
}


/**
 * @param vdom
 * @param {HTMLElement} parentEl
 */
export const createFragmentNodes = (vdom, parentEl, index) => {
    const {children} = vdom;
    vdom.el = parentEl;

    children.forEach((child, i) =>
        mountDOM(child, parentEl, index ? index + i : null)
    );
}

export function insert(el, parentEl, index) {
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
