import {H} from "./model/h.model";
import {mapTextNodes, withoutNulls} from "./utils/arrays";

export class DOMTypes {
    static TEXT = 'text';

    static ELEMENT = 'element';

    static COMMENT = 'comment';

    static FRAGMENT = 'fragment';
}

/**
 * @param {keyof HTMLElementTagNameMap} tag
 * @param {Record<string, any>} props
 * @param {Array} children
 * @return {H}
 */
export function h(tag, props, children = []) {
    return H.from(tag, props, mapTextNodes(withoutNulls(children)));
}

/**
 * @param {string} str
 * @return {{type: string, value}}
 */
export function hString(str) {
    return {
        type: DOMTypes.TEXT,
        value: str
    };
}

/**
 * @param {Array} vNodes
 * @return {{children: (*)[], type: string}}
 */
export function hFragment(vNodes) {
    return {
        type: DOMTypes.FRAGMENT,
        children: mapTextNodes(withoutNulls(vNodes)),
    }
}
