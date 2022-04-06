import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import { APIErrorResponse, PteroAPIError, RequestError } from '../structures/Errors';
import type BaseManager from '../structures/BaseManager';
import buildQuery from '../util/query';
import { FetchOptions } from '../common';
import { version } from '../../package.json';

export type Method =
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE';

export default class RestRequestManager extends EventEmitter {
    private type: string;
    public domain: string;
    public auth: string;
    public ping: number;

    constructor(type: string, domain: string, auth: string) {
        super();

        this.type = type;
        this.domain = domain;
        this.auth = auth;
        this.ping = -1;
    }

    getHeaders(): { [key: string]: string } {
        return {
            'User-Agent': `${this.type} PteroJS v${version}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.auth}`
        }
    }

    private debug(message: string): void {
        super.emit('debug', message);
    }

    async _make(
        path: string,
        params: object | undefined,
        method: Method
    ): Promise<object | Buffer | void> {
        let body = undefined;
        if (params !== undefined) {
            if ('raw' in params) body = (params as { raw: string }).raw;
            else body = JSON.stringify(params);
        }

        const start = Date.now();
        const res = await fetch(
            `${this.domain}/${this.type.toLocaleLowerCase()}/${path}`,
            {
                method,
                body,
                headers: this.getHeaders()
            }
        );
        this.ping = Date.now() - start;
        this.debug(`received status: ${res.status} (${this.ping}ms)`);

        if ([202, 204].includes(res.status)) return;
        let data: object | Buffer;

        if (res.headers.get('content-type') === 'application/json') {
            data = await res.json().catch(null);
        } else {
            data = await res.buffer().catch(null);
        }

        if (data) {
            super.emit('reveive', data);
            if (res.ok) return data;
            if (res.status >= 400 && res.status < 500)
                throw new PteroAPIError(data as APIErrorResponse);
        }

        throw new RequestError(
            'Pterodactyl API returned an invalid or unacceptable response '+
            `(status: ${res.status})`
        );
    }

    async get(path: string, params: FetchOptions, cls: BaseManager) {
        const query = buildQuery(params, cls.getQueryOptions());
        return this._make(path + query, undefined, 'GET');
    }

    async post(path: string, data: object = {}) {
        return this._make(path, data, 'POST');
    }

    async patch(path: string, data: object = {}) {
        return this._make(path, data, 'PATCH');
    }

    async put(path: string, data: object = {}) {
        return this._make(path, data, 'PUT');
    }

    async delete(path: string) {
        return this._make(path, undefined, 'DELETE');
    }
}
