import axios, { Axios, AxiosError, AxiosResponse } from 'axios';
import { EventEmitter } from 'events';
import type { BaseManager } from '../structures/BaseManager';
import {
    APIErrorResponse,
    PteroAPIError,
    RequestError
} from '../structures/Errors';
import { FetchOptions, RequestEvents } from '../common';
import { buildQuery } from '../util/query';
import { version } from '../../package.json';

type Method =
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE';

export class RequestManager extends EventEmitter {
    public instance: Axios;
    public _ping: number;
    private _start: number;

    constructor(
        private _type: string,
        public _domain: string,
        public _auth: string
    ) {
        super();
        this.instance = axios.create({
            baseURL: `${this._domain}/api/${this._type.toLowerCase()}`
        });
        this._ping = -1;
        this._start = 0;
    }

    emit<E extends keyof RequestEvents>(
        event: E,
        ...args: RequestEvents[E]
    ): boolean {
        return super.emit(event, ...args);
    }

    on<E extends keyof RequestEvents>(
        event: E,
        listener: (...args: RequestEvents[E]) => void
    ): this {
        super.on(event, listener);
        return this;
    }

    once<E extends keyof RequestEvents>(
        event: E,
        listener: (...args: RequestEvents[E]) => void
    ): this {
        super.once(event, listener);
        return this;
    }

    off<E extends keyof RequestEvents>(
        event: E,
        listener: (...args: RequestEvents[E]) => void
    ): this {
        super.off(event, listener);
        return this;
    }

    getHeaders(): Record<string, string> {
        return {
            'User-Agent': `PteroJS ${this._type} v${version}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json, text/plain',
            'Authorization': `Bearer ${this._auth}`
        }
    }

    private debug(...data: string[]): void {
        data
            .map(d => `[HTTP] ${d}`)
            .forEach(d => super.emit('debug', d));
    }

    async _make(method: Method, path: string, body?: any) {
        const headers = this.getHeaders();
        if (body !== null && body !== undefined) {
            if (typeof body === 'string') {
                headers['Content-Type'] = 'text/plain';
            } else {
                body = JSON.stringify(body);
            }
            super.emit('preRequest', body);
        }

        this.debug(
            `requesting: ${method} ${path}`,
            `payload: ${body ? headers['Content-Type'] : 'none'}`
        );
        this._start = Date.now();
        return await this.instance.request({
            method,
            url: path,
            headers,
            data: body
        })
            .then(r => this.handleResponse(r))
            .catch(e => this.handleError(e));
    }

    async raw(method: Method, url: string, body?: any) {
        const headers = this.getHeaders();
        if (body !== null && body !== undefined) {
            if (typeof body === 'string') {
                headers['Content-Type'] = 'text/plain';
            } else {
                body = JSON.stringify(body);
            }
            super.emit('preRequest', body);
        }

        this.debug(
            `requesting: ${method} ${url}`,
            `payload: ${body ? headers['Content-Type'] : 'none'}`
        );
        this._start = Date.now();
        return await axios.request({
            url,
            method,
            headers,
            data: body
        })
            .then(r => this.handleResponse(r))
            .catch(e => this.handleError(e));
    }

    private handleResponse(res: AxiosResponse): any {
        this._ping = Date.now() - this._start;
        this.debug(
            `received status: ${res.status} (${this._ping}ms)`,
            `body: ${res.data ? res.headers['content-type'] : 'none'}`
        );

        if ([202, 204].includes(res.status)) return;
        super.emit('postRequest', res.data);

        if (res.data.object && res.data.object === 'null_resource')
            // TODO: retry request instead of throwing an error
            throw new RequestError('Request returned a null resource object');

        return res.data;
    }

    private handleError(err: AxiosError): any {
        this._ping = Date.now() - this._start;
        this.debug(
            `received error: ${err.name} (${this._ping}ms)`,
            `message: ${err.message}`
        );

        if (err.response === undefined) throw new RequestError(
            `An unknown request error occurred: ${err.message}`
        );

        if (err.response!.status >= 500) throw new RequestError(
            `Received an unexpected response from the API `+
            `(code ${err.response.status})`
        );

        throw new PteroAPIError(err.response.data as APIErrorResponse);
    }

    get(path: string, params?: FetchOptions, body?: any, cls?: BaseManager) {
        const query = params && cls
            ? buildQuery(params, cls.getQueryOptions())
            : '';

        return this._make('GET', path + query, body);
    }

    post(path: string, body?: any) {
        return this._make('POST', path, body);
    }

    patch(path: string, body?: any) {
        return this._make('PATCH', path, body);
    }

    put(path: string, body?: any) {
        return this._make('PUT', path, body);
    }

    delete(path: string, body?: any): Promise<void> {
        return this._make('DELETE', path, body);
    }
}
