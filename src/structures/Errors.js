exports.RequestError = class RequestError extends Error {
    constructor(message = 'Invalid request to API.') { super(message) };
}
