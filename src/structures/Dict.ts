export interface DictConstructor {
    new(): Dict<any, any>;
    new<K, V>(entries?: readonly [K, V][]): Dict<K, V>;
    new<K, V>(iterable?: Iterable<readonly [K, V]>): Dict<K, V>;
    readonly [Symbol.iterator]: DictConstructor;
    readonly [Symbol.species]: DictConstructor;
}

/**
 * Dict (or Dictionary) is an extended Map with additional helper methods
 * used for manager caches in the PteroJS library.
 */
export class Dict<K, V> extends Map<K, V> {
    public ['constructor']: DictConstructor;

    private _limit = 0;

    get limit(): number {
        return this._limit;
    }

    /**
     * Sets a limit for the number of entries the dict can have.
     * **Note:** this cannot be changed once set. Attempting to will throw an error.
     * @param amount The number of entries allowed for the dict.
     */
    setLimit(amount: number): void {
        if (this._limit) throw new Error('Cannot override a set limit.');
        this._limit = amount < 0 ? 0 : amount;
    }

    /** @returns Whether the dict has a set limit. */
    isLimited(): boolean {
        return !!this._limit && super.size === this._limit;
    }

    set(key: K, value: V): this {
        if (this.isLimited()) throw new Error(`Dict has reached its limit (${this._limit})`);
        return super.set(key, value);
    }

    /**
     * Checks if at least one of the entries in the dict pass the function.
     * @param fn The function to apply to the dict.
     */
    some(fn: (value: V, key: K, dict: this) => boolean): boolean {
        for (const [k, v] of this) if (fn(v, k, this)) return true;
        return false;
    }

    /**
     * Checks if all the entries in the dict pass the function.
     * @param fn The function to apply to the dict.
     */
    every(fn: (value: V, key: K, dict: this) => boolean): boolean {
        for (const [k, v] of this) if (!fn(v, k, this)) return false;
        return true;
    }

    /**
     * Checks that any of the specified keys exist in the dict.
     * @param keys The keys to check for.
     */
    hasAny(...keys: K[]): boolean {
        return keys.some(k => super.has(k));
    }

    /**
     * Checks that all of the specified keys exist in the dict.
     * @param keys The keys to check for.
     */
    hasAll(...keys: K[]): boolean {
        return keys.every(k => super.has(k));
    }

    /**
     * Returns the first entry (or entries if otherwise specified) in the dict.
     * @param [amount] The number of entries to return from the start of the dict.
     */
    first<T extends number | undefined>(amount?: T): T extends undefined ? V : V[] {
        const v = [...super.values()];
        if (amount === undefined) return v[0] as any;
        const s = v.splice(0, amount);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Returns the first key (or keys if otherwise specified) in the dict.
     * @param [amount] The number of keys to return from the start of the dict.
     */
    firstKey<T extends number | undefined>(amount?: T): T extends undefined ? K : K[] {
        const k = [...super.keys()];
        if (amount === undefined) return k[0] as any;
        const s = k.splice(0, amount);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Returns the last entry (or entries if otherwise specified) in the dict.
     * @param [amount] The number of entries to return from the end of the dict.
     */
    last<T extends number | undefined>(amount?: T): T extends undefined ? V : V[] {
        const v = [...super.values()];
        if (amount === undefined) return v[v.length-1] as any;
        const s = v.slice(-amount);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Returns the last key (or keys if otherwise specified) in the dict.
     * @param [amount] The number of keys to return from the end of the dict.
     */
    lastKey<T extends number | undefined>(amount?: T): T extends undefined ? K : K[] {
        const k = [...super.keys()];
        if (amount === undefined) return k[k.length-1] as any;
        const s = k.slice(-amount);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Returns a random entry (or entries if otherwise specified) in the dict.
     * @param [amount] The number of entries to return from the dict.
     */
    random<T extends number | undefined>(amount?: T): T extends undefined ? V : V[] {
        const v = [...super.values()];
        if (amount === undefined) return v[Math.floor(Math.random() * v.length)] as any;
        const s = [];
        for (let i=0; i<amount; i++) s.push(v[Math.floor(Math.random() * v.length)]);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Returns a random key (or keys if otherwise specified) in the dict.
     * @param [amount] The number of keys to return from the dict.
     */
    randomKey<T extends number | undefined>(amount?: T): T extends undefined ? K : K[] {
        const k = [...super.keys()];
        if (amount === undefined) return k[Math.floor(Math.random() * k.length)] as any;
        const s = [];
        for (let i=0; i<amount; i++) s.push(k[Math.floor(Math.random() * k.length)]);
        return s.length === 1 ? s[0] : s as any;
    }

    /**
     * Applies the function to each entry in the dict and returns an array of
     * the results.
     * @param fn The function to apply to the dict.
     * @returns The mapped results.
     */
    map<T>(fn: (value: V, key: K, dict: this) => T): T[] {
        const res: T[] = [];
        for (const [k, v] of this) res.push(fn(v, k, this));
        return res;
    }

    /**
     * Applies the function to each entry in the dict and returns a dict of the
     * results that passed.
     * @param fn The function to apply to the dict.
     * @returns The filtered dict.
     */
    filter(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>;
    filter<k extends K>(fn: (value: V, key: K, dict: this) => key is k): Dict<K, V> {
        const res = new Dict<K, V>();
        for (const [k, v] of this) if (fn(v, k, this)) res.set(k, v);
        return res;
    }

    /**
     * Applies a function to each entry in the dict and returns the first one
     * that passes.
     * @param fn The function to apply to the dict.
     */
    find(fn: (value: V, key: K, dict: this) => boolean): V | undefined;
    find<k extends K>(fn: (value: V, key: K, dict: this) => key is k): V | undefined {
        for (const [k, v] of this) if (fn(v, k, this)) return v;
        return undefined;
    }

    /**
     * Applies a function to each entry in the dict and returns the number of
     * items removed.
     * @param fn The function to apply to the dict.
     * @returns The number of sweeped entries.
     */
    sweep(fn: (value: V, key: K, dict: this) => boolean): number {
        let res = 0;
        for (const [k, v] of this) if (fn(v, k, this)) super.delete(k) && res++;
        return res;
    }

    /**
     * Applies a function to each entry in the dict and returns 2 dicts, the first
     * containing entries that passed the function and the second containing
     * the failed entries.
     * @param fn The function to apply to the dict.
     * @returns The passed and failed dicts.
     */
    part(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>[] {
        const pass = new Dict<K, V>();
        const fail = new Dict<K, V>();
        for (const [k, v] of this) if (fn(v, k, this)) pass.set(k, v); else fail.set(k, v);
        return [pass, fail];
    }

    /**
     * Reduces each entry in the dict to a single value.
     * @param fn The function to apply to the dict.
     * @returns The reduced value.
     */
    reduce<T>(fn: (value: V, key: K, dict: this) => T, acc: T): T {
        for (const [k, v] of this) acc = fn(v, k, this);
        return acc;
    }

    /**
     * Joins one or more dicts with the current one and returns the value.
     * @param dict The dicts to join.
     * @returns The joined dicts.
     */
    join(...dict: Dict<K, V>[]): Dict<K, V>;
    join<k extends K, v extends V>(...dict: Dict<k, v>[]): Dict<k, v> {
        const res = this.clone() as Dict<k, v>;
        for (const d of dict) for (const [k, v] of d) res.set(k, v);
        return res;
    }

    /**
     * @param dict The dict to compare differences to.
     * @returns A dict containing the different entries between both dicts.
     */
    difference(dict: Dict<K, V>): Dict<K, V> {
        const res = new Dict<K, V>();
        for (const [k, v] of this) if (!dict.has(k)) res.set(k, v);
        for (const [k, v] of dict) if (!super.has(k)) res.set(k, v);
        return res;
    }

    /** @returns A clone of the dict. */
    clone(): Dict<K, V> {
        return new Dict(super.entries());
    }
}
