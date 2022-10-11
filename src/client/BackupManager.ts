import { existsSync, writeFileSync } from 'fs';
import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { ValidationError } from '../structures/Errors';
import { FetchOptions, Include } from '../common';
import { Backup, CreateBackupOptions } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class BackupManager extends BaseManager {
    public client: PteroClient;
    public cache: Dict<string, Backup>;
    public serverId: string;

    /** Allowed filter arguments for backups (none). */
    get FILTERS() {
        return Object.freeze([]);
    }

    /** Allowed include arguments for backups (none). */
    get INCLUDES() {
        return Object.freeze([]);
    }

    /** Allowed sort arguments for backups (none). */
    get SORTS() {
        return Object.freeze([]);
    }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    /**
     * Transforms the raw backup object(s) into typed objects.
     * @param data The resolvable backup object(s).
     * @returns The resolved backup object(s).
     */
    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<string, Backup>();
            for (let o of data.data) {
                const b = caseConv.toCamelCase<Backup>(o.attributes, {
                    map: {
                        is_successful: 'successful',
                        is_locked: 'locked',
                    },
                });
                b.createdAt = new Date(b.createdAt);
                b.completedAt &&= new Date(b.completedAt);
                res.set(b.uuid, b);
            }
            this.cache.update(res);
            return res;
        }

        const b = caseConv.toCamelCase<Backup>(data.attributes, {
            map: {
                is_successful: 'successful',
                is_locked: 'locked',
            },
        });
        b.createdAt = new Date(b.createdAt);
        b.completedAt &&= new Date(b.completedAt);
        this.cache.set(b.uuid, b);
        return b;
    }

    /**
     * Fetches a backup from the API by its identifier. This will check the cache first unless the
     * force option is specified.
     *
     * @param id The identifier of the backup.
     * @param [options] Additional fetch options.
     * @returns The fetched backup.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.fetch({ perPage: 10 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(id: string, options?: Include<FetchOptions>): Promise<Backup>;
    /**
     * Fetches a list of backups from the API with the given options (default is undefined).
     *
     * @param [options] Additional fetch options.
     * @returns The fetched backups.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.fetch({ perPage: 10 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, Backup>>;
    async fetch(
        op?: string | Include<FetchOptions>,
        ops: Include<FetchOptions> = {},
    ): Promise<any> {
        let path = endpoints.servers.backups.main(this.serverId);
        if (typeof op === 'string') {
            if (!ops.force && this.cache.has(op)) return this.cache.get(op);

            path = endpoints.servers.backups.get(this.serverId, op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Creates a new backup on the server.
     * @see {@link CreateBackupOptions}.
     *
     * @param options Create backup options.
     * @returns The new backup.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.create({ name: 'bungee-archive' })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async create(options: CreateBackupOptions = {}): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.main(this.serverId),
            options,
        );
        return this._patch(data);
    }

    /**
     * Toggles the locked status of a backup.
     * @param id The UUID of the backup.
     * @returns The updated backup.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.toggleLock('904df120')
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async toggleLock(id: string): Promise<Backup> {
        const data = await this.client.requests.post(
            endpoints.servers.backups.lock(this.serverId, id),
        );
        return this._patch(data);
    }

    /**
     * Fetches the download URL for a specified backup.
     * @param id The UUID of the backup.
     * @returns The download URL.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.getDownloadURL('904df120')
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async getDownloadURL(id: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.backups.download(this.serverId, id),
        );
        return data.attributes.url;
    }

    /**
     * Fetches and saves a backup to a specified path on the system.
     * @param id The UUID of the backup.
     * @param dest The file path to save the backup to.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.download('904df120', './bungee-archive.tar.gz')
     *  .catch(console.error);
     * ```
     */
    async download(id: string, dest: string): Promise<void> {
        if (existsSync(dest))
            throw new ValidationError(
                'A file or directory exists at this path.',
            );

        const url = await this.getDownloadURL(id);
        const data = await this.client.requests.raw('GET', url);
        writeFileSync(dest, data.toString(), { encoding: 'utf-8' });
    }

    /**
     * Restores a specified backup to the server.
     * @param id The UUID of the backup.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.restore('904df120').catch(console.error);
     * ```
     */
    async restore(id: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.backups.restore(this.serverId, id),
        );
    }

    /**
     * Deletes a specified backup.
     * @param id The UUID of the backup.
     * @example
     * ```
     * const server = await client.servers.fetch('34740510');
     * await server.backups.delete('c4b9c4c7').catch(console.error);
     * ```
     */
    async delete(id: string): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.backups.get(this.serverId, id),
        );
        this.cache.delete(id);
    }
}
