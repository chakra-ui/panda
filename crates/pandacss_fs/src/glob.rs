use std::io;
use std::path::{Path, PathBuf};

use fast_glob::glob_match;

use crate::FileSystem;

#[must_use]
pub fn effective_excludes(opts: &GlobOptions) -> Vec<String> {
    if opts.exclude.is_empty() {
        return vec!["**/*.d.ts".to_owned()];
    }
    opts.exclude.clone()
}

/// Strip a leading `./` so `./src/**` matches the cwd-relative `src/App.tsx`, like
/// fast-glob/tinyglobby do on the JS side. `../x` (outside cwd) passes through.
pub(crate) fn normalize_pattern(pattern: &str) -> &str {
    pattern.strip_prefix("./").unwrap_or(pattern)
}

pub(crate) fn matches_any(patterns: &[String], rel_bytes: &[u8]) -> bool {
    patterns
        .iter()
        .any(|pat| glob_match(normalize_pattern(pat).as_bytes(), rel_bytes))
}

/// `path` relative to `cwd`, or `path` itself if it isn't a descendant.
/// Shared by both walkers so entries stay matchable against `cwd`-relative
/// patterns regardless of which root the walk started from.
pub(crate) fn relative_to<'a>(path: &'a Path, cwd: &Path) -> &'a Path {
    path.strip_prefix(cwd).unwrap_or(path)
}

/// Mirrors `Runtime.fs.glob` from `@pandacss/types`.
#[derive(Debug, Clone)]
pub struct GlobOptions {
    /// Glob patterns to match. Empty list returns an empty result (matches JS).
    pub include: Vec<String>,
    /// Glob patterns to skip.
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

/// Classifies one path against the discovery globs without walking the tree —
/// the single-path companion to [`default_walk`], for one watch event rather
/// than a full scan. A path outside `cwd` never matches.
#[must_use]
pub fn matches_globs(path: &Path, opts: &GlobOptions) -> bool {
    let rel = match path.strip_prefix(&opts.cwd) {
        Ok(rel) => rel,
        Err(_) if path.is_relative() => path,
        Err(_) => return false, // outside cwd
    };

    let rel_str = rel.to_string_lossy();
    let rel_bytes = rel_str.as_bytes();
    let excludes = effective_excludes(opts);
    if matches_any(&excludes, rel_bytes) {
        return false;
    }
    matches_any(&opts.include, rel_bytes)
}

/// Static directory prefix of a glob pattern, before the first glob token:
/// `src/**/*.tsx` → `src`; `**/*.tsx` → `""`. A watcher subscribes to these
/// directories instead of every matched file.
#[must_use]
pub fn base_dir(pattern: &str) -> &str {
    // Normalize first so `./src/**` hoists to `src`, not `./src`.
    let pattern = normalize_pattern(pattern);
    let glob_at = pattern.find(['*', '?', '[', '{']).unwrap_or(pattern.len());
    match pattern[..glob_at].rfind('/') {
        Some(slash) => &pattern[..slash],
        None => "",
    }
}

/// Glob portion of `pattern` relative to its [`base_dir`]: `./src/**/*.tsx` →
/// `**/*.tsx`. Paired with `base_dir`, gives a watcher a `(dir, glob)` pair.
#[must_use]
pub fn relative_glob(pattern: &str) -> &str {
    let normalized = normalize_pattern(pattern);
    let base = base_dir(pattern);
    if base.is_empty() {
        normalized
    } else {
        normalized[base.len()..].trim_start_matches('/')
    }
}

/// Concrete start directories for the walk: `cwd` joined with each include's
/// [`base_dir`], so `src/**/*.tsx` walks `cwd/src` instead of the whole tree.
/// A root nested under a shallower one is dropped; an empty base (`**/*.tsx`)
/// collapses back to `cwd`.
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
        // Sorted, so every ancestor precedes its descendants — checking
        // against `scoped` alone is enough to drop nested roots.
        if !scoped.iter().any(|kept| root.starts_with(kept)) {
            scoped.push(root);
        }
    }

    scoped
}

/// BFS glob walker via `fs.read_dir`, starting from the hoisted [`walk_roots`]
/// (not `cwd`). Prunes excluded directories, collects included files.
pub(crate) fn default_walk<F: FileSystem + ?Sized>(
    fs: &F,
    opts: &GlobOptions,
) -> io::Result<Vec<PathBuf>> {
    if opts.include.is_empty() {
        return Ok(Vec::new());
    }

    let excludes = effective_excludes(opts);

    let mut results: Vec<PathBuf> = Vec::new();
    let mut stack: Vec<PathBuf> = walk_roots(opts);

    while let Some(dir) = stack.pop() {
        let entries = match fs.read_dir(&dir) {
            Ok(entries) => entries,
            // A hoisted base dir may not exist; skip it rather than fail the walk.
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
            let rel = relative_to(&entry, &opts.cwd);
            let rel_str = rel.to_string_lossy();
            let rel_bytes = rel_str.as_bytes();

            if matches_any(&excludes, rel_bytes) {
                continue;
            }
            let meta = fs.metadata(&entry)?;
            if meta.is_dir() {
                stack.push(entry);
            } else if meta.is_file() && matches_any(&opts.include, rel_bytes) {
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
