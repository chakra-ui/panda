---
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

- Add `configDependencies` option to `panda.config.ts` to allow explicitly specifying files that should trigger a
  context reload on change. We automatically track the config file and (transitive) files imported by the config file as
  much as possible, but sometimes you might miss some. You can use this option as a workaround for those edge cases.
- Invoke 'config:change' hook in more situations (when the `--watch` flag is passed to `panda codegen`, `panda cssgen`,
  `panda ship`)
- Watch for more config options paths changes, so that the related artifacts will be regenerated a bit more reliably
  (ex: updating the `config.hooks` will now trigger a full regeneration of `styled-system` as you could be tweaking
  parts of the config)
