use std::io;
use std::path::{Component, Path, PathBuf};

use fast_glob::glob_match;

use crate::path::{normalize_posix, to_forward_slash};
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

/// Resolves `.` and `..` without touching the disk.
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

/// `path` relative to `base`, with `..` once it leaves `base`.
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

/// Matches absolute paths if absolute, else `cwd`-relative ones (with `..`).
struct ExcludeGlob {
    pattern: String,
    absolute: bool,
}

impl ExcludeGlob {
    fn matches(&self, candidate: &Candidate) -> bool {
        let target = if self.absolute {
            &candidate.absolute
        } else {
            &candidate.relative
        };
        glob_match(self.pattern.as_bytes(), target.as_bytes())
    }
}

/// The directory a walk starts from, and the glob below it.
struct IncludeGlob {
    root: PathBuf,
    glob: String,
}

impl IncludeGlob {
    fn matches(&self, path: &Path) -> bool {
        match path.strip_prefix(&self.root) {
            Ok(rest) if !rest.as_os_str().is_empty() => {
                glob_match(self.glob.as_bytes(), to_forward_slash(rest).as_bytes())
            }
            _ => false,
        }
    }

    /// Whether a file under `dir` could match, so `../*/src/*.ts` never walks `../*/node_modules`.
    fn may_match_under(&self, dir: &Path) -> bool {
        if self.root.starts_with(dir) {
            return true;
        }
        let Ok(rest) = dir.strip_prefix(&self.root) else {
            return false;
        };
        if has_slash_in_braces(&self.glob) {
            return true;
        }
        let mut segments = self.glob.split('/');
        for name in rest {
            match segments.next() {
                Some(segment) if segment.contains("**") => return true,
                Some(segment) if glob_match(segment.as_bytes(), name.as_encoded_bytes()) => {}
                _ => return false,
            }
        }
        segments.next().is_some()
    }
}

/// `{src,lib/ui}/*.ts` can't be matched one path segment at a time.
fn has_slash_in_braces(glob: &str) -> bool {
    let mut depth = 0usize;
    for byte in glob.bytes() {
        match byte {
            b'{' => depth += 1,
            b'}' => depth = depth.saturating_sub(1),
            b'/' if depth > 0 => return true,
            _ => {}
        }
    }
    false
}

/// `C:\` drive globs in `/` form, with `.`/`..` resolved in the static prefix.
fn canonical_glob(pattern: &str) -> String {
    let pattern = if is_drive_path(pattern) {
        pattern.replace('\\', "/")
    } else {
        pattern.to_owned()
    };
    let pattern = normalize_glob_pattern(&pattern);
    let base = base_dir(pattern);
    match normalize_posix(base).as_str() {
        _ if base.is_empty() => pattern.to_owned(),
        "." => relative_glob(pattern).to_owned(),
        base => format!("{base}/{}", relative_glob(pattern)),
    }
}

fn is_drive_path(pattern: &str) -> bool {
    matches!(pattern.as_bytes(), [drive, b':', b'/' | b'\\', ..] if drive.is_ascii_alphabetic())
}

/// `realpath`; a missing file resolves its nearest existing parent.
#[must_use]
pub fn real_path<F: FileSystem + ?Sized>(fs: &F, path: &Path) -> PathBuf {
    if let Ok(real) = fs.canonicalize(path) {
        return strip_verbatim(real);
    }
    match (path.parent(), path.file_name()) {
        (Some(parent), Some(name)) if !parent.as_os_str().is_empty() => {
            real_path(fs, parent).join(name)
        }
        _ => path.to_path_buf(),
    }
}

/// Drops the Windows `\\?\` prefix.
fn strip_verbatim(path: PathBuf) -> PathBuf {
    let text = path.to_string_lossy();
    if let Some(rest) = text.strip_prefix(r"\\?\UNC\") {
        return PathBuf::from(format!(r"\\{rest}"));
    }
    if let Some(rest) = text.strip_prefix(r"\\?\") {
        return PathBuf::from(rest);
    }
    path
}

pub(crate) struct Candidate<'a> {
    path: &'a Path,
    relative: String,
    absolute: String,
}

/// Which files are sources; shared by `scan()` and [`matches_globs`].
pub(crate) struct SourceMatcher {
    cwd: PathBuf,
    include: Vec<IncludeGlob>,
    exclude: Vec<ExcludeGlob>,
}

impl SourceMatcher {
    pub(crate) fn new(opts: &GlobOptions, resolve: impl Fn(&Path) -> PathBuf) -> Self {
        let cwd = lexical(&opts.cwd);
        let include = opts
            .include
            .iter()
            .map(|pattern| {
                let pattern = canonical_glob(pattern);
                IncludeGlob {
                    root: resolve(&lexical(&cwd.join(base_dir(&pattern)))),
                    glob: relative_glob(&pattern).to_owned(),
                }
            })
            .collect();
        let exclude = effective_excludes(opts)
            .iter()
            .map(|pattern| {
                let pattern = canonical_glob(pattern);
                ExcludeGlob {
                    absolute: pattern.starts_with('/') || is_drive_path(&pattern),
                    pattern,
                }
            })
            .collect();
        Self {
            cwd: resolve(&cwd),
            include,
            exclude,
        }
    }

    pub(crate) fn walk_roots(&self) -> Vec<PathBuf> {
        let mut roots: Vec<PathBuf> = self.include.iter().map(|glob| glob.root.clone()).collect();
        roots.sort();
        roots.dedup();
        let mut scoped: Vec<PathBuf> = Vec::new();
        for root in roots {
            if !scoped.iter().any(|kept| root.starts_with(kept)) {
                scoped.push(root);
            }
        }
        scoped
    }

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
        self.include.iter().any(|glob| glob.matches(candidate.path))
    }

    pub(crate) fn may_include_under(&self, dir: &Path) -> bool {
        self.include.iter().any(|glob| glob.may_match_under(dir))
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
/// than a full scan. Lexical; see [`matches_globs_in`] for symlinks.
#[must_use]
pub fn matches_globs(path: &Path, opts: &GlobOptions) -> bool {
    let matcher = SourceMatcher::new(opts, Path::to_path_buf);
    is_source(&matcher, &lexical(&opts.cwd.join(path)))
}

/// [`matches_globs`] on real paths, so symlinked spellings match.
#[must_use]
pub fn matches_globs_in<F: FileSystem + ?Sized>(fs: &F, path: &Path, opts: &GlobOptions) -> bool {
    if matches_globs(path, opts) {
        return true;
    }
    let matcher = SourceMatcher::new(opts, |path| real_path(fs, path));
    is_source(&matcher, &real_path(fs, &lexical(&opts.cwd.join(path))))
}

/// Paths that may name the same file as `path`: as given, its real path, and
/// that real path under each symlinked `cwd` or include root.
#[must_use]
pub fn path_aliases<F: FileSystem + ?Sized>(
    fs: &F,
    path: &Path,
    opts: &GlobOptions,
) -> Vec<PathBuf> {
    let cwd = lexical(&opts.cwd);
    let given = lexical(&cwd.join(path));
    let real = real_path(fs, &given);
    let roots = opts
        .include
        .iter()
        .map(|pattern| lexical(&cwd.join(base_dir(&canonical_glob(pattern)))));
    let mut aliases = vec![given, real.clone()];
    for root in std::iter::once(cwd.clone()).chain(roots) {
        let real_root = real_path(fs, &root);
        if real_root == root {
            continue;
        }
        if let Ok(rest) = real.strip_prefix(&real_root) {
            aliases.push(root.join(rest));
        }
    }
    aliases.dedup();
    aliases
}

fn is_source(matcher: &SourceMatcher, path: &Path) -> bool {
    let candidate = matcher.candidate(path);
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

/// The static watch directory for `pattern`, or `cwd` when it has none.
#[must_use]
pub fn resolve_glob_base(paths: &impl PathSystem, cwd: &str, pattern: &str) -> String {
    let pattern = canonical_glob(pattern);
    let base = base_dir(&pattern);
    if base.is_empty() {
        return cwd.to_owned();
    }
    let joined = paths.join(&[cwd, base]);
    if joined
        .split(['/', '\\'])
        .any(|part| part == "." || part == "..")
    {
        lexical(Path::new(&joined)).to_string_lossy().into_owned()
    } else {
        joined
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
        .map(|pattern| lexical(&opts.cwd.join(base_dir(&canonical_glob(pattern)))))
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

    let matcher = SourceMatcher::new(opts, Path::to_path_buf);
    let mut results: Vec<PathBuf> = Vec::new();
    let mut stack: Vec<PathBuf> = matcher.walk_roots();

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
                if matcher.may_include_under(&entry) {
                    stack.push(entry);
                }
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
