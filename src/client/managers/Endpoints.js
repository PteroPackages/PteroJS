module.exports = {
    account:{
        get: '/api/client/account',
        tfa: '/api/client/two-factor',
        email: '/api/client/email',
        password: '/api/client/password',
        apiKeys: '/api/client/api-keys'
    },
    servers:{
        get: s => `/api/client/servers/${s}`,
        databases:{
            get: s => `/api/client/servers/${s}/databases`,
            rotate: (s, id) => `/api/client/servers/${s}/databases/${id}/rotate-password`,
            delete: (s, id) => `/api/client/servers/${s}/databases/${id}`
        },
        files:{
            list: s => `/api/client/servers/${s}/files/list`,
            contents: s => `/api/client/servers/${s}/files/contents`,
            download: s => `/api/client/servers/${s}/files/download`,
            rename: s => `/api/client/servers/${s}/files/rename`,
            copy: s => `/api/client/servers/${s}/files/copy`,
            write: s => `/api/client/servers/${s}/files/write`,
            compress: s => `/api/client/servers/${s}/files/compress`,
            decompress: s => `/api/client/servers/${s}/files/decompress`,
            delete: s => `/api/client/servers/${s}/files/delete`,
            create: s => `/api/client/servers/${s}/files/create-folder`,
            upload: s => `/api/client/servers/${s}/files/upload`
        },
        schedules:{
            list: s => `/api/client/servers/${s}/schedules`,
            get: (s, id) => `/api/client/servers/${s}/schedules/${id}`,
            task: (s, id, t) => `/api/client/servers/${s}/schedules/${id}/tasks/${t}`
        },
        network:{
            alloc: s => `/api/client/servers/${s}/network/allocations`,
            get: (s, id) => `/api/client/servers/${s}/network/allocations/${id}`,
            primary: (s, id) => `/api/client/servers/${s}/network/allocations/${id}/primary`
        },
        users:{
            list: s => `/api/client/servers/${s}/users`,
            get: (s, id) => `/api/client/servers/${s}/users/${id}`
        },
        backups:{
            list: s => `/api/client/servers/${s}/backups`,
            get: (s, id) => `/api/client/servers/${s}/backups/${id}`,
            download: (s, id) => `/api/client/servers/${s}/backups/${id}/download`
        },
        startup:{
            get: s => `/api/client/servers/${s}/startup`,
            var: s => `/api/client/servers/${s}/startup/variable`
        },
        settings:{
            rename: s => `/api/client/servers/${s}/settings/rename`,
            reinstall: s => `/api/client/servers/${s}/settings/reinstall`
        },
        ws: s => `/api/client/servers/${s}/websocket`,
        resources: s => `/api/client/servers/${s}/resources`,
        command: s => `/api/client/servers/${s}/command`,
        power: s => `/api/client/servers/${s}/power`
    },
    get: '/api/client',
    permissions: '/api/client/permissions'
}
