# PteroJS Todo

Want to contribute? Familiar with JS? You're already halfway there. Below are things that need to be done for various parts of the module. See [the contributing section](https://github.com/devnote-dev/PteroJS#contributing) to find out how to take part. 👍

## Application

-   [x] Setup `connect()` function ([PteroApp](https://github.com/devnote-dev/PteroJS/blob/main/src/application/PteroApp.js#L33))
-   [x] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/application/managers/RequestManager.js))
-   [x] Implement helper functions for all the managers
-   [x] Create and implement `NestEggsManager`

## Client

-   [x] Use typed `ClientOptions` for startup ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L13))
-   [x] Setup `connect()` function ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L26))
-   [x] Create and implement `WebsocketManager`
-   [x] Rename endpoints in endpoints structure
-   [x] Rewrite `ServerManager` with the correct server class ([ServerManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/ServerManager.js))
-   [x] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/RequestManager.js))
-   [x] Implement helper functions for all the managers
-   [x] Implement `ClientUser` required fetch on startup
-   [x] Document all functions
-   [ ] Implement `?type=` for `ClientServerManager#fetch()`

## Remote

-   [ ] Get working remote classes

## Global Managers

-   [x] Implement helper functions for all the managers
-   [x] Create and implement all necessary submanagers ([Dashflo](https://dashflo.net/docs/api/pterodactyl/v1/#req_dc39cc65e67d47bd8fb37449a8559935))
-   [x] Document all functions (resolved into others)
-   [x] Switch `AllocationManager#cache` to maps
-   [x] Fix endpoints paths & RestRequestManager fetch checks

## Global Structures

-   [x] Implement helper functions for all the structures
-   [x] Figure out and implement a consistent management system for `Permissions` ([Permissions](https://github.com/devnote-dev/PteroJS/blob/main/src/structures/Permissions.js))

## Misc.

-   [x] Add proper notes and annotations to JSDocs
-   [x] Overall testing of the package (priority)
-   [x] TypeScript support (`index.d.ts`)
-   [x] Investigate incorrectly documented endpoints
-   [x] Implement tests in `/tests` (or move from `/test`)
-   [x] Remove deprecated `PteroUser#tfa`
-   [x] Remove deprecated `Presets` util
-   [x] Rewrite in TypeScript
-   [x] Switch `node-fetch` to a different library
-   [x] Implement builder classes
-   [ ] Remove deprecated `UserManager#fetchExternal`

## Feature Plans

-   [ ] Optional webhook client
-   [ ] Node status client
-   [ ] Data formatter interface client (may be updated to logging client)
