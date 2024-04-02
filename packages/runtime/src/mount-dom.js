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
function createTextNode(vdom, parentEl, index) {
    const {value} = vdom

    const textNode = document.createTextNode(value)
    vdom.el = textNode

    insert(textNode, parentEl, index)
}

function addProps(el, props, vdom) {
    const {on: events, ...attrs} = props;
    vdom.listeners = addEventListeners(events, el);
    setAttributes(el, attrs);
}

/**
 * @param {H} vdom
 * @param {HTMLElement} parentEl
 * @param {null|number} index
 */
function createElementNode(vdom, parentEl, index) {
    const {tag, props, children} = vdom

    const element = document.createElement(tag)
    addProps(element, props, vdom)
    vdom.el = element

    children.forEach((child) => mountDOM(child, element))
    insert(element, parentEl, index)
}


/**
 * @param vdom
 * @param {HTMLElement} parentEl
 */
function createFragmentNodes(vdom, parentEl, index) {
    const {children} = vdom
    vdom.el = parentEl

    for (const child of children) {
        mountDOM(child, parentEl, index)

        if (index == null) {
            continue
        }

        switch (child.type) {
            case DOMTypes.FRAGMENT:
                index += child.children.length
                break
            default:
                index++
        }
    }
}

function insert(el, parentEl, index) {
    if (index == null) {
        parentEl.append(el)
        return
    }

    if (index < 0) {
        throw new Error(`Index must be a positive integer, got ${index}`)
    }

    const children = parentEl.childNodes

    if (index >= children.length) {
        parentEl.append(el)
    } else {
        parentEl.insertBefore(el, children[index])
    }
}
