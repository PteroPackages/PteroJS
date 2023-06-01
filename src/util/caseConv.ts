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

function toSnakeCase<T>(
    obj: any,
    options: ConvertOptions = {},
    visited: Set<any> = new Set<any>(),
): T {
    if (typeof obj !== 'object' || obj === null || visited.has(obj)) {
        return obj;
    }

    visited.add(obj);

    const parsed: Record<string, any> = {};

    if (Array.isArray(obj)) {
        return obj.map(i => toSnakeCase(i, options, visited)) as any;
    }

    for (let [k, v] of Object.entries(obj)) {
        if (options.ignore?.includes(k)) continue;
        if (options.map?.[k]) k = options.map[k];
        if (options.cast?.[k]) {
            try {
                const cls = options.cast[k];
                v = new cls(v);
            } catch {
                v = String(v);
            }
        }
        if (Array.isArray(v)) {
            v = v.map(i => toSnakeCase(i, options, visited));
        } else if (typeof v === 'object' && v !== null) {
            v = toSnakeCase(v, options, visited);
        }
        parsed[snakeCase(k)] = v;
    }

    visited.delete(obj);

    return parsed as T;
}

export default {
    toCamelCase,
    toSnakeCase,
};
