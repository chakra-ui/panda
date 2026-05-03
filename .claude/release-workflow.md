# Release Workflow

Follow these steps in order when releasing a new Panda CSS version.

## Steps

### 1. Check for an open Version Packages PR

Look for an open PR titled **"Version Packages"** (opened by the Changesets GitHub Action). Only proceed if one is open.

### 2. Pull main

```bash
git pull origin main
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

**Option A — GitHub Actions:** The publish workflow on `main` completes successfully.

```bash
gh run list --branch main --workflow=release.yml --limit 1
```

**Option B — Git tags:** A tag for a key package at the new version exists.

```bash
git fetch --tags
git tag | grep '@pandacss/types@<version>'
```

Poll every ~30 seconds. If not confirmed after 10 minutes, stop and investigate.

### 7. Draft the CHANGELOG.md entry

Using the changeset content captured in step 4, add a new entry at the top of `CHANGELOG.md` following the existing format:

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
git commit -m "chore: add changelog for v<version>"
git push -u origin changelog/v<version>
gh pr create --title "chore: add changelog for v<version>"
gh pr merge --squash --delete-branch
```

### 9. Pull main again

```bash
git pull origin main
```

### 10. Create the GitHub Announcements discussion

Open a new discussion in the **Announcements** category with the release notes. Close it immediately after using the `closeDiscussion` GraphQL mutation (closed announcements still appear pinned in the Discussions tab).

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

### 11. Post to Discord

Paste this into the Discord `#announcements` channel:

```
@here 🐼
Panda v<version>
<discussion url>
```
