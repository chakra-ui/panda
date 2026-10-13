---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Stop extracting data props from components Panda doesn't own. A prop like `columns` on a table component no longer
emits CSS or a `nested_property` warning when its value isn't a style:

```tsx
<DataTable columns={[{ header: 'Name', accessorKey: 'name' }]} />
```
