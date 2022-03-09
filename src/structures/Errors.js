exports.RequestError = class RequestError extends Error {
    constructor(message) { super(message) };
}

exports.PteroAPIError = class PteroAPIError extends Error {
    constructor(data) {
        const fmt = data.errors.map(
            e => `- ${e.status}: ${e.detail || 'No details provided'}`
        ).join('\n');

        super('\n'+ fmt);
        this.code = data.errors[0].code;
    }
}

exports.WebSocketError = class WebSocketError extends Error {
    constructor(message) { super(message) };
}
