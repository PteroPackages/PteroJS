export interface APIErrorResponse {
    errors:{
        code:   string;
        status: string;
        detail: string;
        meta?:  unknown;
    }[];
}

export class PteroAPIError extends Error {
    public readonly codes: string[];
    public readonly meta: unknown;

    constructor(data: APIErrorResponse) {
        const fmt = data.errors.map(
            e => `- ${e.status}: ${e.detail || 'No details provided'}`
        ).join('\n');

        super('\n'+ fmt);
        this.codes = data.errors.map(e => e.code);
        this.meta = data.errors.map(e => e.meta);
    }
}

export class RequestError extends Error {}

export class WebSocketError extends Error {}
