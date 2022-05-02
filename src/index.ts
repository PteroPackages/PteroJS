import { version as v } from '../package.json';

export const version: string = v;

// Application API
export { PteroApp } from './application/app';
export { ApplicationServerManager } from './application/ApplicationServerManager';
export { NestEggsManager } from './application/NestEggsManager';
export { NestManager } from './application/NestManager';
export { NodeAllocationManager } from './application/NodeAllocationManager';
export { NodeLocationManager } from './application/NodeLocationManager';
export { NodeManager } from './application/NodeManager';
export { UserManager } from './application/UserManager';

// Client API
export { PteroClient } from './client';
export { Shard } from './client/ws/Shard';
export { WebSocketManager } from './client/ws/WebSocketManager';

// Commons
export * from './common';
export * from './common/app';

// HTTP
export { RestRequestManager } from './http/RestRequestManager';

// Structures
export { ApplicationServer } from './structures/ApplicationServer';
export { BaseManager } from './structures/BaseManager';
export * from './structures/Dict';
export * from './structures/Errors';
export { Node } from './structures/Node';
export * from './structures/Permissions';
export * from './structures/User';

// Utilities
export * from './util/caseConv';
export * from './util/config';
export * from './util/query';
