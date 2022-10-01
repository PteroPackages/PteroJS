import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { ClientServer } from '../structures/ClientServer';
import { Dict } from '../structures/Dict';
import { ValidationError } from '../structures/Errors';
import { FetchOptions, Include } from '../common';
import {
    ClientMeta,
    ClientResources,
    EggVariable,
    StartupData
} from '../common/client';
import type { WebSocketManager } from './ws/WebSocketManager';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ClientServerManager extends BaseManager {
    public client: PteroClient;
    public cache: Dict<string, ClientServer>;

    /**
     * Pagination metadata that is received from the API.
     * This is not returned by normal methods but is parsed separately.
     */
    public meta: ClientMeta | undefined;

    /** Allowed filter arguments for servers (none). */
    get FILTERS() { return Object.freeze([]); }

    /**
     * Allowed include arguments for servers:
     * * egg
     * * subusers
     */
    get INCLUDES() {
        return Object.freeze(['egg', 'subusers']);
    }

    /** Allowed sort arguments for servers (none). */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroClient) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.meta = undefined;
    }

    /**
     * Transforms the raw server object(s) into class objects.
     * @param data The resolvable server object(s).
     * @returns The resolved server object(s).
     */
    _patch(data: any): any {
        if (data.meta) this.meta = caseConv.toCamelCase<ClientMeta>(data.meta);

        if (data?.data) {
            const res = new Dict<string, ClientServer>();
            for (let o of data.data) {
                const s = new ClientServer(this.client, o.attributes);
                res.set(s.identifier, s);
            }
            if (this.client.options.servers.cache) this.cache.update(res);
            return res;
        }

        const s = new ClientServer(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(s.identifier, s);
        return s;
    }

    /**
     * @param id The ID of the server.
     * @returns The formatted URL to the server.
     */
    panelURLFor(id: string): string {
        return `${this.client.domain}/server/${id}`;
    }

    /**
     * Fetches a server from the API by its identifier. This will check the cache first unless the
     * force option is specified.
     * 
     * @param id The identifier of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched server.
     * @example
     * ```
     * client.servers.fetch('411d2eb9')
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(id: string, options?: Include<FetchOptions>): Promise<ClientServer>;
    /**
     * Fetches a list of servers from the API with the given options (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     * 
     * @param [options] Additional fetch options.
     * @returns The fetched servers.
     * @example
     * ```
     * client.servers.fetch({ perPage: 10 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, ClientServer>>;
    async fetch(
        op?: string | Include<FetchOptions>,
        ops: Include<FetchOptions> = {}
    ): Promise<any> {
        let path = endpoints.servers.main;
        if (typeof op === 'string') {
            if (!ops.force && this.cache.has(op))
                return this.cache.get(op);

            path = endpoints.servers.get(op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Fetches the server resources data of a server.
     * @param id The identifier of the server.
     * @returns The server resources.
     * @example
     * ```
     * client.servers.fetchResources('411d2eb9')
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetchResources(id: string): Promise<ClientResources> {
        const data: any = await this.client.requests.get(
            endpoints.servers.resources(id)
        );
        return caseConv.toCamelCase(data.attributes);
    }

    /**
     * Fetches the server startup and egg variables data.
     * @see {@link StartupData}.
     * 
     * @param id The identifier of the server.
     * @returns The startup and egg variable data.
     * @example
     * ```
     * client.servers.fetchStartup('411d2eb9')
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetchStartup(id: string): Promise<StartupData> {
        const data = await this.client.requests.get(
            endpoints.servers.startup.get(id)
        );

        const parsed = caseConv.toCamelCase<StartupData>(data.meta);
        parsed.variables = data.data.map(
            (v: any) => caseConv.toCamelCase(v.attributes)
        );
        return parsed;
    }

    /**
     * Sends a command to the console of a server. Note that this does not return the output from
     * the command, see {@link WebSocketManager} for more information.
     * @param id The identifier of the server.
     * @param command The command to send.
     * @example
     * ```
     * client.servers.sendCommand('411d2eb9', '/say "hello world"')
     *  .catch(console.error);
     * ```
     */
    async sendCommand(id: string, command: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.command(id), { command }
        );
    }

    /**
     * Sets the power state of a server.
     * @param id The identifier of the server.
     * @param state The power state to set.
     * @example
     * ```
     * client.servers.setPowerState('411d2eb9', 'start')
     *  .catch(console.error);
     * ```
     */
    async setPowerState(
        id: string,
        state: 'start' | 'stop' | 'restart' | 'kill'
    ): Promise<void> {
        if (!['start', 'stop', 'restart', 'kill'].includes(state))
            throw new ValidationError(
                'Invalid power state, must be: start, stop, restart, or kill.'
            );

        await this.client.requests.post(
            endpoints.servers.power(id), { signal: state }
        );
    }

    /**
     * Updates the docker image of a server.
     * @param id The identifier of the server.
     * @param image The docker image.
     * @example
     * ```
     * client.servers.setDockerImage(
     *  '411d2eb9',
     *  'ghcr.io/pterodactyl/yolks:java_17'
     *  )
     *  .catch(console.error);
     * ```
     */
    async setDockerImage(id: string, image: string): Promise<void> {
        await this.client.requests.put(
            endpoints.servers.settings.image(id), { docker_image: image }
        );
    }

    /**
     * Updates a specified environment variable on a server. The key must be
     * the environment variable name in capital letters, not the normal
     * variable name.
     * @param id The identifier of the server.
     * @param key The environment variable key.
     * @param value The value of the environment variable.
     * @returns The updated egg variable.
     * @example
     * ```
     * await client.servers
     *     .setVariable('b8f32a45', 'SERVER_JARFILE', 'latest.jar')
     *     .then(console.log);
     * ```
     */
    async setVariable(
        id: string,
        key: string,
        value: string
    ): Promise<EggVariable> {
        if (typeof key !== 'string') throw new ValidationError(
            'variable key', 'string', typeof key
        );
        if (typeof value !== 'string') throw new ValidationError(
            'variable value', 'string', typeof value
        );

        const data = await this.client.requests.put(
            endpoints.servers.startup.var(id),
            { key, value }
        );
        return caseConv.toCamelCase(data.attributes);
    }

    /**
     * Updates the name of a server.
     * @param id The identifier of the server.
     * @param name The new server name.
     * @example
     * ```
     * client.servers.rename('411d2eb9', 'mc-03')
     *  .catch(console.error);
     * ```
     */
    async rename(id: string, name: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.settings.rename(id), { name }
        );
        if (this.cache.has(id)) {
            const s = this.cache.get(id)!;
            s.name = name;
            this.cache.set(id, s);
        }
    }

    /**
     * Triggers the reinstall process of a server.
     * @param id The identifier of the server.
     * @example
     * ```
     * client.servers.reinstall('411d2eb9').catch(console.error);
     * ```
     */
    async reinstall(id: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.settings.reinstall(id)
        );
    }
}
