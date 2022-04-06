export default {
    users:{
        main: '/api/application/users',
        get: (u: number) => `/api/application/users/${u}`,
        ext: (u: number) => `/api/application/users/external/${u}`
    },
    nodes:{
        main: '/api/application/nodes',
        get: (n: number) => `/api/application/nodes/${n}`,
        config: (n: number) => `/api/application/nodes/${n}/configuration`,
        allocations:{
            main: (n: number) => `/api/application/nodes/${n}/allocations`,
            get: (n: number, a: number) => `/api/application/nodes/${n}/allocations/${a}`
        }
    },
    servers:{
        main: '/api/application/servers',
        get: (s: number) => `/api/application/servers/${s}`,
        ext: (s: number) => `/api/application/servers/external/${s}`,
        details: (s: number) => `/api/application/servers/${s}/details`,
        build: (s: number) => `/api/application/servers/${s}/build`,
        startup: (s: number) => `/api/application/servers/${s}/startup`,
        suspend: (s: number) => `/api/application/servers/${s}/suspend`,
        unsuspend: (s: number) => `/api/application/servers/${s}/unsuspend`,
        reinstall: (s: number) => `/api/application/servers/${s}/reinstall`
    },
    locations:{
        main: '/api/application/locations',
        get: (l: number) => `/api/application/locations/${l}`
    },
    nests:{
        main: '/api/application/nests',
        get: (n: number) => `/api/application/nests/${n}`,
        eggs:{
            main: (n: number) => `/api/application/nests/${n}/eggs`,
            get: (n: number, e: number) => `/api/application/nests/${n}/eggs/${e}`
        }
    }
}
