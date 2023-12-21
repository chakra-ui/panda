# @pandacss/node

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
- Updated dependencies [647f05c9]
  - @pandacss/generator@0.22.1
  - @pandacss/types@0.22.1
  - @pandacss/parser@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/config@0.22.1
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/extractor@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- a2f6c2c8: Fix potential cross-platform issues with path resolving by using `pathe` instead of `path`
- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [9c0d3f8f]
- Updated dependencies [11753fea]
- Updated dependencies [c95c40bd]
- Updated dependencies [e83afef0]
  - @pandacss/types@0.22.0
  - @pandacss/generator@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/parser@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
  - @pandacss/extractor@0.22.0
  - @pandacss/is-valid-prop@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- 7f846be2: Add `configPath` and `cwd` options in the `@pandacss/astro` integration just like in the `@pandacss/postcss`

  This can be useful with Nx monorepos where the `panda.config.ts` is not in the root of the project.

- Updated dependencies [1464460f]
- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
- Updated dependencies [052283c2]
  - @pandacss/extractor@0.21.0
  - @pandacss/core@0.21.0
  - @pandacss/generator@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/parser@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/parser@0.20.1
- @pandacss/core@0.20.1
- @pandacss/generator@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/extractor@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [e4fdc64a]
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/generator@0.20.0
  - @pandacss/config@0.20.0
  - @pandacss/parser@0.20.0
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/extractor@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [92a7fbe5]
- Updated dependencies [89f86923]
- Updated dependencies [402afbee]
- Updated dependencies [9f5711f9]
  - @pandacss/generator@0.19.0
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/parser@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/extractor@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- Updated dependencies [78b940b2]
  - @pandacss/generator@0.18.3
  - @pandacss/parser@0.18.3
  - @pandacss/config@0.18.3
  - @pandacss/core@0.18.3
  - @pandacss/error@0.18.3
  - @pandacss/extractor@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/parser@0.18.2
- @pandacss/core@0.18.2
- @pandacss/generator@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/extractor@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/generator@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/config@0.18.1
  - @pandacss/parser@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/extractor@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- 3010af28: Add a `--only-config` flag for the `panda debug` command, to skip writing app files and just output the
  resolved config.
- 866c12aa: Fix CLI interactive mode `syntax` question values and prettify the generated `panda.config.ts` file
- Updated dependencies [ba9e32fa]
- Updated dependencies [b7cb2073]
- Updated dependencies [336fd0b0]
  - @pandacss/generator@0.18.0
  - @pandacss/shared@0.18.0
  - @pandacss/extractor@0.18.0
  - @pandacss/parser@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 17f68b3f: Ensure dir exists before writing file for the `panda cssgen` / `panda ship` / `panda analyze` commands when
  specifying an outfile.
- Updated dependencies [6718f81b]
- Updated dependencies [a6dfc944]
- Updated dependencies [3ce70c37]
  - @pandacss/generator@0.17.5
  - @pandacss/core@0.17.5
  - @pandacss/parser@0.17.5
  - @pandacss/config@0.17.5
  - @pandacss/error@0.17.5
  - @pandacss/extractor@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/generator@0.17.4
  - @pandacss/parser@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/extractor@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- 60f2c8a3: Fix issue in studio command where `fs-extra` imports could not be resolved.
- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/generator@0.17.3
  - @pandacss/parser@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/extractor@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/config@0.17.2
- @pandacss/core@0.17.2
- @pandacss/error@0.17.2
- @pandacss/extractor@0.17.2
- @pandacss/generator@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/parser@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 56299cb2: Fix persistent error that causes CI builds to fail due to PostCSS plugin emitting artifacts in the middle of
  a build process.
- ddcaf7b2: Fix issue where FileSystem writes cause intermittent errors in different build contexts (Vercel, Docker).
  This was solved by limiting the concurrency using the `p-limit` library
- Updated dependencies [296d62b1]
- Updated dependencies [42520626]
- Updated dependencies [7b981422]
- Updated dependencies [9382e687]
- Updated dependencies [aea28c9f]
- Updated dependencies [a76b279e]
- Updated dependencies [5ce359f6]
  - @pandacss/generator@0.17.1
  - @pandacss/core@0.17.1
  - @pandacss/extractor@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/parser@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Minor Changes

- 12281ff8: Improve support for styled element composition. This ensures that you can compose two styled elements
  together and the styles will be merged correctly.

  ```jsx
  const Box = styled('div', {
    base: {
      background: 'red.light',
      color: 'white',
    },
  })

  const ExtendedBox = styled(Box, {
    base: { background: 'red.dark' },
  })

  // <ExtendedBox> will have a background of `red.dark` and a color of `white`
  ```

  **Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when
  an element is created from a cva/inline cva, and another created from a config recipe.

  - CVA or Inline CVA + CVA or Inline CVA = ✅
  - Config Recipe + Config Recipe = ✅
  - CVA or Inline CVA + Config Recipe = ❌

  ```jsx
  import { button } from '../styled-system/recipes'

  const Button = styled('div', button)

  // ❌ This will throw an error
  const ExtendedButton = styled(Button, {
    base: { background: 'red.dark' },
  })
  ```

### Patch Changes

- dd6811b3: Apply `config.logLevel` from the Panda config to the logger in every context.

  Fixes https://github.com/chakra-ui/panda/issues/1451

- Updated dependencies [93996aaf]
- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
- Updated dependencies [fbf062c6]
  - @pandacss/generator@0.17.0
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/parser@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/extractor@0.17.0
  - @pandacss/is-valid-prop@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Minor Changes

- 36252b1d: ## --minimal flag

  Adds a new `--minimal` flag for the CLI on the `panda cssgen` command to skip generating CSS for theme tokens,
  preflightkeyframes, static and global css

  Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

  > Note that you can use a `glob` to override the `config.include` option like this:
  > `panda cssgen "src/**/*.css" --minimal`

  This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

  Use it like this:

  ```bash
  panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
  ```

  ***

  ## cssgen {type}

  In addition to the optional `glob` that you can already pass to override the config.include option, the `panda cssgen`
  command now accepts a new `{type}` argument to generate only a specific type of CSS:

  - preflight
  - tokens
  - static
  - global
  - keyframes

  > Note that this only works when passing an `--outfile`.

  You can use it like this:

  ```bash
  panda cssgen "static" --outfile dist/static.css
  ```

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
- Updated dependencies [2b5cbf73]
- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/generator@0.16.0
  - @pandacss/core@0.16.0
  - @pandacss/parser@0.16.0
  - @pandacss/config@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/extractor@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- Updated dependencies [d12aed2b]
- Updated dependencies [909fcbe8]
- Updated dependencies [3d5971e5]
  - @pandacss/generator@0.15.5
  - @pandacss/parser@0.15.5
  - @pandacss/config@0.15.5
  - @pandacss/core@0.15.5
  - @pandacss/error@0.15.5
  - @pandacss/extractor@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- Updated dependencies [abd7c47a]
- Updated dependencies [bf0e6a30]
- Updated dependencies [69699ba4]
- Updated dependencies [3a04a927]
  - @pandacss/config@0.15.4
  - @pandacss/generator@0.15.4
  - @pandacss/parser@0.15.4
  - @pandacss/extractor@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/error@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [d34c8b48]
- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
- Updated dependencies [1eb31118]
  - @pandacss/generator@0.15.3
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/parser@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/extractor@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- f3c30d60: Update supported panda config extensions
- Updated dependencies [6d15776c]
- Updated dependencies [26a788c0]
- Updated dependencies [2645c2da]
  - @pandacss/generator@0.15.2
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/parser@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/extractor@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- Updated dependencies [7e8bcb03]
- Updated dependencies [848936e0]
- Updated dependencies [433f88cd]
- Updated dependencies [c40ae1b9]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
- Updated dependencies [7499bbd2]
  - @pandacss/generator@0.15.1
  - @pandacss/core@0.15.1
  - @pandacss/extractor@0.15.1
  - @pandacss/parser@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- Updated dependencies [be24d1a0]
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [93d9ee7e]
- Updated dependencies [bc3b077d]
- Updated dependencies [35793d85]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [7c1ab170]
- Updated dependencies [f27146d6]
  - @pandacss/extractor@0.15.0
  - @pandacss/types@0.15.0
  - @pandacss/generator@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/parser@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Minor Changes

- 8106b411: Add `generator:done` hook to perform actions when codegen artifacts are emitted.

### Patch Changes

- Updated dependencies [b1c31fdd]
- Updated dependencies [bdd30d18]
- Updated dependencies [bff17df2]
- Updated dependencies [6548f4f7]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [542d1ebc]
- Updated dependencies [39b20797]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/generator@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/parser@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/extractor@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [a5d7d514]
- Updated dependencies [577dcb9d]
- Updated dependencies [192d5e49]
- Updated dependencies [d0fbc7cc]
  - @pandacss/generator@0.13.1
  - @pandacss/parser@0.13.1
  - @pandacss/error@0.13.1
  - @pandacss/config@0.13.1
  - @pandacss/core@0.13.1
  - @pandacss/extractor@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- Updated dependencies [04b5fd6c]
- Updated dependencies [a9690110]
- Updated dependencies [32ceac3f]
  - @pandacss/core@0.13.0
  - @pandacss/generator@0.13.0
  - @pandacss/parser@0.13.0
  - @pandacss/config@0.13.0
  - @pandacss/error@0.13.0
  - @pandacss/extractor@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- Updated dependencies [6588c8e0]
- Updated dependencies [36fdff89]
  - @pandacss/generator@0.12.2
  - @pandacss/parser@0.12.2
  - @pandacss/config@0.12.2
  - @pandacss/core@0.12.2
  - @pandacss/error@0.12.2
  - @pandacss/extractor@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- Updated dependencies [599fbc1a]
  - @pandacss/generator@0.12.1
  - @pandacss/parser@0.12.1
  - @pandacss/config@0.12.1
  - @pandacss/core@0.12.1
  - @pandacss/error@0.12.1
  - @pandacss/extractor@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- Updated dependencies [a41515de]
- Updated dependencies [bf2ff391]
- Updated dependencies [ad1518b8]
  - @pandacss/generator@0.12.0
  - @pandacss/parser@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/error@0.12.0
  - @pandacss/extractor@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/generator@0.11.1
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/parser@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/config@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/extractor@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- cde9702e: Add an optional `glob` argument that overrides the config.include on the `panda cssgen` CLI command.
- Updated dependencies [dead08a2]
- Updated dependencies [5b95caf5]
- Updated dependencies [39b80b49]
- Updated dependencies [1dc788bd]
  - @pandacss/config@0.11.0
  - @pandacss/generator@0.11.0
  - @pandacss/types@0.11.0
  - @pandacss/parser@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
  - @pandacss/error@0.11.0
  - @pandacss/extractor@0.11.0
  - @pandacss/is-valid-prop@0.11.0
  - @pandacss/logger@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/generator@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
  - @pandacss/parser@0.10.0
  - @pandacss/config@0.10.0
  - @pandacss/error@0.10.0
  - @pandacss/extractor@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Patch Changes

- f10e706a: Fix PostCSS edge-case where the config file is not in the app root
- Updated dependencies [c08de87f]
- Updated dependencies [3269b411]
  - @pandacss/generator@0.9.0
  - @pandacss/parser@0.9.0
  - @pandacss/types@0.9.0
  - @pandacss/core@0.9.0
  - @pandacss/extractor@0.9.0
  - @pandacss/config@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/is-valid-prop@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- 5d1d376b: Adding missing comma for generated panda config
- be0ad578: Fix parser issue with TS path mappings
- 78612d7f: Fix node evaluation in extractor process (can happen when using a BinaryExpression, simple CallExpression or
  conditions)
- Updated dependencies [3f1e7e32]
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [e1f6318a]
- Updated dependencies [be0ad578]
- Updated dependencies [b75905d8]
- Updated dependencies [78612d7f]
- Updated dependencies [9ddf258b]
- Updated dependencies [0520ba83]
- Updated dependencies [156b6bde]
  - @pandacss/generator@0.8.0
  - @pandacss/core@0.8.0
  - @pandacss/extractor@0.8.0
  - @pandacss/parser@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/config@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- f4bb0576: Fix postcss issue where `@layer reset, base, tokens, recipes, utilities` check was too strict
- d8ebaf2f: Fix issue where hot module reloading is inconsistent in the PostCSS plugin when external files are changed
- 4ff7ddea: Fix issue where hot module reloading is inconsistent in the PostCSS plugin when another internal package is
  changed
- Updated dependencies [16cd3764]
- Updated dependencies [f2abf34d]
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
- Updated dependencies [7bc69e4b]
- Updated dependencies [1a05c4bb]
  - @pandacss/parser@0.7.0
  - @pandacss/extractor@0.7.0
  - @pandacss/shared@0.7.0
  - @pandacss/generator@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/config@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 032c152a: Fix issue where `panda cssgen --outfile` doesn't extract files to chunks before bundling them into the css
  out file
- Updated dependencies [cd912f35]
- Updated dependencies [dc4e80f7]
- Updated dependencies [12c900ee]
- Updated dependencies [21295f2e]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/generator@0.6.0
  - @pandacss/core@0.6.0
  - @pandacss/extractor@0.6.0
  - @pandacss/parser@0.6.0
  - @pandacss/config@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 5b09ab3b: Add support for `--outfile` flag in the `cssgen` command.

  ```bash
  panda cssgen --outfile dist/styles.css
  ```

- 78ed6ed4: Fix issue where using a nested outdir like `src/styled-system` with a baseUrl like `./src` would result on
  parser NOT matching imports like `import { container } from "styled-system/patterns";` cause it would expect the full
  path `src/styled-system`
- e48b130a: - Remove `stack` from `box.toJSON()` so that generated JSON files have less noise, mostly useful to get make
  the `panda debug` command easier to read

  - Also use the `ParserResult.toJSON()` method on `panda debug` command for the same reason

  instead of:

  ```json
  [
    {
      "type": "map",
      "value": {
        "padding": {
          "type": "literal",
          "value": "25px",
          "node": "StringLiteral",
          "stack": [
            "CallExpression",
            "ObjectLiteralExpression",
            "PropertyAssignment",
            "Identifier",
            "Identifier",
            "VariableDeclaration",
            "StringLiteral"
          ],
          "line": 10,
          "column": 20
        },
        "fontSize": {
          "type": "literal",
          "value": "2xl",
          "node": "StringLiteral",
          "stack": [
            "CallExpression",
            "ObjectLiteralExpression",
            "PropertyAssignment",
            "ConditionalExpression"
          ],
          "line": 11,
          "column": 67
        }
      },
      "node": "CallExpression",
      "stack": [
        "CallExpression",
        "ObjectLiteralExpression"
      ],
      "line": 11,
      "column": 21
    },
  ```

  we now have:

  ```json
  {
    "css": [
      {
        "type": "object",
        "name": "css",
        "box": {
          "type": "map",
          "value": {},
          "node": "CallExpression",
          "line": 15,
          "column": 27
        },
        "data": [
          {
            "alignItems": "center",
            "backgroundColor": "white",
            "border": "1px solid black",
            "borderRadius": "8px",
            "display": "flex",
            "gap": "16px",
            "p": "8px",
            "pr": "16px"
          }
        ]
      }
    ],
    "cva": [],
    "recipe": {
      "checkboxRoot": [
        {
          "type": "recipe",
          "name": "checkboxRoot",
          "box": {
            "type": "map",
            "value": {},
            "node": "CallExpression",
            "line": 38,
            "column": 47
          },
          "data": [
            {}
          ]
        }
      ],
  ```

- 1a2c0e2b: Fix `panda.config.xxx` file dependencies detection when using the builder (= with PostCSS or with the VSCode
  extension). It will now also properly resolve tsconfig path aliases.
- Updated dependencies [6f03ead3]
- Updated dependencies [8c670d60]
- Updated dependencies [33198907]
- Updated dependencies [53fb0708]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [09ebaf2e]
- Updated dependencies [78ed6ed4]
- Updated dependencies [e48b130a]
- Updated dependencies [1a2c0e2b]
- Updated dependencies [b8f8c2a6]
- Updated dependencies [a3d760ce]
- Updated dependencies [d9bc63e7]
  - @pandacss/extractor@0.5.1
  - @pandacss/types@0.5.1
  - @pandacss/config@0.5.1
  - @pandacss/generator@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/parser@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1
  - @pandacss/is-valid-prop@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [30f41e01]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/parser@0.5.0
  - @pandacss/extractor@0.5.0
  - @pandacss/generator@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/config@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/is-valid-prop@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [8991b1e4]
- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [a48e5b00]
- Updated dependencies [5b344b9c]
  - @pandacss/parser@0.4.0
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/generator@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/config@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/extractor@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [9822d79a]
  - @pandacss/config@0.3.2
  - @pandacss/core@0.3.2
  - @pandacss/error@0.3.2
  - @pandacss/extractor@0.3.2
  - @pandacss/generator@0.3.2
  - @pandacss/is-valid-prop@0.3.2
  - @pandacss/logger@0.3.2
  - @pandacss/parser@0.3.2
  - @pandacss/shared@0.3.2
  - @pandacss/token-dictionary@0.3.2
  - @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/config@0.3.1
  - @pandacss/core@0.3.1
  - @pandacss/error@0.3.1
  - @pandacss/extractor@0.3.1
  - @pandacss/generator@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/parser@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- b8ab0868: Fix white space when updating the `.gitignore` file
- Updated dependencies [6d81ee9e]
  - @pandacss/generator@0.3.0
  - @pandacss/parser@0.3.0
  - @pandacss/types@0.3.0
  - @pandacss/config@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
  - @pandacss/error@0.3.0
  - @pandacss/extractor@0.3.0
  - @pandacss/is-valid-prop@0.3.0
  - @pandacss/logger@0.3.0
  - @pandacss/shared@0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [c308e8be]
- Updated dependencies [fb40fff2]
  - @pandacss/config@0.0.2
  - @pandacss/types@0.0.2
  - @pandacss/core@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/extractor@0.0.2
  - @pandacss/generator@0.0.2
  - @pandacss/is-valid-prop@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/parser@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
