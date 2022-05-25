# PteroJS Todo
Want to contribute? Familiar with JS? You're already halfway there. Below are things that need to be done for various parts of the module. See [the contributing section](https://github.com/devnote-dev/PteroJS#contributing) to find out how to take part. 👍

## Application
- [X] Setup `connect()` function ([PteroApp](https://github.com/devnote-dev/PteroJS/blob/main/src/application/PteroApp.js#L33))
- [X] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/application/managers/RequestManager.js))
- [X] Implement helper functions for all the managers
- [X] Create and implement `NestEggsManager`

## Client
- [X] Use typed `ClientOptions` for startup ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L13))
- [X] Setup `connect()` function ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L26))
- [X] Create and implement `WebsocketManager`
- [X] Rename endpoints in endpoints structure
- [X] Rewrite `ServerManager` with the correct server class ([ServerManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/ServerManager.js))
- [X] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/RequestManager.js))
- [X] Implement helper functions for all the managers
- [X] Implement `ClientUser` required fetch on startup
- [X] Document all functions
- [ ] Implement `?type=` for `ClientServerManager#fetch()`

## Remote
- [ ] Get working remote classes

## Global Managers
- [X] Implement helper functions for all the managers
- [X] Create and implement all necessary submanagers ([Dashflo](https://dashflo.net/docs/api/pterodactyl/v1/#req_dc39cc65e67d47bd8fb37449a8559935))
- [X] Document all functions (resolved into others)
- [X] Switch `AllocationManager#cache` to maps
- [X] Fix endpoints paths & RestRequestManager fetch checks

## Global Structures
- [X] Implement helper functions for all the structures
- [X] Figure out and implement a consistent management system for `Permissions` ([Permissions](https://github.com/devnote-dev/PteroJS/blob/main/src/structures/Permissions.js))

## Misc.
- [X] Add proper notes and annotations to JSDocs
- [X] Overall testing of the package (priority)
- [X] TypeScript support (`index.d.ts`)
- [X] Investigate incorrectly documented endpoints
- [X] Implement tests in `/tests` (or move from `/test`)
- [X] Remove deprecated `PteroUser#tfa`
- [X] Remove deprecated `Presets` util
- [X] Rewrite in TypeScript
- [X] Switch `node-fetch` to a different library
- [ ] Implement builder classes
- [ ] Remove deprecated `UserManager#fetchExternal`

## Feature Plans
- [ ] Optional webhook client
- [ ] Node status client
- [ ] Data formatter interface client (may be updated to logging client)
