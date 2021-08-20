# PteroJS Todo
Want to contribute? Familiar with JS? You're already halfway there. Below are things that need to be done for various parts of the module. See [the contributing section](https://github.com/devnote-dev/PteroJS#contributing) to find out how to take part. 👍

## Application
- [X] Setup `connect()` function ([PteroApp](https://github.com/devnote-dev/PteroJS/blob/main/src/application/PteroApp.js#L33))
- [ ] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/application/managers/RequestManager.js))
- [ ] Implement helper functions for all the managers
- [ ] Create and implement `NestEggsManager`

## Client
- [ ] Use typed `ClientOptions` for startup ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L13))
- [ ] Setup `connect()` function ([PteroClient](https://github.com/devnote-dev/PteroJS/blob/main/src/client/PteroClient.js#L26))
- [ ] Create and implement `WebsocketManager`
- [ ] Rename endpoints in endpoints structure
- [X] Rewrite `ServerManager` with the correct server class ([ServerManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/ServerManager.js))
- [ ] Implement 201 and 204 response handling ([RequestManager](https://github.com/devnote-dev/PteroJS/blob/main/src/client/managers/RequestManager.js))
- [ ] Implement helper functions for all the managers
- [ ] Implement `ClientUser` required fetch on startup
- [ ] Rewrite enpoints naming scheme

## Global Managers
- [ ] Implement helper functions for all the managers
- [ ] Create and implement all necessary submanagers ([Dashflo](https://dashflo.net/docs/api/pterodactyl/v1/#req_dc39cc65e67d47bd8fb37449a8559935))

## Global Structures
- [ ] Implement helper functions for all the structures
- [ ] Figure out and implement a consistent management system for `Permissions` ([Permissions](https://github.com/devnote-dev/PteroJS/blob/main/src/structures/Permissions.js)) (priority)

## Misc.
- [ ] Add proper notes and annotations to JSDocs (not priority)
