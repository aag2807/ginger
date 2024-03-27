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


const msg = MessageComponent({level: 'error', message: 'This is an info message'});


log
