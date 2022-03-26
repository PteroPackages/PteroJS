function handle(client, { event, args }) {
    switch (event) {
        case 'auth success':
            return client.emit('authSuccess');

        case 'status':
            return client.emit('statusUpdate', ...args);

        case 'console output':
            return client.emit('serverOutput', ...args);

        case 'daemon message':
            return client.emit('daemonMessage', ...args);

        case 'install started':
            return client.emit('installStart');

        case 'install output':
            return client.emit('installOutput', ...args);

        case 'install completed':
            return client.emit('installComplete');

        case 'stats':
            return client.emit('statsUpdate', JSON.parse(args));

        case 'transferLogs':
        case 'transferStatus':
            return client.emit('transferUpdate', ...args);

        case 'backup completed':
            let backup = {};
            if (args.length) backup = getServer(id).backups._patch(args[0]);
            return client.emit('backupComplete', backup);

        case 'token expired':
            return client.emit('serverDisconnect');

        case 'daemon error':
        case 'jwt error':
            return client.emit('error', ...args);

        default:
            return client.emit('debug', `[SHARD ${id}] Received unknown event: '${event}'`);
    }
}

module.exports = handle;
