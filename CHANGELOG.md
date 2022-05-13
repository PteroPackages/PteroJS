# Changelog
All changes to PteroJS as of v2.

## [2.0.0] - 05-2022
### Added
- global types and interfaces to `/src/common`
- expandable query option types
- "page" and "perPage" query options support
- `BaseManager` with abstract query properties
- additional parse options for `caseConv` util

### Changed
- `RequestManager` -> `RestRequestManager`
- all application and client managers now extend `BaseManager`
- renamed user classes to reflect the API
- `PteroUser` is now `User`
- `PteroSubUser` is now `SubUser`
- `ClientUser` is now `Account`
- renamed `ClientServerManager#pageData` to `#meta`

### Deprecated
- `UserManager#fetchExternal`: use `UserManager#fetch` with the "external" option instead

### Removed
- useless value return types (e.g. `Promise<true>` which should be `Promise<void>`)
- most union string/number & instance type parameters
- `ClientServer#addWebsocket()`: use the client directly instead

### Fixed
- export all endpoints properly