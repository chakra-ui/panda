use std::io;
use std::path::{Component, Path, PathBuf};

use fast_glob::glob_match;

use crate::path::to_forward_slash;
use crate::{FileSystem, PathSystem};

#[must_use]
pub fn effective_excludes(opts: &GlobOptions) -> Vec<String> {
    if opts.exclude.is_empty() {
        return vec!["**/*.d.ts".to_owned()];
    }
    opts.exclude.clone()
}

/// Strips a leading `./` so `./src/**` matches the cwd-relative `src/App.tsx`, like
/// fast-glob/tinyglobby do on the JS side. `../x` (outside cwd) passes through.
#[must_use]
pub fn normalize_glob_pattern(pattern: &str) -> &str {
    pattern.strip_prefix("./").unwrap_or(pattern)
}

/// Resolves `.` and `..` by path components without touching the disk, keeping
/// native separators. A leading `..` in a relative path is kept.
pub(crate) fn lexical(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::CurDir => {}
            Component::ParentDir => {
                if matches!(out.components().next_back(), Some(Component::Normal(_))) {
                    out.pop();
                } else if !out.has_root() {
                    out.push("..");
                }
            }
            other => out.push(other),
        }
    }
    out
}

/// `path` relative to `base` (both lexical), with `..` once it leaves `base`.
fn relative_lexical(path: &Path, base: &Path) -> PathBuf {
    let path: Vec<Component> = path.components().collect();
    let base: Vec<Component> = base.components().collect();
    let common = path.iter().zip(&base).take_while(|(a, b)| a == b).count();
    let mut out = PathBuf::new();
    for _ in common..base.len() {
        out.push("..");
    }
    for component in &path[common..] {
        out.push(component);
    }
    out
}

/// One include or exclude glob. An absolute glob matches absolute paths; any
/// other matches paths relative to `cwd`, so `../pkg/**` reaches a sibling.
struct SourceGlob {
    pattern: String,
    absolute: bool,
    /// Directory the walk starts from; an include only matches files under it.
    root: PathBuf,
}

impl SourceGlob {
    fn new(pattern: &str, cwd: &Path) -> Self {
        let pattern = normalize_glob_pattern(pattern);
        Self {
            pattern: pattern.to_owned(),
            absolute: Path::new(pattern).is_absolute(),
            root: lexical(&cwd.join(base_dir(pattern))),
        }
    }

    fn matches(&self, candidate: &Candidate) -> bool {
        let target = if self.absolute {
            &candidate.absolute
        } else {
            &candidate.relative
        };
        glob_match(self.pattern.as_bytes(), target.as_bytes())
    }
}

/// A lexical path in both forms a [`SourceGlob`] can match.
pub(crate) struct Candidate<'a> {
    path: &'a Path,
    relative: String,
    absolute: String,
}

/// Decides which files count as sources. Shared by `scan()` and
/// [`matches_globs`], so a watch event classifies a file the same way the walk
/// found it.
pub(crate) struct SourceMatcher {
    cwd: PathBuf,
    include: Vec<SourceGlob>,
    exclude: Vec<SourceGlob>,
}

impl SourceMatcher {
    pub(crate) fn new(opts: &GlobOptions) -> Self {
        let cwd = lexical(&opts.cwd);
        let include = opts
            .include
            .iter()
            .map(|p| SourceGlob::new(p, &cwd))
            .collect();
        let exclude = effective_excludes(opts)
            .iter()
            .map(|p| SourceGlob::new(p, &cwd))
            .collect();
        Self {
            cwd,
            include,
            exclude,
        }
    }

    /// `path` must already be lexical (see [`lexical`]).
    pub(crate) fn candidate<'a>(&self, path: &'a Path) -> Candidate<'a> {
        Candidate {
            path,
            relative: to_forward_slash(&relative_lexical(path, &self.cwd)),
            absolute: to_forward_slash(path),
        }
    }

    pub(crate) fn is_excluded(&self, candidate: &Candidate) -> bool {
        self.exclude.iter().any(|glob| glob.matches(candidate))
    }

    pub(crate) fn is_included(&self, candidate: &Candidate) -> bool {
        self.include
            .iter()
            .any(|glob| candidate.path.starts_with(&glob.root) && glob.matches(candidate))
    }

    pub(crate) fn relative_path(&self, path: &Path) -> PathBuf {
        relative_lexical(path, &self.cwd)
    }
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
/// than a full scan. A relative `path` is resolved against `cwd`.
#[must_use]
pub fn matches_globs(path: &Path, opts: &GlobOptions) -> bool {
    let path = lexical(&opts.cwd.join(path));
    let matcher = SourceMatcher::new(opts);
    let candidate = matcher.candidate(&path);
    !matcher.is_excluded(&candidate) && matcher.is_included(&candidate)
}

/// Static directory prefix of a glob pattern, before the first glob token:
/// `src/**/*.tsx` → `src`; `**/*.tsx` → `""`. A watcher subscribes to these
/// directories instead of every matched file.
#[must_use]
pub fn base_dir(pattern: &str) -> &str {
    // Normalize first so `./src/**` hoists to `src`, not `./src`.
    let pattern = normalize_glob_pattern(pattern);
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
    let normalized = normalize_glob_pattern(pattern);
    let base = base_dir(pattern);
    if base.is_empty() {
        normalized
    } else {
        normalized[base.len()..].trim_start_matches('/')
    }
}

/// Resolve the static watch directory for `pattern` against `cwd`, with `..`
/// resolved so watchers report events under the same path `scan()` returns.
/// Patterns without a static prefix watch `cwd` itself.
#[must_use]
pub fn resolve_glob_base(paths: &impl PathSystem, cwd: &str, pattern: &str) -> String {
    let base = base_dir(pattern);
    if base.is_empty() {
        cwd.to_owned()
    } else {
        lexical(Path::new(&paths.join(&[cwd, base])))
            .to_string_lossy()
            .into_owned()
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
        .map(|pattern| lexical(&opts.cwd.join(base_dir(normalize_glob_pattern(pattern)))))
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

    let matcher = SourceMatcher::new(opts);
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
            let candidate = matcher.candidate(&entry);
            if matcher.is_excluded(&candidate) {
                continue;
            }
            let meta = fs.metadata(&entry)?;
            if meta.is_dir() {
                stack.push(entry);
            } else if meta.is_file() && matcher.is_included(&candidate) {
                if opts.absolute {
                    results.push(entry);
                } else {
                    results.push(matcher.relative_path(&entry));
                }
            }
        }
    }

    results.sort();
    Ok(results)
}
