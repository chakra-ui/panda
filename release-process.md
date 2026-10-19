# Release process

## Overview

We aim for a release per week, and release immediately for critical bugs and security issues.

## Versioning

All packages are versioned equally and managed with [Changeset](https://github.com/changesets/changesets).

## CI validation

Before merging release workflow changes, run the local Rust quality gate from the repository root:

```sh
pnpm rust:fmt
pnpm rust:check
pnpm rust:clippy
pnpm rust:test
```

The `Rust Quality` workflow runs the same Rust checks in CI for Rust/compiler-related changes.

To test the publish workflow without publishing packages, trigger the `Publish` workflow with `dry_run=true`:

```sh
gh workflow run release.yml \
  --repo <owner>/panda \
  --ref <branch> \
  -f dry_run=true
```

For example, to test a pull request branch from a fork:

```sh
gh workflow run release.yml \
  --repo Adebesin-Cell/panda \
  --ref chore/v2-beta-release-setup \
  -f dry_run=true
```

Then watch the run:

```sh
gh run list --repo <owner>/panda --workflow Publish --limit 5
gh run watch --repo <owner>/panda
```

The dry run builds the native binding matrix, builds the wasm artifacts once, stages the platform npm packages, builds
package JS/types without rebuilding native or wasm artifacts, and verifies that all eight native `.node` artifacts are
present. It does not run `changeset publish`.

## Process

Releases go out from the `v2` branch through the `Publish` workflow (`.github/workflows/release.yml`).

1. **Add a changeset to every user-facing PR.** Run `pnpm changeset` and follow
   [`TONE_OF_VOICE.md`](./TONE_OF_VOICE.md). All `@pandacss/*` packages are one fixed version group, so any bump moves
   every package. Skip the changeset for internal, CI, or docs-only changes.

2. **Review the `Version Packages` PR.** On each push to `v2` that touches `.changeset/`, `packages/`, `crates/`, or the
   other paths the workflow watches, the changesets action opens or updates this PR. It bumps versions and writes each
   package's `CHANGELOG.md` from the pending changesets. Edit the changelogs in the PR if an entry needs polish.

3. **Merge it to publish.** The workflow builds the native binding matrix, the wasm and WASI builds, then runs
   `pnpm release`:

   - `napi pre-publish` publishes the nine `@pandacss/compiler-*` platform packages
   - `release:verify` checks the staged artifacts
   - `changeset publish` publishes the `@pandacss/*` packages to `latest`

   > **Maintainers:** a Slack message goes to the #release channel when the publish succeeds.

4. **Check the registry.** npm can take a few minutes to serve a new version or tag. Confirm with
   `curl -s https://registry.npmjs.org/-/package/@pandacss/dev/dist-tags` rather than a single `npm view`.

### If a publish fails

Re-run the failed jobs (`gh run rerun <run-id> --failed`). A half-finished publish is safe to retry: `napi pre-publish`
skips platform packages that are already on npm, and `changeset publish` skips versions that already exist.

Don't add a changeset while fixing a failed publish. With unconsumed changesets, the workflow opens a new
`Version Packages` PR instead of publishing the current version.

### Prereleases

To ship a prerelease line, run `pnpm changeset pre enter <tag>` (for example `beta` or `rc`), commit
`.changeset/pre.json`, and release as usual; packages publish under that dist-tag. Run `pnpm changeset pre exit` before
the stable release.

### v1 maintenance

Panda 1.x lives on the `v1` branch, which has its own changesets config (`baseBranch: v1`) and publishes with
`changeset publish --tag v1`, so 1.x patches never move `latest`. Branch v1 fixes from `v1`, not `v2`.
