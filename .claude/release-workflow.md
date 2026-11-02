# Release Workflow

Follow these steps in order when releasing a new Panda CSS version.

Panda has two release lines:

- **v2** (this branch, the default): the current stable line. Its release PR is titled **"Version Packages"**.
- **v1** (the `v1` branch): maintenance releases only. Its release PR is titled **"Version Packages (v1)"** and
  publishes under the `v1` npm dist-tag, so 2.x keeps `latest`.

The steps below apply to both lines. Replace `<branch>` with `v2` or `v1` depending on which line you are releasing,
and run the git/file steps on a checkout of that branch.

## Steps

### 1. Check for an open Version Packages PR

Look for an open PR titled **"Version Packages"** (v2) or **"Version Packages (v1)"** (v1), opened by the Changesets
GitHub Action. Only proceed if one is open.

### 2. Pull the release branch

```bash
git pull origin <branch>
```

### 3. Detect the version

Read the version from the Version Packages PR description. All packages are bumped to the same version.

### 4. Read all changeset files NOW

The `.changeset/*.md` files are **deleted when the version PR merges**. Capture their content before merging anything.

```bash
ls .changeset/*.md | grep -v README
```

### 5. Merge the Version Packages PR

```bash
gh pr merge <number> --squash --delete-branch
```

This triggers the npm publish CI workflow and deletes the changeset files.

### 6. Poll until packages are confirmed released

Wait for one of these signals before proceeding:

**Option A — GitHub Actions:** The publish workflow on the release branch completes successfully.

```bash
gh run list --branch <branch> --workflow=release.yml --limit 1
```

**Option B — Git tags:** A tag for a key package at the new version exists.

```bash
git fetch --tags
git tag | grep '@pandacss/types@<version>'
```

Poll every ~30 seconds. A v1 release publishes in a few minutes. A v2 release first builds the native compiler for
every target plus the wasm/wasi artifacts, so expect 20-30 minutes; watch the workflow run rather than assuming a
stall. If the workflow fails, stop and investigate.

### 7. Draft the CHANGELOG.md entry

Using the changeset content captured in step 4, add a new entry at the top of the release branch's `CHANGELOG.md`
following the existing format:

```markdown
## [<version>](#<version>) - <date>

### Added

...

### Fixed

...
```

### 8. Create and merge the changelog PR

```bash
git checkout -b changelog/v<version>
git add CHANGELOG.md
git commit -m "docs: add v<version> changelog entry"
git push -u origin changelog/v<version>
gh pr create --base <branch> --title "docs: add v<version> changelog entry"
gh pr merge --squash --delete-branch
```

### 9. Pull the release branch again

```bash
git pull origin <branch>
```

### 10. Create the GitHub Announcements discussion

Skip this step and step 11 for v1 maintenance releases.

Open a new discussion in the **Announcements** category with the release notes. Close it immediately after using the
`closeDiscussion` GraphQL mutation (closed announcements still appear pinned in the Discussions tab).

```bash
# Create
gh api graphql -f query='
mutation {
  createDiscussion(input: {
    repositoryId: "R_kgDOHuVHqA"
    categoryId: "DIC_kwDOHuVHqM4CXQ3j"
    title: "Panda v<version>"
    body: "..."
  }) {
    discussion { id url }
  }
}'

# Close (use the id returned above)
gh api graphql -f query='
mutation {
  closeDiscussion(input: { discussionId: "<id>" }) {
    discussion { id closed }
  }
}'
```

Note: the GraphQL mutations need a personal `gh` login. Claude Code remote sessions can't run them; they will hand
these commands back to you instead.

### 11. Post to Discord

Paste this into the Discord `#announcements` channel:

```
@here 🐼
Panda v<version>
<discussion url>
```
