import type { Shard } from './ws/Shard';
import { Account } from '../structures/User';
import { ClientServerManager } from './ClientServerManager';
import { RequestManager } from '../http/RequestManager';
import { ScheduleManager } from './ScheduleManager';
import { WebSocketManager } from './ws/WebSocketManager';
import { OptionSpec } from '../common';
import loader from '../util/config';

export class PteroClient {
    public domain: string;
    public auth: string;
    public options: Record<string, OptionSpec>;
    public account: Account;

    public schedules: ScheduleManager;
    public servers: ClientServerManager;
    public requests: RequestManager;
    public ws: WebSocketManager;

    constructor(
        domain: string,
        auth: string,
        options: Record<string, OptionSpec> = {}
    ) {
        if (!/https?\:\/\/(?:localhost\:\d{4}|[\w\.\-]{3,256})/gi.test(domain))
            throw new SyntaxError(
                "Domain URL must start with 'http://' or 'https://' and "+
                'must be bound to a port if using localhost.'
            );

        this.domain = domain;
        this.auth = auth;
        this.options = loader.clientConfig({ client: options });
        this.account = new Account(this);

        this.schedules = new ScheduleManager(this);
        this.servers = new ClientServerManager(this);
        this.requests = new RequestManager('Client', domain, auth);
        this.ws = new WebSocketManager(this);
    }

    get ping(): number {
        return this.requests._ping;
    }

    /** Performs preload requests to Pterodactyl. */
    async connect(): Promise<void> {
        if (this.options.fetchClient) await this.account.fetch();
        if (this.options.servers.fetch && this.options.servers.cache)
            await this.servers.fetch();
    }

    /**
     * Adds one or more servers to be connected to websockets.
     * @param ids The server identifiers to add.
     * @returns The websocket shards.
     */
    addSocketServer(...ids: string[]): Shard[] {
        return ids.map(i => this.ws.createShard(i));
    }

    /**
     * Removes a server from websocket connections.
     * @param id The identifier of the server.
     * @returns Whether the shard was removed.
     */
    removeSocketServer(id: string): boolean {
        return this.ws.deleteShard(id);
    }

    /** Closes any existing websocket connections. */
    disconnect(): void {
        if (this.ws.active) this.ws.destroy();
    }
}
