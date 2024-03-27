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
