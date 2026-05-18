use std::io;
use std::path::PathBuf;

use fast_glob::glob_match;

use crate::FileSystem;

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

/// Default glob walker. BFS via `fs.read_dir`, prunes directories whose relative path
/// matches any `exclude` pattern, collects files whose relative path matches any
/// `include` pattern.
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
    let mut stack: Vec<PathBuf> = vec![opts.cwd.clone()];

    while let Some(dir) = stack.pop() {
        let entries = match fs.read_dir(&dir) {
            Ok(entries) => entries,
            // Skip unreadable directories rather than fail the whole walk.
            // Matches `fast-glob`'s behavior on permission errors.
            Err(err) if err.kind() == io::ErrorKind::PermissionDenied => continue,
            Err(err) => return Err(err),
        };

        for entry in entries {
            let rel = entry.strip_prefix(&opts.cwd).unwrap_or(&entry);
            let rel_str = rel.to_string_lossy();

            let rel_bytes = rel_str.as_bytes();
            if excludes
                .iter()
                .any(|pat| glob_match(pat.as_bytes(), rel_bytes))
            {
                continue;
            }

            let meta = fs.metadata(&entry)?;
            if meta.is_dir() {
                stack.push(entry);
            } else if meta.is_file()
                && opts
                    .include
                    .iter()
                    .any(|pat| glob_match(pat.as_bytes(), rel_bytes))
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
