# Changelog
Tracking changes for PteroJS and extensions from v2 onwards (using [SemVer 2](http://semver.org/)).

## [2.0.0] - 27-05-2022
A huge turning point for the PteroJS library, having a new TypeScript look, updated classes/methods, and proper documentation. Thanks to everyone that contributed! :D

### Added
- global types and interfaces to `/src/common`
- expandable query option types
- "page" and "perPage" query options support
- `BaseManager` with abstract query properties
- additional parse options for `caseConv` util
- support sometimes "meta" property for API errors
- `FileManager#getDownloadURL()` replaces old `download()` method
- `FileManager#getUploadURL()` replaces old `upload()` method
- `FileManager#chmod()` method
- `FileChmodData` type for chmod requests
- `NodeManager#fetchDeployable()` method with types
- `BackupManager#getDownloadURL()` replaces old `download()` method
- `WebSocketManager#active` for checking active created shards
- `ClientServerManager#fetchResources()` method
- `ClientServer#fetchResources()` method
- support for `skipScripts`, `oomDisabled`, `allocation.additional`, `deploy`, and `startOnCompletion` with server creation
- added warning doc for `oomDisabled` broken behaviour
- `ClientServerManager#setDockerImage()` method
- `ClientServer#setDockerImage()` method
- `ClientServerManager#rename()` method
- `ClientServer#rename()` method
- `ClientServerManager#reinstall()` method
- `ClientServer#reinstall()` method
- `ValidationError` class (implemented in managers), will come with additional uses in future versions
- guard API requests from unexpected `null_resource` response objects
- `Dict#clone()` method for deep cloning the existing dict
- typings for `RequestManager` events
- static getters for grouped permissions
- support startup viewing and modification endpoints
- `ClientServerManager#fetchStartup()` method
- `ClientServer#fetchStartup()` method
- `ClientServerManager#setVariable()` method
- `ClientServer#setVariable()` method
- support `external` option for fetching application servers by external ID
- `PteroClient#fetchPermissions()` method to return the raw permission group descriptors (separate from the `Permissions` utility class).

### Changed
- all application and client managers now extend `BaseManager`
- renamed user classes to reflect the API
- `PteroUser` is now `User`
- `PteroSubUser` is now `SubUser`
- `ClientUser` is now `Account`
- renamed `ClientServerManager#pageData` to `#meta`
- `PteroFile` -> `File` (typing change)
- `FileManager#download()` now downloads the file
- `BackupManager#download()` now downloads the backup
- `RequestManager` uses axios with internal parsing
- most structures now use its manager for API requests in its group
- changeed `env` to `environment` for server creation
- changed `image` to `dockerImage` for server creation
- `Permissions#has()` is now split into `hasAny()` and `hasAll()`
- refactored `Permissions` and `Flags` to only use the API's string-based permissions. Numbers wont be parsed anymore
- `Permissions#raw` -> `Permissions#value`
- `Account#get2faCode()` -> `Account#get2FACode()`
- `Account#enable2fa()` -> `Account#enable2FA()`
- `Account#disable2fa()` -> `Account#disable2FA()`

### Deprecated
- `UserManager#fetchExternal()`: use `UserManager#fetch()` with the `external` option instead

### Removed
- useless value return types (e.g. `Promise<true>` which should be `Promise<void>`)
- most union string/number & instance type parameters
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
- export all endpoints properly
- `Dict#join()` now actually joins the other dicts to the existing dict
