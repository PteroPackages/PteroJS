import { existsSync, writeFileSync } from 'fs';
import type { PteroClient } from '.';
import { Dict } from '../structures/Dict';
import { ValidationError } from '../structures/Errors';
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

    /**
     * Returns a URI-encoded UNIX version of the specified path for requests.
     * @param path The path to clean.
     * @returns The cleaned path.
     */
    private clean(path: string): string {
        if (path.startsWith('.')) path = path.slice(1);
        return encodeURIComponent(path);
    }

    /**
     * Fetches the files/directories in a specified direcory (defaults to root).
     * @param [dir] The directory to fetch from.
     * @returns The fetched files.
     */
    async fetch(dir: string = '/'): Promise<Dict<string, File>> {
        const data = await this.client.requests.get(
            endpoints.servers.files.main(this.serverId) +
            `?directory=${this.clean(dir)}`
        );
        return this._patch(dir, data);
    }

    /**
     * Fetches the contents of a specified file. The content is always returned as a
     * string by default, regardless of file type.
     * @param path The file path.
     * @returns The file contents.
     */
    async getContents(path: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.contents(this.serverId, this.clean(path))
        );
        return data.toString();
    }

    /**
     * Fetches the download URL for a specified file.
     * @param path The file path.
     * @returns The download URL.
     */
    async getDownloadURL(path: string): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.download(this.serverId, this.clean(path))
        );
        return data.attributes.url;
    }

    /**
     * Fetches and saves a file to a specified path on the system.
     * @param path The file path.
     * @param dest The file path to save the file to.
     */
    async download(path: string, dest: string): Promise<void> {
        if (existsSync(dest)) throw new ValidationError(
            'A file or directory exists at this path.'
        );

        const url = await this.getDownloadURL(path);
        const data = await this.client.requests.raw('GET', url);
        writeFileSync(dest, data.toString(), { encoding: 'utf-8' });
    }

    /**
     * Fetches the upload URL for a specified directory (defaults to root).
     * @param [dir] The directory the files should be uploaded to.
     * @returns The upload URL.
     */
    async getUploadURL(dir: string = '/'): Promise<string> {
        const data = await this.client.requests.get(
            endpoints.servers.files.upload(this.serverId) +
            `?directory=${this.clean(dir)}`
        );
        return data.attributes.url;
    }

    /**
     * Uploads a file from the system to a specified directory on the server.
     * @param dir The directory the files should be uploaded to.
     * @param file The path to the file on the system.
     * @todo
     */
    private async upload(dir: string, file: string): Promise<void> {}

    /**
     * Writes the content to a specified file.
     * @param path The file path.
     * @param content The content to write.
     */
    async write(path: string, content: any): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.write(this.serverId, this.clean(path)),
            { raw: content }
        );
    }

    /**
     * Creates a folder in a specified root folder.
     * @param path The root path to create the directory in.
     * @param name The name of the directory.
     */
    async createFolder(path: string, name: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.create(this.serverId),
            { root: path, name }
        );
    }

    /**
     * Renames one or more files in a specified directory.
     * @param path The root path of the files.
     * @param files The file rename descriptors.
     */
    async rename(path: string, files:{ from: string; to: string }[]): Promise<void> {
        await this.client.requests.put(
            endpoints.servers.files.rename(this.serverId),
            { root: path, files }
        );
    }

    /**
     * Changes the permissions on one or more files in a specified directory.
     * @param dir The root path of the files.
     * @param files The file mode descriptors.
     */
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

    /**
     * Copies the specified file in its directory.
     * @param path The path of the file to copy.
     */
    async copy(path: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.copy(this.serverId),
            { location: path }
        );
    }

    /**
     * Compresses the specified files into a zip file.
     * @param dir The root directory of the files.
     * @param files The files to be compressed.
     * @returns The compressed files.
     */
    async compress(dir: string, files: string[]): Promise<Dict<string, File>> {
        files = files.map(f => f.startsWith('.') ? f.slice(1) : f);
        const data = await this.client.requests.post(
            endpoints.servers.files.compress(this.serverId),
            { root: dir, files }
        );
        return this._patch(dir, data);
    }

    /**
     * Decompresses the specified file in its directory.
     * @param dir The root directory of the file.
     * @param file The file to decompress.
     */
    async decompress(dir: string, file: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.files.decompress(this.serverId),
            { root: dir, file }
        );
    }

    /**
     * Deletes one or more files in the specified directory.
     * @param dir The root directory of the files.
     * @param files The files to delete.
     */
    async delete(dir: string, files: string[]): Promise<void> {
        files = files.map(f => f.startsWith('.') ? f.slice(1) : f);
        await this.client.requests.post(
            endpoints.servers.files.delete(this.serverId),
            { root: dir, files }
        );
    }
}
