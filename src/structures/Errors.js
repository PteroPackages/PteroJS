exports.RequestError = class RequestError extends Error {
    constructor(message) { super(message) };
}

exports.PteroAPIError = class PteroAPIError extends Error {
    constructor(data) {
        data = data.errors[0];
        super(`[${data.status}] ${data.detail}`);
        this.code = data.code;
    }
}

exports.WebSocketError = class WebSocketError extends Error {
    constructor(message) { super(message) };
}
