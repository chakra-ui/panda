# Release process

## Overview

Our release process is very flexible and can be adapted to the needs of the project. We generally aim for a release per
week, but we do immediate releases for critical bugs and security issues.

## Versioning

All packages are versioned equally and managed with [Changeset](https://github.com/changesets/changesets).

## Process

Before creating a new release, make sure that there are no pending pull requests that should be included in the release.

1. Open the [CHANGELOG.md](./CHANGELOG.md) file and add a new section for the new release

   We use the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format, and each release section should look
   like:

   ```md
   ## [VERSION] - <DATE>

   ### Fixed

   ### Added

   ### Changed
   ```

2. Using each changeset in the [.changeset](./.changeset) directory, add the changes to the new release section.

   **Some things to note:**

   - If a change is not relevant to the end user, feel free to omit it from the changelog.
   - You can edit the changeset content to make it more readable. Every changelog should be easy to understand by the
     end user, and include some code snippets if possible.

3. Merge the `Version Packages` Pull Request opened by the Changeset GitHub Action

   > **Maintainers:** After the release, a Slack message will be sent to the #release channel

4. When the release is complete, create a PR to update the [CHANGELOG.md](./CHANGELOG.md) file with the new version
