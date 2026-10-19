Thanks for showing interest to contribute to Panda CSS 💖, you rock!

When it comes to open source, there are different ways you can contribute, all of which are valuable. Here's a few
guidelines that should help you as you prepare your contribution.

## Setup the Project

The following steps will get you up and running to contribute to Panda CSS:

1. Fork the repo (click the <kbd>Fork</kbd> button at the top right of [this page](https://github.com/chakra-ui/panda))

2. Clone your fork locally

```sh
git clone https://github.com/<your_github_username>/panda.git
cd panda
```

3. Install [Rust](https://rustup.rs/). `rust-toolchain.toml` pins the version, so `rustup` picks it up automatically.
   Then install dependencies with `pnpm install`.

> If you run into any issues during this step, kindly reach out to the Panda CSS team here:
> [Panda Discord](https://discord.gg/VQrkpsgSx7)

## Development

To improve our development process, we've set up tooling and systems. Panda CSS uses a monorepo structure with the
following structure:

### Directory Structure

- [`crates/`](crates): the Rust compiler engine (extraction, CSS emission, codegen, source transforms). Start with
  [`crates/RUST_GUIDE.md`](crates/RUST_GUIDE.md).
- [`packages/`](packages): the published `@pandacss/*` packages.
  - [`dev`](packages/dev): the package users install, with config helpers and the `panda` CLI
  - [`cli`](packages/cli): the `panda` command
  - [`compiler`](packages/compiler): native Node binding for the Rust engine
  - [`compiler-wasm`](packages/compiler-wasm): WebAssembly binding for the browser and the playground
  - [`compiler-shared`](packages/compiler-shared): TypeScript contract shared by both bindings
  - [`config`](packages/config): loads, bundles, and serializes a Panda config
  - [`types`](packages/types): public types
  - [`preset-base`](packages/preset-base), [`preset-panda`](packages/preset-panda),
    [`preset-typography`](packages/preset-typography): presets
  - [`postcss`](packages/postcss), [`vite`](packages/vite), [`webpack`](packages/webpack), [`rollup`](packages/rollup),
    [`bun`](packages/bun): build integrations
  - [`transformer`](packages/transformer): source transforms used by the bundler plugins
  - [`eslint-plugin`](packages/eslint-plugin), [`mcp`](packages/mcp): lint and AI tooling
- [`apps/`](apps): the [playground](apps/playground) and [Studio](apps/studio).
- [`website/`](website): the docs site and blog.
- [`sandbox/`](sandbox): example projects used as integration tests.
- [`design-notes/`](design-notes): architecture decisions for the Rust engine.

### Tooling

- [PNPM](https://pnpm.io/) to manage packages and dependencies
- [Tsup](https://tsup.egoist.dev/) to bundle packages
- [Vitest](https://vitest.dev/) for testing, mostly using snapshots
- [Changeset](https://github.com/atlassian/changesets) for changes documentation, changelog generation, and release
  management.

### Commands

**`pnpm install`**: installs dependencies and builds the TypeScript packages.

**`pnpm dev`**: starts tsup in watch mode for all packages.

**`pnpm build`**: builds all packages.

**`pnpm test <path>`**: runs Vitest, for example `pnpm test packages/cli`.

**`pnpm test:compiler`**: rebuilds the native binding and runs the compiler tests. Use it after changing Rust code.

**`pnpm rust:test`**, **`pnpm rust:fmt`**, **`pnpm rust:clippy`**: Rust tests, formatting, and lints. CI runs all three.

## Think you found a bug?

Please conform to the issue template and provide a clear path to reproduction with a code example. The best way to show
a bug is by sending a minimal reproduction as a GitHub repo, CodeSandbox, or StackBlitz.

You may wish to use this starter template to help you get going: https://github.com/astahmer/panda-vite-template

## Proposing new or changed API?

Please provide thoughtful comments and some sample API code. Proposals that don't line up with our roadmap or don't have
a thoughtful explanation will be closed. You can check the existing proposals and our official roadmap here:
https://panda-css.canny.io/

## Making a Pull Request?

Pull requests need only the :+1: of two or more collaborators to be merged; when the PR author is a collaborator, that
counts as one.

### Commit Convention

Before you create a Pull Request, please check whether your commits comply with the commit conventions used in this
repository.

When you create a commit we kindly ask you to follow the convention `category(scope or module): message` in your commit
message while using one of the following categories:

- `feat / feature`: all changes that introduce completely new code or new features
- `fix`: changes that fix a bug (ideally you will additionally reference an issue if present)
- `refactor`: any code related change that is not a fix nor a feature
- `docs`: changing existing or creating new documentation (i.e. README, docs for usage of a lib or cli usage)
- `build`: all changes regarding the build of the software, changes to dependencies or the addition of new dependencies
- `test`: all changes regarding tests (adding new tests or changing existing ones)
- `ci`: all changes regarding the configuration of continuous integration (i.e. github actions, ci system)
- `chore`: all changes to the repository that do not fit into any of the above categories

If you are interested in the detailed specification you can visit https://www.conventionalcommits.org/ or check out the
[Angular Commit Message Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines).

### Steps to PR

1. Fork of the panda repository and clone your fork

2. Create a new branch out of the `v2` branch. We follow the convention `[type/scope]`. For example `fix/accordion-hook`
   or `docs/menu-typo`. `type` can be either `docs`, `fix`, `feat`, `build`, or any other conventional commit type.
   `scope` is just a short id that describes the scope of work.

3. Make and commit your changes following the [commit convention](#commit-convention). As you develop, run
   `pnpm test <path>` for the packages you touched, and `pnpm test:compiler` if you changed Rust code.

4. Run `pnpm changeset` to create a detailed description of your changes. This will be used to generate a changelog when
   we publish an update. [Learn more about Changeset](https://github.com/atlassian/changesets/tree/master/packages/cli).
5. Also, if you provide `jsx` snippets to the changeset, please turn off the live preview by doing the following at the
   beginning of the snippet: ` ```jsx live=false`

> If you made minor changes like CI config, prettier, etc, you can run `pnpm changeset add --empty` to generate an empty
> changeset file to document your changes.

### Tests

All commits that fix bugs or add features need a test.

## Want to write a blog post or tutorial

That would be amazing! Reach out to the core team here: https://discord.gg/VQrkpsgSx7. We would love to support you any
way we can.

## Want to help improve the docs?

Our docs live in [`website/content/docs`](./website/content/docs/).

## License

By contributing your code to the panda GitHub repository, you agree to license your contribution under the MIT license.
