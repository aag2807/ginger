import {h, hString, hFragment} from '../__test__/lib/ginger';

class Stack {
    constructor() {
        this.stack = [];
    }

    push(item) {
        this.stack.push(item);
    }

    pop() {
        return this.stack.pop();
    }

    peek() {
        return this.stack[this.stack.length - 1];
    }

    isEmpty() {
        return this.stack.length === 0;
    }
}

export function jsxToGinger(jsx) {
    const tagStack = new Stack();
    // split jsx into separated parts
    const parts = jsx.split(/(<.*?>)/).filter(Boolean);
    // if there is only one part, it means that the jsx is a text node
    if (parts.length === 1) {
        return hString(parts[0]);
    }
    for(const part of parts) {
        const isClosingTag = part.startsWith('</');
        if (isClosingTag) {
            const tag = part.match(/<\/(\w+)>/)[1];
            const lastTag = tagStack.peek();
            if (lastTag === tag) {
                tagStack.pop();
            }
        } else {
            const tag = part.match(/<(\w+)/)[1];
            tagStack.push(tag);
        }
    }
    const tag = jsx.match(/<(\w+)/)[1];
    const attributes = extractAttributesFromJsx(jsx);
    const children = jsx.match(/>(.*?)<\/\w+>/)[1];

    return h(tag, attributes, [children]);
}

function extractAttributesFromJsx(jsx) {
    const attributes = jsx.match(/<\w+\s+(.*?)>/)[1];
    const attrs = attributes.split(' ').map(attr => {
        const [key, value] = attr.split('=');
        return {key, value};
    });

    const attrsObj = attrs.reduce((acc, {key, value}) => {
        acc[key] = value;
        return acc;
    }, {});

    return attrsObj;
}
