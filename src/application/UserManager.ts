import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { CreateUserOptions } from '../common/app';
import { User } from '../structures/User';
import { UpdateUserOptions } from '../common/app';
import { ValidationError } from '../structures/Errors';
import {
    External,
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    Resolvable,
    Sort
} from '../common';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class UserManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, User>;

    /** Allowed filter arguments for users. */
    get FILTERS() {
        return Object.freeze([
            'email', 'uuid', 'uuidShort',
            'username', 'image', 'external_id'
        ]);
    }

    /** Allowed include arguments for users. */
    get INCLUDES() { return Object.freeze([]); }

    /** Allowed sort arguments for users. */
    get SORTS() {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
    }

    _patch(data: any): any {
        if (data?.data) {
            const res = new Dict<number, User>();
            for (const o of data.data) {
                const s = new User(this.client, o.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) this.cache = this.cache.join(res);
            return res;
        }

        const u = new User(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(u.id, u);
        return u;
    }

    /**
     * Resolves a user from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * @param obj The object to resolve from.
     * @returns The resolved user or undefined if not found.
     */
    resolve(obj: Resolvable<User>): User | undefined {
        if (obj instanceof User) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(
            s => (s.username === obj) || (s.firstname === obj) || (s.lastname === obj)
        );
        if (obj.relationships?.user)
            return this._patch(obj.relationships.user) as User;

        return undefined;
    }

    /**
     * @param id The ID of the user.
     * @returns The formatted URL to the user in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/users/view/${id}`;
    }

    /**
     * Fetches a user or a list of users from the Pterodactyl API.
     * @param [id] The ID of the user.
     * @param [options] Additional fetch options.
     * @returns The fetched user(s).
     */
    async fetch<T extends number | string | undefined>(
        id?: T,
        options: External<Include<FetchOptions>> = {}
    ): Promise<T extends undefined ? Dict<number, User> : User> {
        if (!options.force) {
            if (typeof id === 'number') {
                const u = this.cache.get(id);
                if (u) return Promise.resolve<any>(u);
            } else {
                const u = this.cache.find(u => u.externalId === id);
                if (u) return Promise.resolve<any>(u);
            }
        }

        if (typeof id === 'string' && !options.external)
            throw new ValidationError(
                "The 'external' option must be set to fetch externally"
            );

        const data = await this.client.requests.get(
            options.external && id
                ? endpoints.users.ext(id as string)
                : (id ? endpoints.users.get(id as number) : endpoints.users.main),
            options, null, this
        );
        return this._patch(data);
    }

    /** @deprecated Use {@link UserManager.fetch} with `options.external`. */
    async fetchExternal(id: string, options: Include<FetchOptions>): Promise<User> {
        return this.fetch(id, { ...options, external: true });
    }

    /**
     * Queries the Pterodactyl API for users that match the specified query filters.
     * This fetches from the API directly and does not check the cache. Use cache methods
     * for filtering and sorting.
     * Available query filters:
     * * email
     * * uuid
     * * uuidShort
     * * identifier (alias for uuidShort)
     * * username
     * * image
     * * externalId
     * 
     * Available sort options:
     * * id
     * * -id
     * * uuid
     * * -uuid
     * 
     * @param entity The entity to query.
     * @param options The query options to filter by.
     * @returns The queried users.
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, User>> {
        if (!options.sort && !options.filter) throw new ValidationError(
            'Sort or filter is required.'
        );
        if (options.filter === 'identifier') options.filter = 'uuidShort';
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.servers.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null, this
        );
        return this._patch(data);
    }

    /**
     * Creates a user account.
     * @param options Create user options.
     * @see {@link CreateUserOptions}.
     * @returns The new user.
     */
    async create(options: CreateUserOptions): Promise<User> {
        const payload = caseConv.toSnakeCase<object>(
            options,
            {
                map:{
                    firstname: 'first_name',
                    lastname: 'last_name',
                    isAdmin: 'root_admin'
                }
            }
        );

        const data = await this.client.requests.post(
            endpoints.users.main, payload
        );
        return this._patch(data);
    }

    /**
     * Updates the user account with the specified options.
     * @param id The ID of the user.
     * @param options Update user options.
     * @see {@link UpdateUserOptions}.
     * @returns The updated user.
     */
    async update(id: number, options: Partial<UpdateUserOptions>): Promise<User> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update user.');

        const user = await this.fetch(id);
        options.username ||= user.username;
        options.firstname ||= user.firstname;
        options.lastname ||= user.lastname;
        options.email ||= user.email;
        options.isAdmin ??= user.isAdmin;

        const payload = caseConv.toSnakeCase<object>(
            options,
            {
                map:{
                    firstname: 'first_name',
                    lastname: 'last_name',
                    isAdmin: 'root_admin'
                }
            }
        );

        const data = await this.client.requests.patch(
            endpoints.users.get(id), payload
        );
        return this._patch(data);
    }

    /**
     * Deletes a user account.
     * @param id The ID of the user.
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.users.get(id));
        this.cache.delete(id);
    }
}
