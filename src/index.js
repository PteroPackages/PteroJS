module.exports = {
    version: require('../package.json').version,

    // Application API
    PteroApp: require('./application/PteroApp'),
    UserManager: require('./application/UserManager'),
    NodeManager: require('./application/NodeManager'),
    NestManager: require('./application/NestManager'),
    NestEggsManager: require('./application/NestEggsManager'),
    ApplicationServerManager: require('./application/ApplicationServerManager'),
    NodeLocationManager: require('./application/NodeLocationManager'),

    // Client API
    PteroClient: require('./client/PteroClient'),
    ClientServerManager: require('./client/ClientServerManager'),
    ScheduleManager: require('./client/ScheduleManager'),
    BackupManager: require('./client/BackupManager'),
    SubUserManager: require('./client/SubUserManager'),

    // Websocket
    Shard: require('./client/ws/Shard'),
    WebSocketManager: require('./client/ws/WebSocketManager'),

    // Global Managers
    DatabaseManager: require('./managers/DatabaseManager'),
    FileManager: require('./client/FileManager'),
    RequestManager: require('./managers/RequestManager'),

    // Package Structures
    ApplicationServer: require('./structures/ApplicationServer'),
    ClientServer: require('./structures/ClientServer'),
    Dict: require('./structures/Dict'),
    Node: require('./structures/Node'),
    Permissions: require('./structures/Permissions'),
    Schedule: require('./structures/Schedule'),
    ...require('./structures/Errors'),
    ...require('./structures/User'),

    // Utils
    configLoader: require('./util/configLoader'),
    caseConv: require('./util/caseConv'),

    // Extensions
    NodeStatus: require('./extensions/NodeStatus')
};
