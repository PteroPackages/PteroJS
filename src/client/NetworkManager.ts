import type { PteroClient } from '.';
import { Dict } from '../structures/Dict';
import { NetworkAllocation } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class NetworkManager {
    public client: PteroClient;
    public cache: Dict<number, NetworkAllocation>;
    public serverId: string;

    constructor(client: PteroClient, serverId: string) {
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<number, NetworkAllocation>();
            for (let o of data.data) {
                const a = caseConv.toCamelCase<NetworkAllocation>(o.attributes);
                a.notes ||= null;
                res.set(a.id, a);
            }
            this.cache.update(res);
            return res;
        }

        const a = caseConv.toCamelCase<NetworkAllocation>(data);
        a.notes ||= null;
        this.cache.set(a.id, a);
        return a;
    }

    /**
     * Fetches the network allocations on the server.
     * @returns The fetched network allocations.
     */
    async fetch(): Promise<Dict<number, NetworkAllocation>> {
        const data = await this.client.requests.get(
            endpoints.servers.network.main(this.serverId)
        );
        return this._patch(data);
    }

    /**
     * Sets the notes of a specified network allocation.
     * @param id The ID of the network allocation.
     * @param notes The notes to set.
     * @returns The updated network allocation.
     */
    async setNote(id: number, notes: string): Promise<NetworkAllocation> {
        const data = await this.client.requests.post(
            endpoints.servers.network.get(this.serverId, id),
            { notes }
        );
        return this._patch(data);
    }

    /**
     * Sets the primary allocation of the server.
     * @param id The ID of the network allocation.
     * @returns The updated network allocation.
     */
    async setPrimary(id: number): Promise<NetworkAllocation> {
        const data = await this.client.requests.post(
            endpoints.servers.network.primary(this.serverId, id)
        );
        return this._patch(data);
    }

    /**
     * Unassigns the specified network allocation form the server.
     * @param id The ID of the network allocation.
     */
    async unassign(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.network.get(this.serverId, id)
        );
    }
}
