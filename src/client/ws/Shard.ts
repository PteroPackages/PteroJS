import type { PteroClient } from '..';
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { WebSocketError } from '../../structures/Errors';
import {
    ShardStatus,
    WebSocketAuth,
    WebSocketEvents,
    WebSocketPayload,
} from '../../common/client';
import endpoints from '../endpoints';
import handle from './packetHandler';

export class Shard extends EventEmitter {
    public client: PteroClient;
    public id: string;
    public origin: boolean;
    private socket: WebSocket | null;
    private status: ShardStatus;
    public readyAt: number;
    public ping: number;
    public lastPing: number;

    constructor(client: PteroClient, id: string, origin: boolean) {
        super();
        this.client = client;
        this.id = id;
        this.origin = origin;
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
        listener: (...args: WebSocketEvents[E]) => void,
    ): this {
        super.on(event, listener);
        return this;
    }

    once<E extends keyof WebSocketEvents>(
        event: E,
        listener: (...args: WebSocketEvents[E]) => void,
    ): this {
        super.once(event, listener);
        return this;
    }

    off<E extends keyof WebSocketEvents>(
        event: E,
        listener: (...args: WebSocketEvents[E]) => void,
    ): this {
        super.off(event, listener);
        return this;
    }

    private debug(message: string): void {
        super.emit('debug', `[Shard ${this.id}] ${message}`);
    }

    /** Initializes the connection to the server websocket after authentication. */
    async connect(): Promise<void> {
        if (![0, 1].includes(this.status)) return;

        this.status = ShardStatus.CONNECTING;
        const auth = (await this.client.requests.get(
            endpoints.servers.ws(this.id),
        )) as WebSocketAuth;
        const origin = this.origin ? { origin: this.client.domain } : undefined;
        this.socket = new WebSocket(auth.data.socket, origin);

        this.socket.on('open', () => this.onOpen(auth.data.token));
        this.socket.on('message', (m) => this.onMessage(m.toString()));
        this.socket.on('error', (e) => this.onError(e));
        this.socket.on('close', () => this.onClose());
    }

    private async refresh(): Promise<void> {
        if (this.status !== ShardStatus.CONNECTED)
            throw new Error('Shard is not connected.');

        const auth = (await this.client.requests.get(
            endpoints.servers.ws(this.id),
        )) as WebSocketAuth;
        this.send('auth', [auth.data.token]);
    }

    /**
     * Sends a websocket event to the server (with optional payload args).
     * @param event The event to send to the server.
     * @param args Additional arguements to pass with to the event.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => shard.send('send logs'));
     * shard.connect();
     * ```
     */
    send(event: string, args: string[] = []): void {
        if (!this.socket)
            throw new Error('Socket for this shard is unavailable.');
        this.debug(`sending event '${event}'`);
        this.socket.send(JSON.stringify({ event, args }));
    }

    /**
     * Sends an event to the server and waits for a response.
     * @param event The event to send.
     * @param [args] The arguments to send with the event.
     * @returns The event's response, if any.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => {
     *  shard.request('sendCommand', '/say hello world').then(console.log)
     * );
     * shard.connect();
     * ```
     */
    async request(event: string, args?: string): Promise<any>;
    /**
     * Sends an event to the server and waits for a response.
     * @param event The event to send.
     * @param command The command to send.
     * @returns The event's response, if any.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => {
     *  shard.request('sendCommand', '/say hello world').then(console.log)
     * );
     * shard.connect();
     * ```
     */
    async request(event: 'sendCommand', command: string): Promise<void>;
    /**
     * Sends an event to the server and waits for a response.
     * @param event The event to send.
     * @returns The event's response, if any.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => {
     *  shard.request('sendLogs').then(console.log)
     * );
     * shard.connect();
     * ```
     */
    async request(event: 'sendLogs'): Promise<void>;
    /**
     * Sends an event to the server and waits for a response.
     * @param event The event to send.
     * @returns The event's response, if any.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => {
     *  shard.request('sendStats').then(console.log)
     * );
     * shard.connect();
     * ```
     */
    async request(event: 'sendStats'): Promise<void>;
    /**
     * Sends an event to the server and waits for a response.
     * @param event The event to send.
     * @param state The power state to send.
     * @returns The event's response, if any.
     * @example
     * ```
     * const shard = client.addSocketServer('411d2eb9');
     * shard.on('authSuccess', () => {
     *  shard.request('setState', 'restart').then(console.log)
     * );
     * shard.connect();
     * ```
     */
    async request(event: 'setState', state: string): Promise<void>;
    async request(event: string, args: string = ''): Promise<any> {
        switch (event) {
            case 'auth': {
                this.send('auth', [args]);
                return new Promise<void>((res) =>
                    this.once('authSuccess', res),
                );
            }
            case 'sendCommand': {
                this.send('send command', [args]);
                // unsafe to return response
                return Promise.resolve();
            }
            case 'sendLogs': {
                this.send('send logs');
                return new Promise((res) => this.once('serverOutput', res));
            }
            case 'sendStats': {
                this.send('send stats');
                return new Promise((res) => this.once('statsUpdate', res));
            }
            case 'setState': {
                this.send('set state', [args]);
                return new Promise((res) => this.once('statusUpdate', res));
            }
            default:
                throw new WebSocketError('Invalid sendable websocket event');
        }
    }

    /** Disconnects the websocket from the API. */
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
        super.emit('serverConnect', this.id);

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
