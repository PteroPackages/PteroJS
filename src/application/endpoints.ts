export default {
    users:{
        main: '/users',
        get: (u: number) => `/users/${u}`,
        ext: (u: string) => `/users/external/${u}`
    },
    nodes:{
        main: '/nodes',
        get: (n: number) => `/nodes/${n}`,
        deploy: '/nodes/deployable',
        config: (n: number) => `/nodes/${n}/configuration`,
        allocations:{
            main: (n: number) => `/nodes/${n}/allocations`,
            get: (n: number, a: number) => `/nodes/${n}/allocations/${a}`
        }
    },
    servers:{
        main: '/servers',
        get: (s: number) => `/servers/${s}`,
        ext: (s: string) => `/servers/external/${s}`,
        details: (s: number) => `/servers/${s}/details`,
        build: (s: number) => `/servers/${s}/build`,
        startup: (s: number) => `/servers/${s}/startup`,
        suspend: (s: number) => `/servers/${s}/suspend`,
        unsuspend: (s: number) => `/servers/${s}/unsuspend`,
        reinstall: (s: number) => `/servers/${s}/reinstall`,
        databases:{
            main: (s: number) => `/servers/${s}/databases`,
            get: (s: number, id: number) => `/servers/${s}/databases/${id}`,
            reset: (s: number, id: number) => `/servers/${s}/databases/${id}/reset-password`
        }
    },
    locations:{
        main: '/locations',
        get: (l: number) => `/locations/${l}`
    },
    nests:{
        main: '/nests',
        get: (n: number) => `/nests/${n}`,
        eggs:{
            main: (n: number) => `/nests/${n}/eggs`,
            get: (n: number, e: number) => `/nests/${n}/eggs/${e}`
        }
    }
}
