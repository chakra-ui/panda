---
'@pandacss/mcp': patch
---

Fix `panda mcp` orphaning and spinning at 100% CPU after the host disconnects. The server now
exits on stdin close and exits (instead of looping) on fatal errors.
