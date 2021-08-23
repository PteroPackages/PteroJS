const ApplicationServer = require('./ApplicationServer');
const ClientServer = require('./ClientServer');
const Node = require('./Node');
const Permissions = require('./Permissions');
const Schedule = require('./Schedule');
const { BaseUser, PteroUser, PteroSubUser, ClientUser } = require('./User');

class RequestError extends Error {
    constructor(message = 'Invalid request to API.') { super(message) }
}

module.exports = {
    ApplicationServer,
    ClientServer,
    ClientUser,
    Node,
    Permissions,
    RequestError,
    Schedule,
    BaseUser,
    PteroUser,
    PteroSubUser
}
