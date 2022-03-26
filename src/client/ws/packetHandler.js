const caseConv = require('../../util/caseConv');

function handle(shard, { event, args }) {
    switch (event) {
        case 'auth success':
            return shard.emit('authSuccess');

        case 'status':
            return shard.emit('statusUpdate', args);

        case 'console output':
            return shard.emit('serverOutput', args);

        case 'daemon message':
            return shard.emit('daemonMessage', args);

        case 'install started':
            return shard.emit('installStart');

        case 'install output':
            return shard.emit('installOutput', args);

        case 'install completed':
            return shard.emit('installComplete');

        case 'stats':
            const stats = JSON.parse(args);
            stats.network = caseConv.camelCase(stats.network);
            return shard.emit('statsUpdate', caseConv.camelCase(stats));

        case 'transferLogs':
        case 'transferStatus':
            return shard.emit('transferUpdate', ...args);

        case 'backup completed':
            return shard.emit('backupComplete', args ?? {});

        case 'token expired':
            return shard.emit('serverDisconnect');

        case 'daemon error':
        case 'jwt error':
            return shard.emit('error', ...args);

        default:
            return shard.emit('debug', `[SHARD ${id}] Received unknown event: '${event}'`);
    }
}

module.exports = handle;
