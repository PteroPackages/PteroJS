interface ConvertOptions {
    ignore?:    string[];
    map?:       Record<string, string>;
    cast?:      Record<string, any>;
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

function snakeCase(str: string): string {
    let res = '';
    const isUpper = (c: string) =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').includes(c);

    str.split('').forEach(c => {
        if (isUpper(c)) res += '_';
        res += c.toLowerCase();
    });

    return res;
}

function toSnakeCase<T>(obj: any, options: ConvertOptions = {}): T {
    if (typeof obj !== 'object') return obj;
    const parsed: Record<string, any> = {};

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
            v = v.map(i => toSnakeCase(i));
        } else if (typeof v === 'object' && !!v) {
            v = toSnakeCase(v);
        }
        parsed[snakeCase(k)] = v;
    }

    return parsed as T;
}

export default {
    toCamelCase,
    toSnakeCase
}
