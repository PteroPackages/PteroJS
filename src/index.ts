import { version as v } from '../package.json';

export const version: string = v;

// Application API
export * from './application/app';
export * from './application/ApplicationServerManager';
export * from './application/NestEggsManager';
export * from './application/NestManager';
export * from './application/NodeAllocationManager';
export * from './application/NodeLocationManager';
export * from './application/NodeManager';
export * from './application/UserManager';

// Commons
export * from './common';
export * from './common/app';

// HTTP
export * from './http/RestRequestManager';

// Structures
export * from './structures/ApplicationServer';
export * from './structures/BaseManager';
export * from './structures/Dict';
export * from './structures/Errors';
export * from './structures/Node';
export * from './structures/Permissions';
export * from './structures/User';

// Utilities
export * from './util/caseConv';
export * from './util/config';
export * from './util/query';
