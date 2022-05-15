import { existsSync, writeFileSync } from 'fs';
import type { PteroClient } from '.';
import { Dict } from '../structures/Dict';
import { File, FileChmodData } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class FileManager {
    public client: PteroClient;
    public cache: Dict<string, Dict<string, File>>;
    public serverId: string;

    constructor(client: PteroClient, serverId: string) {
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    _patch(dir: string, data: any): Dict<string, File> {
        const res = new Dict<string, File>();
        for (let o of data.data) {
            let f = caseConv.toCamelCase<File>(o.attributes);
            f.modeBits = BigInt(f.modeBits);
            f.createdAt = new Date(f.createdAt);
            f.modifiedAt &&= new Date(f.modifiedAt);
            res.set(f.name, f);
        }

        const hold = this.cache.get(dir) || new Dict();
        this.cache.set(dir, hold.join(res));
        return res;
    }

    private clean(path: string): string {
        if (path.startsWith('.')) path = path.slice(1);
        return encodeURIComponent(path);
    }

    async fetch(dir: string = '/'): Promise<Dict<string, File>> {
        const data = await this.client.requests.get(
            endpoints.servers.files.main(this.serverId) +
            `?directory=${this.clean(dir)}`
        );
        return this._patch(dir, data);
    }

    async getContents(path: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.contents(this.serverId, this.clean(path))
        );
        return data.toString();
    }

    async getDownloadURL(path: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.download(this.serverId, this.clean(path))
        );
        return data.attributes.url;
    }

    async download(path: string, dest: string): Promise<void> {
        if (existsSync(dest)) throw new Error(
            'A file or directory exists at this path.'
        );

        const url = await this.getDownloadURL(path);
        const data = await this.client.requests.raw('GET', url);
        writeFileSync(dest, data.toString(), { encoding: 'utf-8' });
    }

    async getUploadURL(dir: string = '/'): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.upload(this.serverId) +
            `?directory=${this.clean(dir)}`
        );
        return data.attributes.url;
    }

    /** @todo */
    private async upload(dir: string, file: string) {}

    async write(path: string, content: any): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.write(this.serverId, this.clean(path)),
            { raw: content }
        );
    }

    async createFolder(path: string, name: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.create(this.serverId),
            { root: path, name }
        );
    }

    async rename(path: string, name: string): Promise<void> {
        await this.client.requests.put(
            endpoints.servers.files.rename(this.serverId),
            {
                root: path,
                files:[{
                    from: path.split('/').pop(),
                    to: name
                }]
            }
        );
    }

    /** @todo Add warning for request note */
    async chmod(dir: string, files: FileChmodData[]): Promise<void> {
        files = files.map(f => {
            if (f.file.startsWith('.')) f.file = f.file.slice(1);
            return f;
        });

        await this.client.requests.post(
            endpoints.servers.files.chmod(this.serverId),
            { root: dir, files }
        );
    }

    async copy(path: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.copy(this.serverId),
            { location: path }
        );
    }

    async compress(dir: string, files: string[]): Promise<Dict<string, File>> {
        files = files.map(f => f.startsWith('.') ? f.slice(1) : f);
        const data = await this.client.requests.post(
            endpoints.servers.files.compress(this.serverId),
            { root: dir, files }
        );
        return this._patch(dir, data);
    }

    async decompress(dir: string, file: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.decompress(this.serverId),
            { root: dir, file }
        );
    }

    async delete(dir: string, files: string[]): Promise<void> {
        files = files.map(f => f.startsWith('.') ? f.slice(1) : f);
        await this.client.requests.post(
            endpoints.servers.files.delete(this.serverId),
            { root: dir, files }
        );
    }
}
