import {expect, test, describe} from 'vitest'
import {jsxToGinger} from "../src";

describe('jsx to ginger H', () => {
    test("should return simple hstring for plain text", () => {
        const result = jsxToGinger('hello world');

        expect(result).toBeTruthy();
        expect(result.type).toBe('text');
        expect(result.value).toBe('hello world');
    });

    test('should convert jsx to ginger H', () => {
        const div = '<div id="test"> hello world </div>';

        const result = jsxToGinger(div);

        expect(result).toBeTruthy();
        expect(result.tag).toBe('div');
        expect(result.props.id).toBe('"test"');
        expect(result.children[0].value).toBe(' hello world ');
    });

    test('should convert jsx to ginger H with multiple children', () => {
        const div = '<div id="test"> hello <span>world</span> </div>';

        const result = jsxToGinger(div);

        expect(result).toBeTruthy();
        expect(result.tag).toBe('div');
        expect(result.props.id).toBe('"test"');
        expect(result.children[0].value).toBe(' hello ');
        expect(result.children[1].tag).toBe('span');
        expect(result.children[1].children[0].value).toBe('world');
    });
})
