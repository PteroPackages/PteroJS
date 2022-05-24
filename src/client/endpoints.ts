export default {
    account:{
        main: '/account',
        tfa: '/account/two-factor',
        email: '/account/email',
        password: '/account/password',
        apikeys: '/account/api-keys'
    },
    servers:{
        main: '',
        get: (s: string) => `/servers/${s}`,
        databases:{
            main: (s: string) => `/servers/${s}/databases`,
            get: (s: string, id: number) => `/servers/${s}/databases/${id}`,
            rotate: (s: string, id: number) => `/servers/${s}/databases/${id}/rotate-password`
        },
        files:{
            main: (s: string) => `/servers/${s}/files/list`,
            contents: (s: string, f: string) => `/servers/${s}/files/contents?file=${f}`,
            download: (s: string, f: string) => `/servers/${s}/files/download?file=${f}`,
            rename: (s: string) => `/servers/${s}/files/rename`,
            copy: (s: string) => `/servers/${s}/files/copy`,
            write: (s: string, f: string) => `/servers/${s}/files/write?file=${f}`,
            compress: (s: string) => `/servers/${s}/files/compress`,
            decompress: (s: string) => `/servers/${s}/files/decompress`,
            delete: (s: string) => `/servers/${s}/files/delete`,
            create: (s: string) => `/servers/${s}/files/create-folder`,
            upload: (s: string) => `/servers/${s}/files/upload`,
            chmod: (s: string) => `/servers/${s}/files/chmod`
        },
        schedules:{
            main: (s: string) => `/servers/${s}/schedules`,
            get: (s: string, id: number) => `/servers/${s}/schedules/${id}`,
            tasks:{
                main: (s: string, id: number) => `/servers/${s}/schedules/${id}/tasks`,
                get: (s: string, id: number, t: number) => `/servers/${s}/schedules/${id}/tasks/${t}`
            }
        },
        network:{
            main: (s: string) => `/servers/${s}/network/allocations`,
            get: (s: string, id: number) => `/servers/${s}/network/allocations/${id}`,
            primary: (s: string, id: number) => `/servers/${s}/network/allocations/${id}/primary`
        },
        users:{
            main: (s: string) => `/servers/${s}/users`,
            get: (s: string, id: string) => `/servers/${s}/users/${id}`
        },
        backups:{
            main: (s: string) => `/servers/${s}/backups`,
            get: (s: string, id: string) => `/servers/${s}/backups/${id}`,
            lock: (s: string, id: string) => `/servers/${s}/backups/${id}/lock`,
            download: (s: string, id: string) => `/servers/${s}/backups/${id}/download`,
            restore: (s: string, id: string) => `/servers/${s}/backups/${id}/restore`
        },
        startup:{
            get: (s: string) => `/servers/${s}/startup`,
            var: (s: string) => `/servers/${s}/startup/variable`
        },
        settings:{
            image: (s: string) => `/servers/${s}/settings/docker-image`,
            rename: (s: string) => `/servers/${s}/settings/rename`,
            reinstall: (s: string) => `/servers/${s}/settings/reinstall`
        },
        ws: (s: string) => `/servers/${s}/websocket`,
        resources: (s: string) => `/servers/${s}/resources`,
        command: (s: string) => `/servers/${s}/command`,
        power: (s: string) => `/servers/${s}/power`
    },
    permissions: '/permissions'
}
