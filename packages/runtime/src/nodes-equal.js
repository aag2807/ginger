import {DOMTypes} from "./h";

export function areNodesEqual(nodeA, nodeB) {
    if (nodeA.type !== nodeB.type) {
        return false;
    }

    if (nodeA.type === DOMTypes.ELEMENT) {
        const {tag: tagA} = nodeA;
        const {tag: tagB} = nodeB;

        return tagA === tagB;
    }

    return true;
}
