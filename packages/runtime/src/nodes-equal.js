import {DOMTypes} from "./h";

export function areNodesEqual(nodeOne, nodeTwo) {
    if (nodeOne.type !== nodeTwo.type) {
        return false
    }

    if (nodeOne.type === DOMTypes.ELEMENT) {
        const {
            tag: tagOne,
            props: {key: keyOne},
        } = nodeOne
        const {
            tag: tagTwo,
            props: {key: keyTwo},
        } = nodeTwo

        return tagOne === tagTwo && keyOne === keyTwo
    }

    return true;
}
