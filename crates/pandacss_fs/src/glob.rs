use std::io;
use std::path::{Path, PathBuf};

use fast_glob::glob_match;

use crate::FileSystem;

/// Strip a leading `./` so `./src/**` matches the cwd-relative `src/App.tsx`, like
/// fast-glob/tinyglobby do on the JS side. `../x` (outside cwd) passes through.
pub(crate) fn normalize_pattern(pattern: &str) -> &str {
    pattern.strip_prefix("./").unwrap_or(pattern)
}

/// Discovery options. Mirrors `Runtime.fs.glob` from `@pandacss/types` so the Rust
/// engine sees the same shape JS Panda already uses.
#[derive(Debug, Clone)]
pub struct GlobOptions {
    /// Glob patterns to match. Empty list returns an empty result (matches JS).
    pub include: Vec<String>,
    /// Glob patterns to skip. When empty, defaults to `["**/*.d.ts"]` (matches JS).
    pub exclude: Vec<String>,
    /// Base directory. Patterns and results are resolved relative to this.
    pub cwd: PathBuf,
    /// When `true`, results are absolute paths; otherwise relative to `cwd`.
    pub absolute: bool,
}

impl Default for GlobOptions {
    fn default() -> Self {
        Self {
            include: Vec::new(),
            exclude: Vec::new(),
            cwd: PathBuf::from("."),
            absolute: true,
        }
    }
}

/// Whether a single `path` matches the discovery globs without walking the tree:
/// its `cwd`-relative form matches some `include` pattern and no `exclude` pattern
/// (defaulting to `["**/*.d.ts"]`, matching the walk). A path outside `cwd` never
/// matches. The single-path companion to [`default_walk`] — for classifying one
/// watch event rather than enumerating the project.
#[must_use]
pub fn matches_globs(path: &Path, opts: &GlobOptions) -> bool {
    let rel = match path.strip_prefix(&opts.cwd) {
        Ok(rel) => rel,
        Err(_) if path.is_relative() => path,
        Err(_) => return false, // outside cwd
    };
    let rel_str = rel.to_string_lossy();
    let rel_bytes = rel_str.as_bytes();

    let default_excludes = ["**/*.d.ts".to_owned()];
    let excludes: &[String] = if opts.exclude.is_empty() {
        &default_excludes
    } else {
        &opts.exclude
    };
    if excludes
        .iter()
        .any(|pat| glob_match(normalize_pattern(pat).as_bytes(), rel_bytes))
    {
        return false;
    }
    opts.include
        .iter()
        .any(|pat| glob_match(normalize_pattern(pat).as_bytes(), rel_bytes))
}

/// The static directory prefix of a glob pattern — the part before the first
/// glob token. `src/**/*.tsx` → `src`; `**/*.tsx` → `""`. A watcher subscribes
/// to these directories instead of every matched file.
#[must_use]
pub fn base_dir(pattern: &str) -> &str {
    // Normalize first so `./src/**` hoists to `src` (not `./src`), keeping walk roots
    // free of `.` components that `read_dir` on an exact-path FS would miss.
    let pattern = normalize_pattern(pattern);
    let glob_at = pattern.find(['*', '?', '[', '{']).unwrap_or(pattern.len());
    match pattern[..glob_at].rfind('/') {
        Some(slash) => &pattern[..slash],
        None => "",
    }
}

/// Concrete directories the walk should start from — `cwd` joined with each
/// include's [`base_dir`]. Scoping the walk to `cwd/src` for `src/**/*.tsx`
/// avoids traversing unrelated trees. Roots nested under a shallower root are
/// dropped (the ancestor already covers them); an empty base (`**/*.tsx`)
/// collapses everything back to `cwd`.
#[must_use]
pub fn walk_roots(opts: &GlobOptions) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = opts
        .include
        .iter()
        .map(|pattern| opts.cwd.join(base_dir(pattern)))
        .collect();
    roots.sort();
    roots.dedup();

    let mut scoped: Vec<PathBuf> = Vec::new();
    for root in roots {
        // `sort` placed every ancestor before its descendants, so checking the
        // roots already kept is enough to drop nested ones.
        if !scoped.iter().any(|kept| root.starts_with(kept)) {
            scoped.push(root);
        }
    }
    scoped
}

/// Default glob walker. BFS via `fs.read_dir`, prunes directories whose relative path
/// matches any `exclude` pattern, collects files whose relative path matches any
/// `include` pattern. The walk starts from the hoisted [`walk_roots`], not `cwd`.
pub(crate) fn default_walk<F: FileSystem + ?Sized>(
    fs: &F,
    opts: &GlobOptions,
) -> io::Result<Vec<PathBuf>> {
    if opts.include.is_empty() {
        return Ok(Vec::new());
    }

    // JS auto-injects ["**/*.d.ts"] when exclude is empty.
    let default_excludes = ["**/*.d.ts".to_owned()];
    let excludes: &[String] = if opts.exclude.is_empty() {
        &default_excludes
    } else {
        &opts.exclude
    };

    let mut results: Vec<PathBuf> = Vec::new();
    let mut stack: Vec<PathBuf> = walk_roots(opts);

    while let Some(dir) = stack.pop() {
        let entries = match fs.read_dir(&dir) {
            Ok(entries) => entries,
            // Skip unreadable or missing directories rather than fail the whole
            // walk — a hoisted base dir may not exist, and permission errors
            // mirror `fast-glob`'s behavior.
            Err(err)
                if matches!(
                    err.kind(),
                    io::ErrorKind::PermissionDenied | io::ErrorKind::NotFound
                ) =>
            {
                continue;
            }
            Err(err) => return Err(err),
        };

        for entry in entries {
            let rel = entry.strip_prefix(&opts.cwd).unwrap_or(&entry);
            let rel_str = rel.to_string_lossy();
            let rel_bytes = rel_str.as_bytes();

            if excludes
                .iter()
                .any(|pat| glob_match(normalize_pattern(pat).as_bytes(), rel_bytes))
            {
                continue;
            }

            // Recurse into directories; collect files matching any include.
            let meta = fs.metadata(&entry)?;
            if meta.is_dir() {
                stack.push(entry);
            } else if meta.is_file()
                && opts
                    .include
                    .iter()
                    .any(|pat| glob_match(normalize_pattern(pat).as_bytes(), rel_bytes))
            {
                if opts.absolute {
                    results.push(entry);
                } else {
                    results.push(rel.to_path_buf());
                }
            }
        }
    }

    results.sort();
    Ok(results)
}
