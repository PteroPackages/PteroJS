import type { Shard } from './ws/Shard';
import { Account } from '../structures/User';
import { ClientServerManager } from './ClientServerManager';
import { RequestManager } from '../http/RequestManager';
import { ScheduleManager } from './ScheduleManager';
import { WebSocketManager } from './ws/WebSocketManager';
import { OptionSpec } from '../common';
import { PermissionDescriptor } from '../common/client';
import { ValidationError } from '../structures/Errors';
import endpoints from './endpoints';
import loader from '../util/config';

/**
 * The base class for the Pterodactyl client API.
 * This operates using a Pterodactyl client API key which can be found
 * at <your.domain.name/account/api>.
 *
 * **Warning:** Keep your API key private at all times. Exposing this can lead
 * to your accond and servers being corrupted, exposed and/or deleted.
 */
export class PteroClient {
    /**
     * The domain for your Pterodactyl panel. This should be the main URL only
     * (not "/api"). Any additional paths will count as the API path.
     */
    public domain: string;

    /**
     * The API key for your Pterodactyl account. This should be kept private at
     * all times.
     */
    public auth: string;

    public options: Record<string, OptionSpec>;

    /**
     * The account class for controlling your panel account, including the email,
     * password, API keys and SSH keys.
     */
    public account: Account;

    public schedules: ScheduleManager;
    public servers: ClientServerManager;
    public requests: RequestManager;
    public ws: WebSocketManager;

    constructor(
        domain: string,
        auth: string,
        options: Record<string, OptionSpec> = {},
    ) {
        if (!/https?\:\/\/(?:localhost\:\d{4}|[\w\.\-]{3,256})/gi.test(domain))
            throw new ValidationError(
                "Domain URL must start with 'http://' or 'https://' and " +
                    'must be bound to a port if using localhost.',
            );

        if (domain.endsWith('/')) domain = domain.slice(0, -1);
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

    /**
     * Fetches the raw permissions from the API.
     * @see {@link PermissionDescriptor}.
     * @returns The raw permission descriptors.
     */
    async fetchPermissions(): Promise<Record<string, PermissionDescriptor>> {
        const data = await this.requests.get(endpoints.permissions);
        return data.attributes.permissions;
    }

    /** Performs preload requests to Pterodactyl. */
    async connect(): Promise<void> {
        if (this.options.fetchClient) await this.account.fetch();
        if (this.options.servers.fetch && this.options.servers.cache)
            await this.servers.fetch();
    }

    /**
     * Creates a websocket shard for a specified server.
     * @param id The identifier of the server.
     * @returns The server websocket shard.
     */
    addSocketServer(id: string): Shard;
    /**
     * Creates websocket shards for the specified servers.
     * @param ids The identifiers of the servers.
     * @returns An array of the server websocket shards.
     */
    addSocketServer(...ids: string[]): Shard[];
    addSocketServer(...args: any[]): any {
        if (args.length === 1) return this.ws.createShard(args[0]);
        return args.map((i) => this.ws.createShard(i));
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
