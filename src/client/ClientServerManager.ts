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

    /** Allowed filter arguments for servers. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for servers. */
    get INCLUDES() {
        return Object.freeze(['egg', 'subusers']);
    }

    /** Allowed sort arguments for servers. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroClient) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.meta = undefined;
    }

    _patch(data: any): any {
        if (data.meta) this.meta = caseConv.toCamelCase<ClientMeta>(data.meta);

        if (data?.data) {
            const res = new Dict<string, ClientServer>();
            for (let o of data.data) {
                const s = new ClientServer(this.client, o.attributes);
                res.set(s.identifier, s);
            }
            if (this.client.options.servers.cache) this.cache = this.cache.join(res);
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
     * Fetches a server or a list of servers from the Pterodactyl API.
     * @param [id] The ID of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched server(s).
     */
    async fetch<T extends string | undefined>(
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<T extends undefined ? Dict<string, ClientServer> : ClientServer> {
        if (id && !options.force) {
            const s = this.cache.get(id);
            if (s) return Promise.resolve<any>(s);
        }

        const data = await this.client.requests.get(
            id ? endpoints.servers.get(id) : endpoints.servers.main,
            options, null, this
        );
        return this._patch(data);
    }

    /**
     * Fetches the server resources data of a server.
     * @param id The identifier of the server.
     * @returns The server resources.
     */
    async fetchResources(id: string): Promise<ClientResources> {
        const data: any = await this.client.requests.get(
            endpoints.servers.resources(id)
        );
        return caseConv.toCamelCase(data.attributes);
    }

    /**
     * Fetches the server startup and egg variables data.
     * @param id The identifier of the server.
     * @returns The startup and egg variable data.
     * @see {@link StartupData}.
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
     * Sends a command to the console of a server.
     * @param id The identifier of the server.
     * @param command The command to send.
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
     * @example
     * ```
     * await client.servers
     *     .setVariable('b8f32a45', 'SERVER_JARFILE', 'latest.jar')
     *     .then(console.log);
     * ```
     * 
     * @param id The identifier of the server.
     * @param key The environment variable key.
     * @param value The value of the environment variable.
     * @returns The updated egg variable.
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
     */
    async reinstall(id: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.settings.reinstall(id)
        );
    }
}
