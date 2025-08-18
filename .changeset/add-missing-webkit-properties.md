---
'@pandacss/types': minor
---

Add missing WebKit CSS properties to resolve TypeScript errors. Adds support for:

- `WebkitUserDrag` / `-webkit-user-drag` - Controls element drag behavior
- `WebkitAppRegion` / `-webkit-app-region` - For Electron window controls
- `WebkitBorderHorizontalSpacing` / `-webkit-border-horizontal-spacing` - Table border spacing
- `WebkitBorderVerticalSpacing` / `-webkit-border-vertical-spacing` - Table border spacing
- `WebkitTextSecurity` / `-webkit-text-security` - Text obscuring for passwords

Fixes TypeScript errors when using these vendor-prefixed properties in Panda CSS.
