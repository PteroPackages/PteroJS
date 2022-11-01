import type { PteroApp } from '.';
import { Dict } from '../structures/Dict';
import { CreateUserOptions } from '../common/app';
import { User } from '../structures/User';
import { UpdateUserOptions } from '../common/app';
import {
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    PaginationMeta,
    Resolvable,
    Sort,
} from '../common';
import { ValidationError } from '../structures/Errors';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';
import { BaseManagerFetchAll } from '../structures/BaseManagerFetchAll';

export class UserManager extends BaseManagerFetchAll {
    public client: PteroApp;
    public cache: Dict<number, User>;

    /**
     * Allowed filter arguments for users:
     * * email
     * * uuid
     * * username
     * * externalId
     */
    get FILTERS() {
        return Object.freeze(['email', 'uuid', 'username', 'external_id']);
    }

    /**
     * Allowed include arguments for users:
     * * servers
     */
    get INCLUDES() {
        return Object.freeze(['servers']);
    }

    /**
     * Allowed sort arguments for users:
     * * id
     * * -id
     * * uuid
     * * -uuid
     */
    get SORTS() {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.meta = {
            current: 0,
            total: 0,
            count: 0,
            perPage: 0,
            totalPages: 0,
        };
    }

    /**
     * Transforms the raw user object(s) into class objects.
     * @param data The resolvable user object(s).
     * @returns The resolved user object(s).
     */
    _patch(data: any): any {
        if (data?.meta?.pagination) {
            this.meta = caseConv.toCamelCase(data.meta.pagination, {
                ignore: ['current_page'],
            });
            this.meta.current = data.meta.pagination.current_page;
        }

        if (data?.data) {
            const res = new Dict<number, User>();
            for (const o of data.data) {
                const s = new User(this.client, o.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache)
                this.cache = this.cache.join(res);
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
        if (typeof obj === 'string')
            return this.cache.find(
                s =>
                    s.username === obj ||
                    s.firstname === obj ||
                    s.lastname === obj,
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
     * Fetches a user from the API by its ID. This will check the cache first unless the force
     * option is specified.
     *
     * @param id The ID of the user.
     * @param [options] Additional fetch options.
     * @returns The fetched user.
     * @example
     * ```
     * app.users.fetch(5).then(console.log).catch(console.error);
     * ```
     */
    async fetch(id: number, options?: Include<FetchOptions>): Promise<User>;
    /**
     * Fetches a user from the API by its external ID. This will check the cache first unless the
     * force option is specified.
     *
     * @param id The external ID of the user.
     * @param [options] Additional fetch options.
     * @returns The fetched user.
     * @example
     * ```
     * app.users.fetch('admin').then(console.log).catch(console.error);
     * ```
     */
    async fetch(id: string, options?: Include<FetchOptions>): Promise<User>;
    /**
     * Fetches a list of users from the API with the given options (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     *
     * @param [options] Additional fetch options.
     * @returns The fetched users.
     * @example
     * ```
     * app.users.fetch({ perPage: 20 }).then(console.log).catch(console.error);
     * ```
     */
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, User>>;
    async fetch(
        op?: number | string | Include<FetchOptions>,
        ops: Include<FetchOptions> = {},
    ): Promise<any> {
        let path: string;
        switch (typeof op) {
            case 'number': {
                if (!ops.force && this.cache.has(op)) return this.cache.get(op);

                path = endpoints.users.get(op);
                break;
            }
            case 'string': {
                if (!ops.force) {
                    const u = this.cache.find(u => u.externalId === op);
                    if (u) return u;
                }

                path = endpoints.users.ext(op);
                break;
            }
            case 'undefined':
            case 'object': {
                path = endpoints.users.main;
                if (op) ops = op;
                break;
            }
            default:
                throw new ValidationError(
                    `expected user id, external id or fetch options; got ${typeof op}`,
                );
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /** @deprecated Use {@link UserManager.fetch}. */
    fetchExternal(id: string, options: Include<FetchOptions>): Promise<User> {
        return this.fetch(id, options);
    }

    /**
     * Fetches all users from the API with the given options (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     *
     * @param [options] Additional fetch options.
     * @returns The fetched users.
     * @example
     * ```
     * app.users.fetchAll({ perPage: 20 }).then(console.log).catch(console.error);
     * ```
     */
    async fetchAll(options?: Include<FetchOptions>): Promise<Dict<number, User>> {
        return this.getFetchAll(options);
    }

    /**
     * Queries the API for users that match the specified query filters. This fetches from the
     * API directly and does not check the cache. Use cache methods for filtering and sorting.
     *
     * Available query filters:
     * * email
     * * uuid
     * * username
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
     * @example
     * ```
     * app.users.query('d5f506c9', { filter: 'uuid' })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>,
    ): Promise<Dict<number, User>> {
        if (!options.sort && !options.filter)
            throw new ValidationError('Sort or filter is required.');
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.users.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null,
            this,
        );
        return this._patch(data);
    }

    /**
     * Creates a user account.
     * @see {@link CreateUserOptions}.
     * @param options Create user options.
     * @returns The new user.
     * @example
     * ```
     * app.users.create({
     *  email: 'user@example.com',
     *  username: 'example-user',
     *  firstname: 'example',
     *  lastname: 'user',
     *  externalId: 'example1'
     * })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async create(options: CreateUserOptions): Promise<User> {
        const payload = caseConv.toSnakeCase<object>(options, {
            map: {
                firstname: 'first_name',
                lastname: 'last_name',
                isAdmin: 'root_admin',
            },
        });

        const data = await this.client.requests.post(
            endpoints.users.main,
            payload,
        );
        return this._patch(data);
    }

    /**
     * Updates the user account with the specified options.
     * @see {@link UpdateUserOptions}.
     * @param id The ID of the user.
     * @param options Update user options.
     * @returns The updated user.
     * @example
     * ```
     * app.users.update(7, { externalId: 'admin2', isAdmin: true })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async update(
        id: number,
        options: Partial<UpdateUserOptions>,
    ): Promise<User> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update user.');

        const user = await this.fetch(id);
        options.username ||= user.username;
        options.firstname ||= user.firstname;
        options.lastname ||= user.lastname;
        options.email ||= user.email;
        options.isAdmin ??= user.isAdmin;
        if (!('externalId' in options)) options.externalId = user.externalId;

        const payload = caseConv.toSnakeCase<object>(options, {
            map: {
                firstname: 'first_name',
                lastname: 'last_name',
                isAdmin: 'root_admin',
            },
        });

        const data = await this.client.requests.patch(
            endpoints.users.get(id),
            payload,
        );
        return this._patch(data);
    }

    /**
     * Deletes a user account.
     * @param id The ID of the user.
     * @example
     * ```
     * app.users.delete(8).catch(console.error);
     * ```
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.users.get(id));
        this.cache.delete(id);
    }
}
