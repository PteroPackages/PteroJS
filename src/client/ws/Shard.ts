import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import type { PteroClient } from '..';
import {
    ShardStatus,
    WebSocketAuth,
    WebSocketEvents,
    WebSocketPayload
} from '../../common/client';
import endpoints from '../endpoints';
import handle from './packetHandler';

export class Shard extends EventEmitter {
    public client: PteroClient;
    private uuid: string;
    private socket: WebSocket | null;
    private status: ShardStatus;
    public readyAt: number;
    public ping: number;
    public lastPing: number;

    constructor(client: PteroClient, uuid: string) {
        super();
        this.client = client;
        this.uuid = uuid;
        this.socket = null;
        this.status = ShardStatus.CLOSED;
        this.readyAt = 0;
        this.ping = -1;
        this.lastPing = 0;
    }

    emit<E extends keyof WebSocketEvents>(
        event: E,
        ...args: WebSocketEvents[E]
    ): boolean {
        return super.emit(event, ...args);
    }

    on<E extends keyof WebSocketEvents>(
        event: E,
        listener: (...args: WebSocketEvents[E]) => any
    ): this {
        super.on(event, listener);
        return this;
    }

    once<E extends keyof WebSocketEvents>(
        event: E,
        listener: (...args: WebSocketEvents[E]) => any
    ): this {
        super.once(event, listener);
        return this;
    }

    off<E extends keyof WebSocketEvents>(
        event: E,
        listener: (...args: WebSocketEvents[E]) => any
    ): this {
        super.off(event, listener);
        return this;
    }

    private debug(message: string): void {
        super.emit('debug',`[Shard ${this.uuid}] ${message}`);
    }

    async connect(): Promise<void> {
        if (![0, 1].includes(this.status)) return;

        this.status = ShardStatus.CONNECTING;
        const auth = await this.client.requests.get(
            endpoints.servers.ws(this.uuid), {}
        ) as WebSocketAuth;
        this.socket = new WebSocket(auth.data.socket);

        this.socket.on('open', () => this.onOpen(auth.data.token));
        this.socket.on('message', m => this.onMessage(m.toString()));
        this.socket.on('error', e => this.onError(e));
        this.socket.on('close', () => this.onClose());
    }

    private async refresh(): Promise<void> {
        if (this.status !== ShardStatus.CONNECTED)
            throw new Error('Shard is not connected.');

        const auth = await this.client.requests.get(
            endpoints.servers.ws(this.uuid), {}
        ) as WebSocketAuth;
        this.send('auth', [auth.data.token]);
    }

    send(event: string, args: string[] = []): void {
        if (!this.socket) throw new Error('Socket for this shard is unavailable.');
        this.debug(`sending event '${event}'`);
        this.socket.send(JSON.stringify({ event, args }));
    }

    disconnect(): void {
        this.socket?.close(1000);
        this.socket = null;
        this.readyAt = 0;
        this.ping = -1;
        this.lastPing = -1;
    }

    private onOpen(token: string): void {
        this.status = ShardStatus.CONNECTED;
        this.readyAt = Date.now();
        this.send('auth', [token]);
        this.debug('connection opened');
        super.emit('serverConnect', this.uuid);

        process.on('SIGINT', () => this.disconnect());
        process.on('SIGTERM', () => this.disconnect());
    }

    private async onMessage(packet: string): Promise<void> {
        if (!packet) return this.debug('received a malformed packet');
        const data: WebSocketPayload = JSON.parse(packet);
        super.emit('rawPayload', data);

        switch (data.event) {
            case 'auth success':
                this.ping = Date.now() - this.lastPing;
                this.lastPing = Date.now();
                super.emit('authSuccess');
                break;

            case 'token expiring':
                this.debug('refreshing token');
                await this.refresh();
                break;

            case 'token expired':
                this.disconnect();
                break;

            default:
                handle(this, data);
                break;
        }
    }

    private onError(err: Error): void {
        this.debug(`received an error: ${err.message}`);
    }

    private onClose(): void {
        this.status = ShardStatus.CLOSED;
        this.debug('connection closed');
        super.emit('serverDisconnect');
    }
}
