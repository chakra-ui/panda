//! Writing generated CSS and codegen files through the host filesystem.

use std::fmt;
use std::io;
use std::path::Path;

use pandacss_fs::{FileSystem, PathSystem};

/// Why a generated file couldn't be written.
#[derive(Debug)]
pub enum WriteError {
    /// A generated path would escape its output root.
    UnsafePath {
        label: String,
        path: String,
    },
    Io(io::Error),
}

impl fmt::Display for WriteError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::UnsafePath { label, path } => {
                write!(
                    f,
                    "{label} output path must be a contained relative path: {path}"
                )
            }
            Self::Io(err) => write!(f, "{err}"),
        }
    }
}

impl From<io::Error> for WriteError {
    fn from(err: io::Error) -> Self {
        Self::Io(err)
    }
}

/// Writes each `(relative path, code)` under `root`, creating directories and
/// skipping unchanged files. Returns the written targets.
///
/// # Errors
/// Fails on a path that escapes `root` or on a filesystem error.
pub fn write_relative_files<'a, F: FileSystem>(
    fs: &F,
    paths: &impl PathSystem,
    root: &str,
    files: impl IntoIterator<Item = (&'a str, &'a str)>,
    label: &str,
) -> Result<Vec<String>, WriteError> {
    let mut written = Vec::new();
    for (path, code) in files {
        if !paths.is_safe_relative(path) {
            return Err(WriteError::UnsafePath {
                label: label.to_owned(),
                path: path.to_owned(),
            });
        }
        let target = paths.join(&[root, path]);
        write_output_file(fs, paths, &target, code)?;
        written.push(target);
    }
    Ok(written)
}

/// Writes `code` to `target`, creating its directory and skipping the write
/// when the file already holds `code`.
///
/// # Errors
/// Propagates the filesystem error.
pub fn write_output_file<F: FileSystem>(
    fs: &F,
    paths: &impl PathSystem,
    target: &str,
    code: &str,
) -> io::Result<()> {
    let parent = paths.dirname(target);
    if !parent.is_empty() {
        fs.create_dir_all(Path::new(&parent))?;
    }
    fs.write_if_changed(Path::new(target), code.as_bytes())
        .map(|_| ())
}
