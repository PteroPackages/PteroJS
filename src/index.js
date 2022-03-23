module.exports = {
    version: require('../package.json').version,

    // Application API
    ApplicationServerManager: require('./application/ApplicationServerManager'),
    NestEggsManager: require('./application/NestEggsManager'),
    NestManager: require('./application/NestManager'),
    NodeAllocationManager: require('./application/NodeAllocationManager'),
    NodeLocationManager: require('./application/NodeLocationManager'),
    NodeManager: require('./application/NodeManager'),
    PteroApp: require('./application/PteroApp'),
    UserManager: require('./application/UserManager'),

    // Client API
    Shard: require('./client/ws/Shard'),
    WebSocketManager: require('./client/ws/WebSocketManager'),

    BackupManager: require('./client/BackupManager'),
    ClientDatabaseManager: require('./client/ClientDatabaseManager'),
    ClientServerManager: require('./client/ClientServerManager'),
    FileManager: require('./client/FileManager'),
    NetworkAllocationManager: require('./client/NetworkAllocationManager'),
    PteroClient: require('./client/PteroClient'),
    ScheduleManager: require('./client/ScheduleManager'),
    SubUserManager: require('./client/SubUserManager'),

    // Extensions
    NodeStatus: require('./extensions/NodeStatus'),

    // HTTP
    RequestManager: require('./http/RequestManager'),

    // Structures
    ApplicationServer: require('./structures/ApplicationServer'),
    ClientServer: require('./structures/ClientServer'),
    Dict: require('./structures/Dict'),
    ...require('./structures/Errors'),
    Node: require('./structures/Node'),
    Permissions: require('./structures/Permissions'),
    Schedule: require('./structures/Schedule'),
    ...require('./structures/User'),

    // Utility
    caseConv: require('./util/caseConv'),
    configLoader: require('./util/configLoader'),
    query: require('./util/query')
};
