---
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

- Add support for explicitly specifying config related files that should trigger a context reload on change.

  > We automatically track the config file and (transitive) files imported by the config file as much as possible, but
  > sometimes we might miss some. You can use this option as a workaround for those edge cases.

  Set the `dependencies` option in `panda.config.ts` to a glob or list of files.

  ```ts
  export default defineConfig({
    // ...
    dependencies: ['path/to/files/**.ts'],
  })
  ```

- Invoke `config:change` hook in more situations (when the `--watch` flag is passed to `panda codegen`, `panda cssgen`,
  `panda ship`)

- Watch for more config options paths changes, so that the related artifacts will be regenerated a bit more reliably
  (ex: updating the `config.hooks` will now trigger a full regeneration of `styled-system`)
