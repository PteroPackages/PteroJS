# Changelog

Tracking changes for PteroJS and extensions from v2 onwards (using [SemVer 2](http://semver.org/)).

## [2.2.0] - 08-02-2023

### Added

- `WebSocketManager#getAuth()` method for getting websocket auth data
- `type` query parameter for `ClientServerManager#fetch()` (takes "admin", "admin-all", or "owner")

### Fixed

- Switch `Shard` class to use `WebSocketManager#getAuth()`
- Fix & ensure `NodeAllocationManager#fetchAvailable()` fetches all allocations

## [2.1.0] - 08-10-2022

A lot of bug fixes and some new useful QOL features for the library and developers.

### Added

- `Dict#update()` updates the dict instance in place with another dict
- `Shard#request()` method for making sendable requests to the server
- `WebSocketManager#broadcast()` method to broadcast events to all shards and collect the responses
- `ApplicationServer#container` property
- `ClientServer#internalId` property
- `ClientServer#eggFeatures` optional property
- `ClientServer#invocation` property
- `ClientServer#transferring` boolean property
- `UserBuilder` class
- `ServerBuilder` class
- `NodeBuilder` class
- Activity logs support (`Account#fetchActivities()`)
- SSH keys support (`Account#fetchSSHKeys()`, `Account#createSSHKey()`, `Account#removeSSHKey()`)
- Jest testing instead of custom testing
- Additional documentation and examples for application API
- Support including servers for `UserManager`
- Documentation with examples for the application and client API
- Include `token` field from metadata when creating API keys
- Cache metadata from all `fetch()` methods in the application API
- Support `origin` header for websocket connections

### Changed

- All managers with caches now uses the `Dict#update()` method
- `ClientServer#state` -> `ClientServer#status` matches API data
- Overloaded `PteroClient#addSocketServer()` to not return an array if only one ID is present

### Fixed

- `Node#daemon` now shows the actual daemon data object
- `caseConv` functions handling arrays incorrectly
- Node creation method now uses the correct endpoint
- `NodeCreationOptions` is now updated to use actual creation options in the API
- `ApplicationServerManager#updateBuild()` applies missing limits and feature limits
- `UserManager#query()` now uses the correct endpoint (previously servers)
- Export missing type/interface members for documentation
- `UserUpdateOptions#externalId` now accepts `null` to remove the external ID
- `UserManager#update()` now checks if `externalId` is set before defaulting

## [2.0.0] - 26-05-2022

A huge turning point for the PteroJS library, having a new TypeScript look, updated classes/methods, and proper documentation. Thanks to everyone that contributed! :D

### Added

- Global types and interfaces to `/src/common`
- Expandable query option types
- "page" and "perPage" query options support
- `BaseManager` with abstract query properties
- Additional parse options for `caseConv` util
- Support sometimes "meta" property for API errors
- `FileManager#getDownloadURL()` replaces old `download()` method
- `FileManager#getUploadURL()` replaces old `upload()` method
- `FileManager#chmod()` method
- `FileChmodData` type for chmod requests
- `NodeManager#fetchDeployable()` method with types
- `BackupManager#getDownloadURL()` replaces old `download()` method
- `WebSocketManager#active` for checking active created shards
- `ClientServerManager#fetchResources()` method
- `ClientServer#fetchResources()` method
- Support for `skipScripts`, `oomDisabled`, `allocation.additional`, `deploy`, and `startOnCompletion` with server creation
- Added warning doc for `oomDisabled` broken behaviour
- `ClientServerManager#setDockerImage()` method
- `ClientServer#setDockerImage()` method
- `ClientServerManager#rename()` method
- `ClientServer#rename()` method
- `ClientServerManager#reinstall()` method
- `ClientServer#reinstall()` method
- `ValidationError` class (implemented in managers), will come with additional uses in future versions
- Guard API requests from unexpected `null_resource` response objects
- `Dict#clone()` method for deep cloning the existing dict
- Typings for `RequestManager` events
- Static getters for grouped permissions
- Support startup viewing and modification endpoints
- `ClientServerManager#fetchStartup()` method
- `ClientServer#fetchStartup()` method
- `ClientServerManager#setVariable()` method
- `ClientServer#setVariable()` method
- Support `external` option for fetching application servers by external ID
- `PteroClient#fetchPermissions()` method to return the raw permission group descriptors (separate from the `Permissions` utility class).

### Changed

- All application and client managers now extend `BaseManager`
- Renamed user classes to reflect the API
- `PteroUser` is now `User`
- `PteroSubUser` is now `SubUser`
- `ClientUser` is now `Account`
- Renamed `ClientServerManager#pageData` to `#meta`
- `PteroFile` -> `File` (typing change)
- `FileManager#download()` now downloads the file
- `BackupManager#download()` now downloads the backup
- `RequestManager` uses axios with internal parsing
- Nost structures now use its manager for API requests in its group
- Changeed `env` to `environment` for server creation
- Changed `image` to `dockerImage` for server creation
- `Permissions#has()` is now split into `hasAny()` and `hasAll()`
- Refactored `Permissions` and `Flags` to only use the API's string-based permissions. Numbers wont be parsed anymore
- `Permissions#raw` -> `Permissions#value`
- `Account#get2faCode()` -> `Account#get2FACode()`
- `Account#enable2fa()` -> `Account#enable2FA()`
- `Account#disable2fa()` -> `Account#disable2FA()`

### Deprecated

- `UserManager#fetchExternal()`: use `UserManager#fetch()` with the `external` option instead

### Removed

- Useless value return types (e.g. `Promise<true>` which should be `Promise<void>`)
- Most union string/number & instance type parameters
- `ClientServer#addWebsocket()`: use the client directly instead
- `File#isEditable`: never existed in the API, issue from the docs
- `WebSocketManager#readyAt`: no longer centralised, replaced by `active`
- `NestEggsManager#for()`: use cache methods instead
- `ApplicationServer#delete()`: conflicts with cache; use manager instead
- `Node#delete()`: conflicts with cache; use manager instead
- `Schedule#delete()`: conflicts with cache; use manager instead
- `PermissionResolvable` type: all permissions are strings now making it redundant
- `Permissions#toArray()`: redundant; use `Permissions#value` instead
- `Permissions#toStrings()`: redundant; all permission values are now strings
- `Permissions#fromStrings():` redundant; ditto
- `Permissions#DEFAULT`: control permissions are now grouped under `Permissions#CONTROL`

### Fixed

- Export all endpoints properly
- `Dict#join()` now actually joins the other dicts to the existing dict
