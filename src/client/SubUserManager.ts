import type { PteroClient } from '.';
import { Dict } from '../structures/Dict';
import { Permissions } from '../structures/Permissions';
import { SubUser } from '../structures/User';
import { ValidationError } from '../structures/Errors';
import { FetchOptions, Resolvable } from '../common';
import endpoints from './endpoints';

export class SubUserManager {
    cache: Dict<string, SubUser>;

    constructor(public client: PteroClient, public serverId: string) {
        this.cache = new Dict();
    }

    _patch(data: any): any {
        if (data?.data) {
            const res = new Dict<string, SubUser>();
            for (const o of data.data) {
                const s = new SubUser(this.client, this.serverId, o.attributes);
                res.set(s.uuid, s);
            }
            if (this.client.options.subUsers.cache) this.cache = this.cache.join(res);
            return res;
        }

        const u = new SubUser(this.client, this.serverId, data.attributes);
        if (this.client.options.subUsers.cache) this.cache.set(u.uuid, u);
        return u;
    }

    /**
     * Resolves a subuser from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * @param obj The object to resolve from.
     * @returns The resolved user or undefined if not found.
     */
    resolve(obj: Resolvable<SubUser>): SubUser | undefined {
        if (obj instanceof SubUser) return obj;
        // needed for typing resolution
        if (typeof obj === 'number') return undefined;
        if (typeof obj === 'string') return this.cache.get(obj);
        if (obj.relationships?.users)
            return this._patch(obj.relationships.users);

        return undefined;
    }

    /**
     * Returns a formatted URL to the subuser.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/server/${this.serverId}/users`;
    }

    /**
     * Fetches a subuser or a list of subusers from the server.
     * @param [id] The ID of the subuser.
     * @param [options] Additional fetch options.
     * @returns The fetched subuser(s).
     */
    async fetch(id: string, options?: FetchOptions): Promise<SubUser>;
    async fetch(options?: FetchOptions): Promise<Dict<number, SubUser>>;
    async fetch(op?: string | FetchOptions, ops: FetchOptions = {}): Promise<any> {
        let path = endpoints.servers.users.main(this.serverId);
        if (typeof op === 'string') {
            if (!ops.force && this.cache.has(op))
                return this.cache.get(op);

            path = endpoints.servers.users.get(this.serverId, op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops);
        return this._patch(data);
    }

    /**
     * Adds a user as a subuser to the server.
     * @param email The email of the account to add.
     * @param permissions Permissions for the account.
     * @returns The new subuser.
     */
    async add(
        email: string,
        permissions: string[]
    ): Promise<SubUser> {
        const perms = Permissions.resolve(...permissions);
        if (!perms.length) throw new ValidationError(
            'Need at least 1 permission for the subuser.'
        );

        const data = await this.client.requests.post(
            endpoints.servers.users.main(this.serverId),
            { email, permissions: perms }
        );
        return this._patch(data);
    }

    /**
     * Updates the permissions of a specified subuser.
     * @param id The UUID of the subuser.
     * @param permissions The permissions to set.
     * @returns The updated subuser account.
     */
    async setPermissions(
        id: string,
        permissions: string[]
    ): Promise<SubUser> {
        const perms = Permissions.resolve(...permissions);
        if (!perms.length) throw new ValidationError(
            'No permissions specified for the subuser.'
        );

        const data = await this.client.requests.post(
            endpoints.servers.users.get(this.serverId, id),
            { permissions: perms }
        );
        return this._patch(data);
    }

    /**
     * Removes a subuser's access to the server.
     * @param id The UUID of the subuser.
     */
    async remove(id: string): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.users.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
