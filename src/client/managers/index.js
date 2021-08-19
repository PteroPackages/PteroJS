const RequestManager = require('./RequestManager');
const ServerManager = require('./ServerManager');
const UserManager = require('./UserManager');

class RequestError extends Error {
    constructor(message = 'Invalid request to API.') { super(message) }
}

module.exports = {
    RequestManager,
    ServerManager,
    UserManager,
    RequestError
}
