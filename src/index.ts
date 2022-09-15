import { version as v } from '../package.json';

export const version: string = v;

// Application API
export { PteroApp } from './application';
export { ApplicationDatabaseManager } from './application/ApplicationDatabaseManager';
export { ApplicationServerManager } from './application/ApplicationServerManager';
export { NestEggsManager } from './application/NestEggsManager';
export { NestManager } from './application/NestManager';
export { NodeAllocationManager } from './application/NodeAllocationManager';
export { NodeLocationManager } from './application/NodeLocationManager';
export { NodeManager } from './application/NodeManager';
export { UserManager } from './application/UserManager';

// Client API
export { PteroClient } from './client';
export { BackupManager } from './client/BackupManager';
export { ClientServerManager } from './client/ClientServerManager';
export { ClientDatabaseManager } from './client/ClientDatabaseManager';
export { FileManager } from './client/FileManager';
export { NetworkManager } from './client/NetworkManager';
export { ScheduleManager } from './client/ScheduleManager';
export { Shard } from './client/ws/Shard';
export { SubUserManager } from './client/SubUserManager';
export { WebSocketManager } from './client/ws/WebSocketManager';

// Commons
export * from './common';
export * from './common/app';
export * from './common/client';

// HTTP
export * from './http/RequestManager';

// Structures
export { ApplicationServer } from './structures/ApplicationServer';
export { BaseManager } from './structures/BaseManager';
export { ClientServer } from './structures/ClientServer';
export * from './structures/Dict';
export * from './structures/Errors';
export { Node } from './structures/Node';
export * from './structures/Permissions';
export { Schedule } from './structures/Schedule';
export * from './structures/User';

// Builders
export { Builder } from './builders/base';
export { NodeBuilder } from './builders/Node';
export { ServerBuilder } from './builders/Server';
export { UserBuilder } from './builders/User';

// Utilities
export { default as caseConv, ConvertOptions } from './util/caseConv';
export { default as configLoader } from './util/config';
export * from './util/query';
