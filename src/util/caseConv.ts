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

function toCamelCase(obj: object, options: ConvertOptions = {}): object {
    const parsed: { [key: string]: object } = {};

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
        parsed[camelCase(k)] = v;
    }

    return parsed;
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

function toSnakeCase(obj: object, options: ConvertOptions = {}): object {
    const parsed: { [key: string]: object } = {};

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
        parsed[snakeCase(k)] = v;
    }

    return parsed;
}

export default {
    toCamelCase,
    toSnakeCase
}
