import {describe, expect, test} from 'vitest'
import {objectsDiff} from '../utils/objects'
import {applyArraysDiffSequence, arraysDiffSequence} from "../utils/arrays";

describe('object differ', () => {
    test('same object, no change', () => {
        const oldObj = {foo: 'bar'}
        const newObj = {foo: 'bar'}
        const {added, removed, updated} = objectsDiff(oldObj, newObj)

        expect(added).toEqual([])
        expect(removed).toEqual([])
        expect(updated).toEqual([])
    })

    test('add key', () => {
        const oldObj = {}
        const newObj = {foo: 'bar'}
        const {added, removed, updated} = objectsDiff(oldObj, newObj)

        expect(added).toEqual(['foo'])
        expect(removed).toEqual([])
        expect(updated).toEqual([])
    })

    test('remove key', () => {
        const oldObj = {foo: 'bar'}
        const newObj = {}
        const {added, removed, updated} = objectsDiff(oldObj, newObj)

        expect(added).toEqual([])
        expect(removed).toEqual(['foo'])
        expect(updated).toEqual([])
    })

    test('update value', () => {
        const arr = [1, 2, 3]
        const oldObj = {foo: 'bar', arr}
        const newObj = {foo: 'baz', arr}
        const {added, removed, updated} = objectsDiff(oldObj, newObj)

        expect(added).toEqual([])
        expect(removed).toEqual([])
        expect(updated).toEqual(['foo'])
    })

    test('diff function', () => {
        const oldArray = ['A', 'A', 'B', 'C'];
        const newArray = ['C', 'K', 'A', 'B'];

        const result = arraysDiffSequence(oldArray, newArray);

        expect(result).toEqual([
            {op: 'move', originalIndex: 3, from: 3, index: 0, item: 'C'},
            {op: 'add', index: 1, item: 'K'},
            {op: 'noop', index: 2, originalIndex: 0, item: 'A'},
            {op: 'move', originalIndex: 2, from: 4, index: 3, item: 'B'},
            {op: 'remove', index: 4, item: 'A'}
        ]);
    })
})
