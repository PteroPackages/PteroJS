import type { Shard } from './Shard';
import type { WebSocketManager } from './WebSocketManager';
import { WebSocketPayload } from '../../common/client';
import caseConv from '../../util/caseConv';

/**
 * Handles the event dispatching of websocket events for the shard.
 * This is used interally by the {@link WebSocketManager} and should not be
 * accessed externally.
 * @param shard The websocket shard.
 * @param payload The websocket event payload.
 * @internal
 */
export default function (shard: Shard, payload: WebSocketPayload): void {
    const args = payload.args || [];

    switch (payload.event) {
        case 'status': shard.emit('statusUpdate', args.join()); break;
        case 'console output': shard.emit('serverOutput', args.join()); break;
        case 'daemon message': shard.emit('daemonMessage', args.join()); break;
        case 'install started': shard.emit('installStart'); break;
        case 'install output': shard.emit('installOutput', args.join()); break;
        case 'install completed': shard.emit('installComplete'); break;
        case 'stats':
            const stats = JSON.parse(args.join());
            shard.emit('statsUpdate', caseConv.toCamelCase(stats));
            break;
        case 'transfer logs':
        case 'transfer status':
            shard.emit('transferUpdate', args.join()); break;
        case 'backup completed':
            const backup = JSON.parse(args.join());
            shard.emit('backupComplete', caseConv.toCamelCase(backup));
            break;
        case 'daemon error':
        case 'jwt error':
            shard.emit('error', args.join()); break;
        default:
            shard.emit('error', `received unknown event '${payload.event}'`);
            break;
    }
}
