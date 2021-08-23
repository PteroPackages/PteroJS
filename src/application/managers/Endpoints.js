module.exports = {
    users:{
        main: '/api/application/users',
        get: u => `/api/application/user/${u}`,
        ext: u => `/api/application/users/external/${u}`
    },
    nodes:{
        main: '/api/application/nodes',
        get: n => `/api/application/nodes/${n}`,
        config: n => `/api/application/nodes/${n}/configuration`
    },
    servers:{
        main: '/api/application/servers',
        get: s => `/api/application/servers/${s}`,
        ext: s => `/api/application/servers/external/${s}`,
        details: s => `/api/application/servers/${s}/details`,
        build: s => `/api/application/servers/${s}/build`,
        startup: s => `/api/application/servers/${s}/startup`,
        suspend: s => `/api/application/servers/${s}/suspend`,
        unsuspend: s => `/api/application/servers/${s}/unsuspend`,
        reinstall: s => `/api/application/servers/${s}/reinstall`
    },
    locations:{
        main: '/api/application/locations',
        get: l => `/api/application/locations/${l}`
    },
    nests:{
        main: '/api/application/nests',
        get: n => `/api/application/nests/${n}`,
        eggs:{
            main: n => `/api/application/nests/${n}/eggs`,
            get: (n, e) => `/api/application/nests/${n}/eggs/${e}`
        }
    }
}
