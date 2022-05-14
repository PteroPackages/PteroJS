import type { Shard } from './Shard';
import { WebSocketPayload } from '../../common/client';
import caseConv from '../../util/caseConv';

export default function (shard: Shard, payload: WebSocketPayload): void {
    const args = payload.args || [];

    switch (payload.event) {
        case 'status': shard.emit('statusUpdate', ...args); break;
        case 'console output': shard.emit('serverOutput', ...args); break;
        case 'daemon message': shard.emit('daemonMessage', ...args); break;
        case 'install started': shard.emit('installStart'); break;
        case 'install output': shard.emit('installOutput', ...args); break;
        case 'install completed': shard.emit('installComplete'); break;
        case 'stats':
            const stats = JSON.parse(args.join());
            shard.emit('statsUpdate', caseConv.toCamelCase(stats));
            break;
        case 'transfer logs':
        case 'transfer status':
            shard.emit('transferUpdate', ...args); break;
        case 'backup completed':
            const backup = JSON.parse(args.join());
            shard.emit('backupComplete', caseConv.toCamelCase(backup));
            break;
        case 'daemon error':
        case 'jwt error':
            shard.emit('error', ...args); break;
        default:
            shard.emit('error', `received unknown event '${payload.event}'`);
            break;
    }
}
