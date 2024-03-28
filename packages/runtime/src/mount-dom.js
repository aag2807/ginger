import {DOMTypes} from './h'
import {addEventListeners} from "./events";
import {setAttributes} from "./attributes";

/**
 * @param vNode
 * @param {HTMLElement} parent
 */
export function mountDOM(vNode, parent) {
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

/**
 * @param vdom
 * @param {HTMLElement} parentEl
 */
export const createTextNode = (vdom, parentEl) => {
    const {value} = vdom;

    const textNode = document.createTextNode(value);
    vdom.el = textNode;

    parentEl.appendChild(textNode);
}

const addProps = (el, props, vdom) => {
    const { on: events, ...attrs} = props;
    vdom.listeners = addEventListeners(events, el)
    setAttributes(el, attrs);
}

/**
 * @param {H} vdom
 * @param {HTMLElement} parentEl
 */
export const createElementNode = (vdom, parentEl) => {
    const {tag, props, children} = vdom

    const element = document.createElement(tag);
    addProps(element, props, vdom)
    vdom.el = element;

    children.forEach(child => mountDOM(child, element));
    parentEl.appendChild(element);
}


/**
 * @param vdom
 * @param {HTMLElement} parentEl
 */
export const createFragmentNodes = (vdom, parentEl) => {
    const {children} = vdom;
    vdom.el = parentEl;

    children.forEach(child => mountDOM(child, parentEl));
}
