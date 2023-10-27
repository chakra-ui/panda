# @pandacss/symlink

## 0.17.2

### Patch Changes

- 443ac85a: Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

  This resolves the following errors:

  ```
   Error: Cannot find module 'resolve.exports'
  ```

  ```
  Error: Cannot find module './src/cli-main'
  ```
