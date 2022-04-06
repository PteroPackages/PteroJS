import { UpdateUserOptions } from './../common/app';
import BaseManager from '../structures/BaseManager';
import Dict from '../structures/Dict';
import type PteroApp from './app';
import { PteroUser } from './../structures/User';
import {
    External,
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    Resolvable,
    Sort
} from '../common';
import { CreateUserOptions } from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export default class UserManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, PteroUser>;

    get FILTERS(): Readonly<string[]> {
        return Object.freeze([
            'email', 'uuid', 'uuidShort',
            'username', 'image', 'external_id'
        ]);
    }

    get INCLUDES(): Readonly<string[]> { return [] }

    get SORTS(): Readonly<string[]> {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict<number, PteroUser>();
    }

    _patch(data: any): PteroUser | Dict<number, PteroUser> {
        if (data?.data) {
            const res = new Dict<number, PteroUser>();
            for (const obj of data.data) {
                const s = new PteroUser(this.client, obj.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) res.forEach(
                (v, k) => this.cache.set(k, v)
            );
            return res;
        }

        const s = new PteroUser(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(s.id, s);
        return s;
    }

    resolve(obj: Resolvable<PteroUser>): PteroUser | undefined {
        if (obj instanceof PteroUser) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(
            s => (s.username === obj) || (s.firstname === obj) || (s.lastname === obj)
        );
        if (obj.relationships?.user)
            return this._patch(obj.relationships.user) as PteroUser;

        return undefined;
    }

    adminURLFor(user: number | PteroUser): string {
        return `${this.client.domain}/admin/users/view/${
            typeof user === 'number' ? user : user.id
        }`;
    }

    async fetch<T extends number | undefined>(
        id?: T,
        options: External<Include<FetchOptions>> = {}
    ): Promise<T extends undefined ? PteroUser : Dict<number, PteroUser>> {
        if (id && !options.force) {
            const u = this.cache.get(id);
            if (u) return Promise.resolve<any>(u);
        }

        const data = await this.client.requests.get(
            (id ? endpoints.users.get(id) : endpoints.users.main),
            options, this
        );
        return this._patch(data) as any;
    }

    /** @deprecated Use {@link UserManager.fetch} with `options.external`. */
    async fetchExternal(id: string, options: Include<FetchOptions>): Promise<PteroUser> {
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
    ): Promise<Dict<number, PteroUser>> {
        if (!options.sort && !options.filter) throw new Error('Sort or filter is required.');
        if (options.filter === 'identifier') options.filter = 'uuidShort';
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [entity, options.filter];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.servers.main,
            payload as FilterArray<Sort<FetchOptions>>,
            this
        );
        return this._patch(data) as any;
    }

    async create(options: CreateUserOptions): Promise<PteroUser> {
        const payload = caseConv.toSnakeCase(
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
            endpoints.users.main, options
        );
        return this._patch(data) as PteroUser;
    }

    async update(user: number | PteroUser, options: UpdateUserOptions): Promise<PteroUser> {
        const id = typeof user === 'number' ? user : user.id;
        const payload = caseConv.toSnakeCase(
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

    async delete(user: number | PteroUser): Promise<true> {
        const id = typeof user === 'number' ? user : user.id;
        await this.client.requests.delete(endpoints.users.get(id));
        this.cache.delete(id);
        return true;
    }
}
