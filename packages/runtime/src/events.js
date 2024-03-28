export const addEventListener = (eventName, handler, el) => {
    el.addEventListener(eventName, handler);
    return handler;
}

export const addEventListeners = (listeners = {}, el) => {
    const addedListeners = {}

    Object.entries(listeners).forEach(([eventName, handler]) => {
        addedListeners[eventName] = addEventListener(eventName, handler, el)
    })

    return addedListeners
}
