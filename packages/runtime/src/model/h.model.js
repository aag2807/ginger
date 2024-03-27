import {DOMTypes} from "../h";

export class H {
    /**
     * @type {keyof HTMLElementTagNameMap | ''}
     */
    tag = '';
    /**
     * @type {Record<string, any>}
     */
    props = {};
    /**
     * @type {Array<H>}
     */
    children = [];
    /**
     * @type {typeof DOMTypes[keyof typeof DOMTypes] | ''}
     */
    type = ''
    /**
     * @type {HTMLElement | null}
     */
    el = null;

    /**
     * @param { keyof HTMLElementTagNameMap} tag
     * @param {Record<string, any>} props
     * @param {Array }children
     * @param {typeof DOMTypes[keyof typeof DOMTypes] | ''} type
     * @return {H}
     */
    static from(tag, props, children, type = DOMTypes.ELEMENT) {
        const h = new H();
        h.tag = tag;
        h.props = props;
        h.children = children;
        h.type = type;
        return h;
    }
}
