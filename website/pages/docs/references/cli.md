---
title: CLI Reference
description: You can use the Command-Line Interface (CLI) provided by Panda to develop, build, and preview your project from a terminal window.
---

# CLI Reference

You can use the Command-Line Interface (CLI) provided by Panda to develop, build, and preview your project from a
terminal window.

## `panda init`

Initialize Panda in a project. This process will:

- Create a `panda.config.ts` file in your project with the default settings and presets.
- Emit CSS utilities for your project in the specified `output` directory.

### Flags

#### `--interactive, -i`

Whether to run the interactive mode

#### `--force, -f`

Whether to overwrite existing files

#### `--postcss, -p`

Whether to emit a [postcss](https://postcss.org/) config file

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config)

#### `--cwd`

Path to current working direcory

#### `--silent`

Whether to suppress all output

#### `--no-gitignore`

Whether to update gitignorew with the output directory

#### `--out-extension`

The extension of the generated js files (default: 'mjs')

Related: [`config.outExtension`](/docs/references/config#outExtension)

#### `--jsx-framework`

The jsx framework to use

Related: [`config.jsxFramework`](/docs/references/config#jsxFramework)

#### `--syntax`

The css syntax preference

Related: [`config.syntax`](/docs/references/config#syntax)

#### `--strict-tokens`

Set strickTokens to true

Related: [`config.strictTokens`](/docs/references/config#strictTokens)

---

## `panda`

Run the extract process to generate static CSS from your project.

### Flags

#### `--outdir`

The output directory for the generated CSS utilities

Related: [`config.outdir`](/docs/references/config#outdir)

#### `--minify`

Whether to minify the generated CSS

Related: [`config.minify`](/docs/references/config#minify)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--config, -c`

The path to the config file

Related: [`config`](/docs/references/config.md)

#### `--cwd`

The current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--preflight`

Whether to emit the preflight or reset CSS

Related: [`config.preflight`](/docs/references/config#preflight)

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--exclude, -e`

Files to exclude from the extract process

Related: [`config`](/docs/references/config.md)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--hash`

Whether to hash the output classnames

Related: [`config.hash`](/docs/references/config#hash)

#### `--emitTokensOnly`

Whether to only emit the `tokens` directory

Related: [`config.emitTokensOnly`](/docs/references/config#emitTokensOnly)

---

## `panda codegen`

Generate new CSS utilities for your project based on the configuration file.

### Flags

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda cssgen`

Generate the CSS from files.

You can use a `glob` to override the `config.include` option like this:

`panda cssgen "src/**/*.css" --outfile dist.css`

or you can use it with a `{type}` argument to generate only a specific type of CSS:

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

### Flags

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--minify`

Whether to minify the generated CSS

Related: [`config.minify`](/docs/references/config#minify)

#### `--clean`

Whether to clean the output directory before emitting

Related: [`config.clean`](/docs/references/config#clean)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--watch, -w`

Whether to watch for changes in the project

Related: [`config.watch`](/docs/references/config#watch)

## `--minimal`

Skip generating CSS for theme tokens, preflight, keyframes, static and global css.

Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

> Note that you can use a `glob` to override the `config.include` option like this:
> `panda cssgen "src/**/*.css" --minimal`

This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

Use it like this:

```bash
panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
```

#### `--poll`

Whether to poll for file changes

Related: [`config.poll`](/docs/references/config#poll)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda studio`

Realtime documentation for your design tokens.

### Flags

#### `--build`

Build

#### `--preview`

Preview

#### `--port`

Use custom port

#### `--host`

Expose to custom host

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

#### `--outdir`

Output directory for static files

## `panda analyze`

Analyze design token usage in glob.

### Flags

#### `--json [filepath]`

Output analyze report in given JSON filepath

> `panda analyze --json report.json`

#### `--silent`

Whether to suppress all output

Related: [`config.logLevel`](/docs/references/config#log-level)

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)

## `panda debug`

Debug design token extraction & CSS generated from files in glob.

### Flags

#### `--silent`

Whether to suppress all output

#### `--dry`

Output debug files in stdout without writing to disk

#### `--outdir [dir]`

Output directory for debug files, defaults to `../styled-system/debug`

#### `--only-config`

Should only output the config file, default to 'false'

#### `--config, -c`

Path to Panda config file

Related: [`config`](/docs/references/config.md)

#### `--cwd`

Current working directory

Related: [`config.cwd`](/docs/references/config#cwd)
