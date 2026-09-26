use std::path::Path;

/// `path` with `\` separators turned into `/`.
#[must_use]
pub fn to_forward_slash(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}

/// Resolves `.` and `..` segments without touching the disk. A leading `..` in a
/// relative path is kept, so `../x` never collapses onto `x`.
#[must_use]
pub fn normalize_lexical(path: &Path) -> String {
    normalize_posix(&to_forward_slash(path))
}

/// Resolves `.` and `..` in a `/`-separated path. A leading `..` in a relative
/// path is kept; at the root it is dropped.
pub(crate) fn normalize_posix(path: &str) -> String {
    let absolute = path.starts_with('/');
    let mut parts = Vec::new();

    for part in path.split('/') {
        match part {
            "" | "." => {}
            ".." => {
                if matches!(parts.last(), Some(last) if *last != "..") {
                    parts.pop();
                } else if !absolute {
                    parts.push(part);
                }
            }
            part => parts.push(part),
        }
    }

    if absolute {
        if parts.is_empty() {
            "/".to_owned()
        } else {
            format!("/{}", parts.join("/"))
        }
    } else if parts.is_empty() {
        ".".to_owned()
    } else {
        parts.join("/")
    }
}
