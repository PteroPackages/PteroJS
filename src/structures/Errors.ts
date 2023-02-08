/** Represents an API error response object. */
export interface APIErrorResponse {
    errors: {
        code: string;
        status: string;
        detail: string;
        meta?: unknown;
    }[];
}

/** Thown when an API error is received (usually 4xx errors). */
export class PteroAPIError extends Error {
    public readonly codes: string[];
    public readonly meta: unknown;

    constructor(data: APIErrorResponse) {
        const fmt = data.errors
            .map(e => `- ${e.status}: ${e.detail || 'No details provided'}`)
            .join('\n');

        super('\n' + fmt);
        this.codes = data.errors.map(e => e.code);
        this.meta = data.errors.map(e => e.meta).filter(Boolean);
    }
}

/** Thrown when a non-API error is encountered. */
export class RequestError extends Error {}

/** Thown when a validation a method, object or other fails to be validated. */
export class ValidationError extends Error {
    constructor(message: string);
    constructor(key: string, expected: any, got: any);
    constructor(...args: unknown[]) {
        switch (args.length) {
            case 3:
                super(
                    `Failed to validate ${args[0]}: ` +
                        `expected ${args[1]}; got ${args[2]}`,
                );
                break;
            case 2:
                break; // not sure what to do with this yet.
            case 1:
                super(`Validation: ${args[0] as string}`);
                break;
            default:
                super('Validation check failed.');
                break;
        }
    }
}

/** Thrown when a websocket error is encountered. */
export class WebSocketError extends Error {}
