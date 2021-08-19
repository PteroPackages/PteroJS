const BackupManager = require('./BackupManager');
const RequestManager = require('./RequestManager');
const ServerManager = require('./ServerManager');
const UserManager = require('./UserManager');

class RequestError extends Error {
    constructor(message = 'Invalid request to API.') { super(message) }
}

module.exports = {
    BackupManager,
    RequestError,
    RequestManager,
    ServerManager,
    UserManager
}
