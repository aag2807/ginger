import {h, hString} from "./h";
import {createApp} from "./app";

createApp({
    state: 0,
    reducers: {
        add: (state, amount) => state + amount
    },
    view: (state, emit) => {
        return h('button',
            {on: {click: () => emit('add', 1)}},
            [hString('Clicked ' + state + ' times')]
        )
    }
}).mount(document.body);
