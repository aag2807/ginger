import {areNodesEqual} from "./nodes-equal";
import {destroyDOM} from "./destroy-dom";
import {mountDOM} from "./mount-dom";
import {DOMTypes, extractChildren} from "./h";
import {objectsDiff} from "./utils/objects";
import {removeAttribute, removeStyle, setAttribute, setStyle} from "./attributes";
import {isNotBlankOrEmptyString} from "./utils/strings";
import {addEventListener} from "./events";
import {ArrayDiffOperators, arraysDiff, arraysDiffSequence} from "./utils/arrays";

export function patchDOM(oldDom, newDom, parentEl) {
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
    const index = Array.from(parentEl.childNodes).indexOf(el)
    if (index < 0) {
        return null
    }

    return index
}

function patchText(oldVdom, newVdom) {
    const el = oldVdom.el
    const {value: oldText} = oldVdom
    const {value: newText} = newVdom

    if (oldText !== newText) {
        el.nodeValue = newText
    }
}

function patchElement(oldVdom, newVdom, hostComponent) {
    const el = oldVdom.el
    const {
        class: oldClass,
        style: oldStyle,
        on: oldEvents,
        ...oldAttrs
    } = oldVdom.props
    const {
        class: newClass,
        style: newStyle,
        on: newEvents,
        ...newAttrs
    } = newVdom.props
    const {listeners: oldListeners} = oldVdom

    patchAttrs(el, oldAttrs, newAttrs)
    patchClasses(el, oldClass, newClass)
    patchStyles(el, oldStyle, newStyle)
    newVdom.listeners = patchEvents(
        el,
        oldListeners,
        oldEvents,
        newEvents,
        hostComponent
    )
}

function patchAttrs(el, oldAttrs, newAttrs) {
    const {added, removed, updated} = objectsDiff(oldAttrs, newAttrs)

    for (const attr of removed) {
        removeAttribute(el, attr)
    }

    for (const attr of added.concat(updated)) {
        setAttribute(el, attr, newAttrs[attr])
    }
}

function patchClasses(el, oldClass, newClass) {
    const oldClasses = toClassList(oldClass)
    const newClasses = toClassList(newClass)

    const {added, removed} = arraysDiff(oldClasses, newClasses)

    if (removed.length > 0) {
        el.classList.remove(...removed)
    }
    if (added.length > 0) {
        el.classList.add(...added)
    }
}

function toClassList(classes = '') {
    return Array.isArray(classes)
        ? classes.filter(isNotBlankOrEmptyString)
        : classes.split(/(\s+)/).filter(isNotBlankOrEmptyString)
}

function patchStyles(el, oldStyle = {}, newStyle = {}) {
    const {added, removed, updated} = objectsDiff(oldStyle, newStyle)

    for (const style of removed) {
        removeStyle(el, style)
    }

    for (const style of added.concat(updated)) {
        setStyle(el, style, newStyle[style])
    }
}

function patchEvents(
    el,
    oldListeners = {},
    oldEvents = {},
    newEvents = {}
) {
    const {removed, added, updated} = objectsDiff(oldEvents, newEvents)

    for (const event of removed.concat(updated)) {
        el.removeEventListener(event, oldListeners[event])
    }

    const addedListeners = {}
    for (const event of added.concat(updated)) {
        const listener = addEventListener(event, newEvents[event], el)
        addedListeners[event] = listener
    }

    return addedListeners
}

function patchChildren(oldVdom, newVdom) {
    const oldChildren = extractChildren(oldVdom)
    const newChildren = extractChildren(newVdom)
    const parentEl = oldVdom.el

    const diffSeq = arraysDiffSequence(
        oldChildren,
        newChildren,
        areNodesEqual
    )

    for (const operation of diffSeq) {
        const {originalIndex, index, item} = operation

        switch (operation.op) {
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
                patchDOM(
                    oldChildren[originalIndex],
                    newChildren[index],
                    parentEl,
                );
                break;
        }
    }

}
