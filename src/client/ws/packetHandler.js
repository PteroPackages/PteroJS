function handle(client, { event, args }, id) {
    function getServer(id) {
        return client.servers.cache.get(id);
    }

    switch (event) {
        case 'auth success':
            return client.emit('serverConnect', getServer(id));

        case 'status':
            return client.emit('statusUpdate', getServer(id), ...args);

        case 'console output':
            return client.emit('serverOutput', id, ...args);

        case 'daemon message':
            return client.emit('daemonMessage', getServer(id), ...args);

        case 'install started':
            return client.emit('installStart', id);

        case 'install output':
            return client.emit('installOutput', id, ...args);

        case 'install completed':
            return client.emit('installComplete', id);

        case 'stats':
            return client.emit('statsUpdate', getServer(id), ...args);

        case 'transferLogs':
        case 'transferStatus':
            return client.emit('transferUpdate', id, ...args);

        case 'backup completed':
            let backup = {};
            if (args.length) backup = getServer(id).backups._patch(args[0]);
            return client.emit('backupComplete', getServer(id), backup);

        case 'token expired':
            return client.emit('serverDisconnect', id);

        case 'daemon error':
        case 'jwt error':
            return client.emit('error', id, ...args);

        default:
            return client.emit('debug', `[SHARD ${id}] Received unknown event: '${event}'`);
    }
}

module.exports = handle;
