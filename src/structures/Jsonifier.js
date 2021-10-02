/**
 * Parses a class or object into a JSON object.
 * @param {any} obj The object to convert.
 * @param {string[]} [ignore] An array of keys to ignore when parsing.
 * @returns {object} The parsed JSON object.
 */
module.exports = (obj, ignore = []) => {
    const entries = Object.entries(obj);
    const parsed = {};
    for (const [k, v] of entries) {
        if (ignore.includes(k)) continue;
        parsed[toSnakeCase(k)] = v;
    }
    return parsed;
}

function toSnakeCase(str) {
    let res = '';
    str.split('').forEach(c => {
        if (isUpper(c)) res += '_';
        res += c.toLowerCase();
    });
    return res;
}

function isUpper(c) {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').includes(c);
}
