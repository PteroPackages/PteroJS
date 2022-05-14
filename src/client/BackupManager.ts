import { existsSync, writeFileSync } from 'fs';
import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Backup, CreateBackupOptions } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class BackupManager extends BaseManager {
    public client: PteroClient;
    public cache: Dict<string, Backup>;
    public serverId: string;

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['password']);
    }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict<string, Backup>();
        this.serverId = serverId;
    }

    _patch(data: any): Backup | Dict<string, Backup> {
        if (data.data) {
            const res = new Dict<string, Backup>();
            for (let o of data.data) {
                const b = caseConv.toCamelCase<Backup>(o.attributes, {
                    map:{
                        is_successful: 'successful',
                        is_locked: 'locked'
                    }
                });
                b.createdAt = new Date(b.createdAt);
                b.completedAt &&= new Date(b.completedAt);
                res.set(b.uuid, b);
            }
            this.cache = this.cache.join(res);
            return res;
        }

        const b = caseConv.toCamelCase<Backup>(data.attributes, {
            map:{
                is_successful: 'successful',
                is_locked: 'locked'
            }
        });
        b.createdAt = new Date(b.createdAt);
        b.completedAt &&= new Date(b.completedAt);
        this.cache.set(b.uuid, b);
        return b;
    }

    async fetch<T extends string | undefined>(
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<T extends undefined ? Dict<string, Backup> : Backup> {
        if (id && !options.force) {
            const b = this.cache.get(id);
            if (b) return Promise.resolve<any>(b);
        }

        const data = await this.client.requests.get(
            id
                ? endpoints.servers.backups.get(this.serverId, id)
                : endpoints.servers.backups.main(this.serverId),
            options, this
        );
        return this._patch(data) as any;
    }

    async create(options: CreateBackupOptions = {}): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.main(this.serverId),
            options
        );
        return this._patch(data) as any;
    }

    async toggleLock(id: string): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.lock(this.serverId, id)
        );
        return this._patch(data) as any;
    }

    async getDownloadURL(id: string): Promise<string> {
        const data: any = await this.client.requests.get(
            endpoints.servers.backups.download(this.serverId, id), {}
        );
        return data.attributes.url;
    }

    async download(id: string, dest: string): Promise<void> {
        if (existsSync(dest)) throw new Error(
            'A file or directory exists at this path.'
        );

        const url = await this.getDownloadURL(id);
        const data: any = await this.client.requests._raw(url, undefined, {}, 'GET');
        writeFileSync(dest, data.toString(), { encoding: 'utf-8' });
    }

    async restore(id: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.backups.restore(this.serverId, id)
        );
    }

    async delete(id: string): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.backups.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
