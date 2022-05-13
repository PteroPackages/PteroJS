import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { CreateUserOptions } from '../common/app';
import { User } from '../structures/User';
import { UpdateUserOptions } from '../common/app';
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

    get FILTERS(): Readonly<string[]> {
        return Object.freeze([
            'email', 'uuid', 'uuidShort',
            'username', 'image', 'external_id'
        ]);
    }

    get INCLUDES(): Readonly<string[]> { return Object.freeze([]); }

    get SORTS(): Readonly<string[]> {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict<number, User>();
    }

    _patch(data: any): User | Dict<number, User> {
        if (data?.data) {
            const res = new Dict<number, User>();
            for (const obj of data.data) {
                const s = new User(this.client, obj.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) res.forEach(
                (v, k) => this.cache.set(k, v)
            );
            return res;
        }

        const s = new User(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(s.id, s);
        return s;
    }

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

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/users/view/${id}`;
    }

    async fetch<T extends number | string | undefined>(
        id?: T,
        options: External<Include<FetchOptions>> = {}
    ): Promise<T extends undefined ? Dict<number, User> : User> {
        if (typeof id === 'number' && !options.force) {
            const u = this.cache.get(id);
            if (u) return Promise.resolve<any>(u);
        }
        if (typeof id === 'string' && !options.external)
            throw new TypeError("The 'external' option must be set to fetch externally");

        const data = await this.client.requests.get(
            options.external && id
                ? endpoints.users.ext(id as string)
                : (id ? endpoints.users.get(id as number) : endpoints.users.main),
            options, this
        );
        return this._patch(data) as any;
    }

    /** @deprecated Use {@link UserManager.fetch} with `options.external`. */
    async fetchExternal(id: string, options: Include<FetchOptions>): Promise<User> {
        if (!options.force) {
            const u = this.cache.find(u => u.externalId === id);
            if (u) return Promise.resolve<any>(u);
        }

        const data = await this.client.requests.get(
            endpoints.users.ext(id), options, this
        );
        return this._patch(data) as any;
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, User>> {
        if (!options.sort && !options.filter) throw new Error('Sort or filter is required.');
        if (options.filter === 'identifier') options.filter = 'uuidShort';
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.servers.main,
            payload as FilterArray<Sort<FetchOptions>>,
            this
        );
        return this._patch(data) as any;
    }

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
        return this._patch(data) as User;
    }

    async update(id: number, options: UpdateUserOptions): Promise<User> {
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
        return this._patch(data) as any;
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.users.get(id));
        this.cache.delete(id);
    }
}
