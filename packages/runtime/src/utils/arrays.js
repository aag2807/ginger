import {hString} from '../h'

/**
 *
 * @param { Array } collection
 */
export const withoutNulls = (collection) => collection.filter((item) => item !== null);

/**
 * @param { Array } children
 */
export const mapTextNodes = (children) => {
    return children.map((child) => {
        if (typeof child === 'string') {
            return hString(child);
        }
        return child;
    });
}

export const arraysDiff = (old, newArr) => {
    return {
        added: newArr.filter((item) => !old.includes(item)),
        removed: old.filter((item) => !newArr.includes(item)),
    }
}

export class ArrayDiffOperators {
    static add = 'add';
    static remove = 'remove';
    static move = 'move';
    static noop = 'noop';
}

class ArrayWithOriginalIndices {
    #array = [];
    #originalIndices = [];
    #equalsFn;

    constructor(array, equalsFn) {
        this.#array = array;
        this.#originalIndices = array.map((_, i) => i);
        this.#equalsFn = equalsFn;
    }

    get length() {
        return this.#array.length;
    }

    isRemoval(index, newArray) {
        if (index > this.length) {
            return false;
        }

        const item = this.#array[index];
        const indexInNewArray = newArray.findIndex((newItem) => this.#equalsFn(item, newItem));

        return indexInNewArray === -1;
    }

    removeItem(index) {
        const operation = {
            op: ArrayDiffOperators.remove,
            index,
            item: this.#array[index],
        }

        this.#array.splice(index, 1);
        this.#originalIndices.splice(index, 1);

        return operation;
    }

    isNoop(index, newArray) {
        if (index > this.length) {
            return false;
        }

        const item = this.#array[index];
        const newItem = newArray[index];

        return this.#equalsFn(item, newItem);
    }

    originalIndexAt(index) {
        return this.#originalIndices[index];
    }

    noopItem(index) {
        return {
            op: ArrayDiffOperators.noop,
            originalIndex: this.originalIndexAt(index),
            index,
            item: this.#array[index],
        }
    }

    isAddition(item, fromIdx) {
        return this.findIndexFrom(item, fromIdx) === -1;
    }

    findIndexFrom(item, fromIdx) {
        for (let i = fromIdx; i < this.length; i++) {
            if (this.#equalsFn(this.#array[i], item)) {
                return i;
            }
        }

        return -1;
    }

    addItem(item, index) {
        const operation = {
            op: ArrayDiffOperators.add,
            index,
            item,
        }

        this.#array.splice(index, 0, item);
        this.#originalIndices.splice(index, 0, -1);

        return operation;
    }

    moveItem(item, toIndex) {
        const fromIndex = this.findIndexFrom(item, toIndex);
        const operation = {
            op: ArrayDiffOperators.move,
            originalIndex: this.originalIndexAt(fromIndex),
            from: fromIndex,
            index: toIndex,
            item: this.#array[fromIndex],
        }

        const [_item] = this.#array.splice(fromIndex, 1);
        this.#array.splice(toIndex, 0, _item);

        const [originalIndex] = this.#originalIndices.splice(fromIndex, 1);
        this.#originalIndices.splice(toIndex, 0, originalIndex);

        return operation;
    }

    removeItemsAfter(index) {
        const operations = [];

        while (this.length > index) {
            operations.push(this.removeItem(index));
        }

        return operations;
    }
}

export function arraysDiffSequence(
    oldArray,
    newArray,
    equalsFn = (a, b) => a === b
) {
    const sequence = [];
    const array = new ArrayWithOriginalIndices(oldArray, equalsFn);

    for (let index = 0; index < newArray.length; index++) {
        // removal case
        if (array.isRemoval(index, newArray)) {
            sequence.push(array.removeItem(index));
            index--;
            continue;
        }

        // noop case
        if (array.isNoop(index, newArray)) {
            sequence.push(array.noopItem(index));
            continue;
        }

        // addition case
        const item = newArray[index];
        if (array.isAddition(item, index)) {
            sequence.push(array.addItem(item, index));
            continue;
        }

        // move case
        sequence.push(array.moveItem(item, index));
    }

    //remove extra items
    sequence.push(...array.removeItemsAfter(newArray.length))

    return sequence;
}


export function applyArraysDiffSequence(oldArray, diffSeq) {
    return diffSeq.reduce((array, { op, item, index, from }) => {
        switch (op) {
            case ArrayDiffOperators.add:
                array.splice(index, 0, item)
                break

            case ArrayDiffOperators.remove:
                array.splice(index, 1)
                break

            case ArrayDiffOperators.move:
                array.splice(index, 0, array.splice(from, 1)[0])
                break
        }
        return array
    }, oldArray)
}

