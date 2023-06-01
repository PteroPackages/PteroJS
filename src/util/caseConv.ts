import { snakeCase } from 'snake-case';

export interface ConvertOptions {
    ignore?: string[];
    map?: Record<string, string>;
    cast?: Record<string, any>;
}

function camelCase(str: string): string {
    let res = '';
    let next = false;

    str.split('').forEach(c => {
        if (next) {
            next = false;
            res += c.toUpperCase();
        } else if (c === '_') {
            next = true;
        } else {
            res += c;
        }
    });

    return res;
}

function toCamelCase<T>(obj: any, options: ConvertOptions = {}): T {
    if (typeof obj !== 'object') return obj;
    const parsed: Record<string, any> = {};

    if (Array.isArray(obj)) {
        return <any>obj.map(i => toCamelCase(i));
    }

    for (let [k, v] of Object.entries(obj)) {
        if (options.ignore?.includes(k)) continue;
        if (options.map?.[k]) k = options.map[k];
        if (options.cast?.[k]) {
            try {
                const cls = options.cast[k];
                // @ts-ignore
                v = new cls(v);
            } catch {
                v = String(v);
            }
        }
        if (Array.isArray(v)) {
            v = v.map(i => toCamelCase(i));
        } else if (typeof v === 'object' && !!v) {
            v = toCamelCase(v);
        }
        parsed[camelCase(k)] = v;
    }

    return parsed as T;
}

function toSnakeCase<T>(obj: any, options: ConvertOptions = {}): T {
    if (typeof obj !== 'object' || obj === null) return obj;

    const stack = [{ obj, currentKey: '' }];
    const parsed: Record<string, any> = {};

    while (stack.length > 0) {
        const { obj: currentObj, currentKey } =
            stack.pop() as (typeof stack)[0];

        if (Array.isArray(currentObj)) {
            parsed[currentKey] = currentObj.map(i => toSnakeCase(i));
            continue;
        }

        if (typeof currentObj === 'object' && currentObj !== null) {
            const keys = Object.keys(currentObj);
            for (let i = keys.length - 1; i >= 0; i--) {
                const key = keys[i];
                let value = currentObj[key];
                const newKey = options.map?.[key] || snakeCase(key);

                if (options.ignore?.includes(key)) continue;

                if (options.cast?.[key]) {
                    try {
                        const cls = options.cast[key];
                        value = new cls(value);
                    } catch {
                        value = String(value);
                    }
                }

                parsed[newKey] = value;

                if (typeof value === 'object' && value !== null) {
                    stack.push({ obj: value, currentKey: newKey });
                }
            }
        } else {
            parsed[currentKey] = currentObj;
        }
    }

    return parsed as T;
}

export default {
    toCamelCase,
    toSnakeCase,
};
