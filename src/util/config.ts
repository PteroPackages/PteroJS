import { join } from 'path';
import { FileConfig, OptionSpec } from '../common';

const DEFAULT = {
    APPLICATION:{
        users:{
            fetch: false,
            cache: true,
            max: -1
        },
        nodes:{
            fetch: false,
            cache: true,
            max: -1
        },
        nests:{
            fetch: false,
            cache: true,
            max: -1
        },
        servers:{
            fetch: false,
            cache: true,
            max: -1
        },
        locations:{
            fetch: false,
            cache: true,
            max: -1
        }
    },

    CLIENT:{
        ws: false,
        fetchClient: true,
        servers:{
            fetch: false,
            cache: true,
            max: -1
        },
        subUsers:{
            fetch: false,
            cache: true,
            max: -1
        },
        disableEvents:[]
    }
}

function parseAs(
    from: { [key: string]: any },
    to: { [key: string]: any }
): { [key: string]: any } {
    const res: { [key: string]: any } = {};
    for (const [k, v] of Object.entries(to)) res[k] = k in from ? from[k] : v;
    for (const [k, v] of Object.entries(res)) if (v.max === -1) res[k].max = Infinity;
    return res;
}

function appConfig(options?: FileConfig): { [key: string]: OptionSpec } {
    if (
        options !== undefined &&
        typeof options === 'object' &&
        Object.keys(options).length
    ) return parseAs(options, DEFAULT.APPLICATION);
    try {
        options = require(join(process.cwd(), 'pterojs.json')) as FileConfig;
        return parseAs(options.application ?? {}, DEFAULT.APPLICATION);
    } catch {
        return DEFAULT.APPLICATION;
    }
}

function clientConfig(options?: FileConfig): { [key: string]: OptionSpec | any } {
    if (
        options !== undefined &&
        typeof options === 'object' &&
        Object.keys(options).length
    ) return parseAs(options, DEFAULT.CLIENT);
    try {
        options = require(join(process.cwd(), 'pterojs.json')) as FileConfig;
        return parseAs(options.client ?? {}, DEFAULT.CLIENT);
    } catch {
        return DEFAULT.CLIENT;
    }
}

export default {
    DEFAULT,
    parseAs,
    appConfig,
    clientConfig
}
