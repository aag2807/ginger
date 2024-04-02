export const objectsDiff = (a, b) => {
    const oldKeys = Object.keys(a);
    const newKeys = Object.keys(b);

    return {
        added: newKeys.filter((key) => !oldKeys.includes(key)),
        removed: oldKeys.filter((key) => !newKeys.includes(key)),
        updated: oldKeys.filter((key) => newKeys.includes(key) && a[key] !== b[key]),
    }
};
