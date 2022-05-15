import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { ClientServer } from '../structures/ClientServer';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { ClientMeta, ClientResources } from '../common/client';
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

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['egg', 'subusers']);
    }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

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

    panelURLFor(id: string): string {
        return `${this.client.domain}/server/${id}`;
    }

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

    async fetchResources(id: string): Promise<ClientResources> {
        const data: any = await this.client.requests.get(
            endpoints.servers.resources(id)
        );
        return caseConv.toCamelCase(data.attributes);
    }

    async sendCommand(id: string, command: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.command(id), { command }
        );
    }

    async setPowerState(
        id: string,
        state: 'start' | 'stop' | 'restart' | 'kill'
    ): Promise<void> {
        if (!['start', 'stop', 'restart', 'kill'].includes(state))
            throw new Error('Invalid power state, must be: start, stop, restart, or kill.');

        await this.client.requests.post(
            endpoints.servers.power(id), { signal: state }
        );
    }
}
