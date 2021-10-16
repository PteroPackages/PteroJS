const { join } = require('path');

const DEFAULT = {
    application:{
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
    }
}

function parseAs(from, to) {
    const res = {}
    for (const [k, v] of Object.entries(to)) res[k] = from[k] ?? v;
    for (const [k, v] of Object.entries(res)) if (v.max === -1) res[k].max = Infinity;
    return res;
}

function appConfig(options) {
    if (
        options !== null &&
        typeof options === 'object'
    ) return parseAs(options, DEFAULT.application);
    try {
        options = require(join(process.cwd(), 'pterojs.json'));
        return parseAs(options.application, DEFAULT.application);
    } catch {
        return DEFAULT.application;
    }
}

module.exports = {
    DEFAULT,
    parseAs,
    appConfig
}
