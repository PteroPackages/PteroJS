module.exports = {
    version: require('../package.json').version,

    // Application API
    PteroApp: require('./application/PteroApp'),
    UserManager: require('./application/UserManager'),
    NodeManager: require('./application/NodeManager'),
    NestManager: require('./application/NestManager'),
    ApplicationServerManager: require('./application/ApplicationServerManager'),
    NodeLocationManager: require('./application/NodeLocationManager'),
    ApplicationRequestManager: require('./application/ApplicationRequestManager'),

    // Client API
    PteroClient: require('./client/PteroClient'),
    ClientServerManager: require('./client/ClientServerManager'),
    ScheduleManager: require('./client/ScheduleManager'),
    ClientRequestManager: require('./client/ClientRequestManager'),
    BackupManager: require('./client/BackupManager'),
    SubUserManager: require('./client/SubUserManager'),

    // Websocket
    Shard: require('./client/ws/Shard'),
    WebSocketManager: require('./client/ws/WebSocketManager'),

    // Global Managers
    AllocationManager: require('./managers/AllocationManager'),
    DatabaseManager: require('./managers/DatabaseManager'),
    FileManager: require('./managers/FileManager'),

    // Package Structures
    ApplicationServer: require('./structures/ApplicationServer'),
    ClientServer: require('./structures/ClientServer'),
    Dict: require('./structures/Dict'),
    Node: require('./structures/Node'),
    Permissions: require('./structures/Permissions'),
    /** @deprecated Use configLoader util instead. */
    Presets: require('./structures/Presets'),
    Schedule: require('./structures/Schedule'),
    ...require('./structures/Errors'),
    ...require('./structures/User'),

    // Utils
    configLoader: require('./structures/configLoader'),
    caseConv: require('./structures/caseConv'),

    // Extensions
    NodeStatus: require('./extensions/NodeStatus')
};
