import {h, hString, hFragment} from "./h";
import {mountDOM} from "./mount-dom";


/**
 *
 * @param {{level: 'info'| 'warning' | 'error', message:string}} obj
 * @constructor
 */
const MessageComponent = ( {level, message }) =>
{
    return h('div', {class: `message message--${level}`}, [
        h('p', {}, [message])
    ])
}

const vdom = h( 'div', {}, [
    hString('Hello World!'),
    hFragment([
        h('p', {class: 'paragraph'}, ['This is a paragraph']),
        h('p', {class: 'paragraph'}, ['This is another paragraph']),
    ]),
])

mountDOM(vdom, document.body)
