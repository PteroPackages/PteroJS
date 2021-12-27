/**
 * Parses a class or object into a JSON object with camelCase keys.
 * @param {any} obj The object to convert.
 * @param {string[]} [ignore] An array of keys to ignore when parsing.
 * @returns {object} The parsed JSON object.
 */
function camelCase(obj, ignore = []) {
    const entries = Object.entries(obj);
    const parsed = {};
    for (const [k, v] of entries) {
        if (ignore.includes(k)) continue;
        parsed[toCamelCase(k)] = v;
    }
    return parsed;
}

function toCamelCase(str) {
    let res = '';
    let next = false;
    str.split('').forEach(c => {
        if (next) {
            next = false;
            res += c.toUpperCase();
        } else if (c === '_') {
            next = true;
        } else res += c;
    });
    return res;
}

/**
 * Parses a class or object into a JSON object with snake_case keys.
 * @param {any} obj The object to convert.
 * @param {string[]} [ignore] An array of keys to ignore when parsing.
 * @returns {object} The parsed JSON object.
 */
function snakeCase(obj, ignore = []) {
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

module.exports = { camelCase, snakeCase };
