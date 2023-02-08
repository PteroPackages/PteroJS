const { PteroApp } = require('@devnote-dev/pterojs');

const app = new PteroApp(
    'https://pterodactyl.test',
    'ptlc_nkan3orij9fjewfio4fni34nf4',
);

(async () => {
    const alloc = await app.allocations.fetchAvailable(2, true);
    const server = await app.servers.create({
        name: 'server create test',
        user: 4,
        egg: 16,
        dockerImage: 'ghcr.io/parkervcp/yolks:nodejs_16',
        startup:
            'if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == "1" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/node /home/container/{{BOT_JS_FILE}}',
        environment: {
            USER_UPLOAD: false,
            AUTO_UPDATE: false,
            BOT_JS_FILE: 'index.js',
        },
        limits: {
            io: 200,
        },
        featureLimits: {
            allocations: 0,
            backups: 0,
            databases: 0,
        },
        allocation: {
            default: alloc.id,
        },
    });

    console.log(server);
})();
