/**
 * Dict (or Dictionary) is an extended Map with additional helper methods
 * used for manager caches in the PteroJS library.
 * @extends {Map}
 */
class Dict extends Map {
    /**
     * Checks if at least one of the items in the dict pass the function.
     * @param {Function} fn The function to apply to the dict.
     * @returns {boolean}
     */
    some(fn) {
        for (const [k, v] of this) if (fn(v, k, this)) return true;
        return false;
    }

    /**
     * Checks if all the items in the dict pass the function.
     * @param {Function} fn The function to apply to the dict.
     * @returns {boolean}
     */
    every(fn) {
        for (const [k, v] of this) if (!fn(v, k, this)) return false;
        true;
    }

    /**
     * Checks that any of the specified keys exist in the dict.
     * @param  {...any} keys The keys to check for.
     * @returns {boolean}
     */
    hasAny(...keys) {
        return keys.some(k => this.has(k));
    }

    /**
     * Checks that all of the specified keys exist in the dict.
     * @param  {...any} keys The keys to check for.
     * @returns {boolean}
     */
    hasAll(...keys) {
        return keys.every(k => this.has(k));
    }

    /**
     * Returns the first item (or items if otherwise specified) in the dict.
     * @param {number} [amount] The number of items to return from the start of the dict.
     * @returns {any|any[]}
     */
    first(amount) {
        const v = [...this.values()];
        if (amount === undefined) return v[0];
        const s = v.splice(0, amount);
        return s.length === 1 ? s[0] : s;
    }

    /**
     * Returns the last item (or items if otherwise specified) in the dict.
     * @param {number} [amount] The number of items to return from the end of the dict.
     * @returns {any|any[]}
     */
    last(amount) {
        const v = [...this.values()];
        if (amount === undefined) return v[v.length-1];
        const s = v.slice(-amount);
        return s.length === 1 ? s[0] : s;
    }

    /**
     * Returns a random item (or items if otherwise specified) in the dict.
     * @param {number} [amount] The number of random items to return.
     * @returns {any|any[]}
     */
    random(amount) {
        const v = [...this.values()];
        if (amount === undefined) return v[Math.floor(Math.random() * v.length)];
        const s = [];
        for (let i=0; i<amount; i++) s.push(v[Math.floor(Math.random() * v.length)]);
        return s.length === 1 ? s[0] : s;
    }

    /**
     * Applies the function to each item in the dict and returns an array of the results.
     * @param {Function} fn The function to apply to the dict.
     * @returns {any[]}
     */
    map(fn) {
        const res = [];
        for (const [k, v] of this) res.push(fn(v, k, this));
        return res;
    }

    /**
     * Applies the function to each item in the dict and returns a dict of the results that passed.
     * @param {Function} fn The function to apply to the dict.
     * @returns {Dict<any, any>}
     */
    filter(fn) {
        const res = new Dict();
        for (const [k, v] of this) if (fn(v, k, this)) res.set(k, v);
        return res;
    }

    /**
     * Applies a function to each item in the dict and returns the first one that passes.
     * @param {Function} fn The function to apply to the dict.
     * @returns {?any}
     */
    find(fn) {
        for (const [k, v] of this) if (fn(v, k, this)) return v;
        return undefined;
    }

    /**
     * Applies a function to each item in the dict and returns the number of items removed.
     * @param {Function} fn The function to apply to the dict.
     * @returns {number}
     */
    sweep(fn) {
        let res = 0;
        for (const [k, v] of this) if (fn(v, k, this)) this.delete(k) && res++;
        return res;
    }

    /**
     * Applies a function to each item in the dict and returns 2 dicts, the first containing
     * items that passed the function and the second containing the failed items.
     * @param {Function} fn The function to apply to the dict.
     * @returns {Dict<any, any>[]}
     */
    part(fn) {
        const pass = new Dict();
        const fail = new Dict();
        for (const [k, v] of this) if (fn(v, k, this)) pass.set(k, v); else fail.set(k, v);
        return [pass, fail];
    }

    /**
     * Reduces each item in the dict to a single value.
     * @param {Function} fn The function to apply to the dict.
     * @param {any} acc The object to accumulate.
     * @returns {any}
     */
    reduce(fn, acc) {
        for (const [k, v] of this) acc = fn(acc, v, k, this);
        return acc;
    }

    /**
     * Joins one or more dicts with the current one and returns the value.
     * @param  {...Dict<any, any>} dict The dicts to join.
     * @returns {Dict<any, any>}
     */
    join(...dict) {
        const res = new Dict(this);
        for (const d of dict) for (const [k, v] of d) res.set(k, v);
        return res;
    }

    /**
     * Returns a dict containing the different items between both dicts.
     * @param {Dict<any, any>} dict The dict to compare differences to.
     * @returns {Dict<any, any>}
     */
    difference(dict) {
        const res = new Dict();
        for (const [k, v] of this) if (!dict.has(k)) res.set(k, v);
        for (const [k, v] of dict) if (!this.has(k)) res.set(k ,v);
        return res;
    }
}

module.exports = Dict;
