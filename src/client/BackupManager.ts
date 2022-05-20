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

    /** Allowed filter arguments for backups. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for backups. */
    get INCLUDES() {
        return Object.freeze(['password']);
    }

    /** Allowed sort arguments for backups. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    _patch(data: any): any {
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

    /**
     * Fetches a backup or a list of backups from the Pterodactyl API.
     * @param [id] The UUID of the backup.
     * @param [options] Additional fetch options.
     * @returns The fetched backup(s).
     */
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
            options, null, this
        );
        return this._patch(data);
    }

    /**
     * Creates a new backup on the server.
     * @param options Create backup options.
     * @see {@link CreateBackupOptions}.
     * @returns The new backup.
     */
    async create(options: CreateBackupOptions = {}): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.main(this.serverId),
            options
        );
        return this._patch(data);
    }

    /**
     * Toggles the locked status of a backup.
     * @param id The UUID of the backup.
     * @returns The updated backup.
     */
    async toggleLock(id: string): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.lock(this.serverId, id)
        );
        return this._patch(data);
    }

    /**
     * Fetches the download URL for a specified backup.
     * @param id The UUID of the backup.
     * @returns The download URL.
     */
    async getDownloadURL(id: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.backups.download(this.serverId, id)
        );
        return data.attributes.url;
    }

    /**
     * Fetches and saves a backup to a specified path on the system.
     * @param id The UUID of the backup.
     * @param dest The file path to save the backup to.
     */
    async download(id: string, dest: string): Promise<void> {
        if (existsSync(dest)) throw new Error(
            'A file or directory exists at this path.'
        );

        const url = await this.getDownloadURL(id);
        const data = await this.client.requests.raw('GET', url);
        writeFileSync(dest, data.toString(), { encoding: 'utf-8' });
    }

    /**
     * Restores a specified backup to the server.
     * @param id The UUID of the backup.
     */
    async restore(id: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.backups.restore(this.serverId, id)
        );
    }

    /**
     * Deletes a specified backup.
     * @param id The UUID of the backup.
     */
    async delete(id: string): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.backups.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
