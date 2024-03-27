const setClass = (el, className) => {
    el.className = '';

    if (typeof className == 'string') {
        el.className = className;
    }

    if (Array.isArray(className)) {
        el.classList.add(...className);
    }
}

export const setStyle = (el, prop, value) => {
    el.style[prop] = value;
}

export const removeStyle = (el, prop) => {
    el.style[prop] = null;
}


export const setAttributes = (el, attrs) => {
    const {class: className, style, ...otherAttrs} = attrs;

    if (className) {
        setClass(el, className);
    }

    if (style) {
        Object.entries(style).forEach(([prop, value]) => {
            setStyle(el, prop, value);
        })
    }

    for (const [name, value] of Object.entries(otherAttrs)) {
        el.setAttribute(name, value);
    }
}
