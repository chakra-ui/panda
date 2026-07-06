---
'@pandacss/cli': patch
---

Fix `panda --watch` crashing on macOS with `Error: Events were dropped by the FSEvents client. File system must be re-scanned.`

`@parcel/watcher` surfaces a macOS FSEvents backpressure condition — its event buffer overflowed and the OS coalesced the backlog — as a _recoverable_ subscribe-callback error. Apple's FSEvents API sets `kFSEventStreamEventFlagMustScanSubDirs` and expects the client to re-scan. The watcher was rethrowing this error inside `@parcel/watcher`'s native callback, which becomes an uncaught exception and kills the watch process (commonly hit when `panda --watch` runs next to a bundler's dependency pre-bundle, e.g. `vite`). It now recognizes the "must be re-scanned" signal and triggers a full re-scan — re-reading every source file from disk — instead of crashing; any other error is left to propagate unchanged.
