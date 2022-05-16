# Changelog
All changes to PteroJS as of v2.

## [2.0.0] - 05-2022
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

### Deprecated
- `UserManager#fetchExternal`: use `UserManager#fetch` with the "external" option instead

### Removed
- useless value return types (e.g. `Promise<true>` which should be `Promise<void>`)
- most union string/number & instance type parameters
- `ClientServer#addWebsocket()`: use the client directly instead
- `File#isEditable`: never existed in the API, issue from the docs
- `WebSocketManager#readyAt`: no longer centralised, replaced by `#active`

### Fixed
- export all endpoints properly