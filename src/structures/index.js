const ApplicationServer = require('./ApplicationServer');
const ClientServer = require('./ClientServer');
const ClientUser = require('./ClientUser');
const Node = require('./Node');
const { Permissions, UserPermissions } = require('./Permissions');
const Schedule = require('./Schedule');
const { BaseUser, PteroUser, PteroSubUser } = require('./User');

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
    UserPermissions,
    Schedule,
    BaseUser,
    PteroUser,
    PteroSubUser
}
