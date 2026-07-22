use std::path::{Path, PathBuf};

/// Host-specific path operations (join/resolve), kept separate from
/// [`crate::FileSystem`] since they need no IO.
pub trait PathSystem: Send + Sync {
    fn is_absolute(&self, path: &str) -> bool;
    fn join(&self, parts: &[&str]) -> String;
    fn dirname(&self, path: &str) -> String;

    fn is_safe_relative(&self, path: &str) -> bool {
        if path.is_empty()
            || self.is_absolute(path)
            || path.bytes().any(|byte| byte.is_ascii_control())
            || matches!(path.as_bytes(), [drive, b':', ..] if drive.is_ascii_alphabetic())
        {
            return false;
        }
        path.split(['/', '\\'])
            .all(|part| !part.is_empty() && !matches!(part, "." | ".."))
    }

    fn resolve(&self, cwd: &str, path: &str) -> String {
        if self.is_absolute(path) {
            path.to_owned()
        } else {
            self.join(&[cwd, path])
        }
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct OsPathSystem;

impl PathSystem for OsPathSystem {
    fn is_absolute(&self, path: &str) -> bool {
        Path::new(path).is_absolute()
    }

    fn join(&self, parts: &[&str]) -> String {
        let mut out = PathBuf::new();
        for part in parts {
            if !part.is_empty() {
                out.push(part);
            }
        }
        out.to_string_lossy().into_owned()
    }

    fn dirname(&self, path: &str) -> String {
        Path::new(path)
            .parent()
            .map(|path| path.to_string_lossy().into_owned())
            .unwrap_or_default()
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct PosixPathSystem;

impl PathSystem for PosixPathSystem {
    fn is_absolute(&self, path: &str) -> bool {
        path.starts_with('/')
    }

    fn join(&self, parts: &[&str]) -> String {
        let mut out = String::new();
        for part in parts.iter().copied().filter(|part| !part.is_empty()) {
            if self.is_absolute(part) {
                out.clear();
                out.push_str(part);
                continue;
            }
            if out.is_empty() {
                out.push_str(part);
                continue;
            }
            if !out.ends_with('/') {
                out.push('/');
            }
            out.push_str(part);
        }
        normalize_posix(&out)
    }

    fn dirname(&self, path: &str) -> String {
        if path == "/" {
            return "/".to_owned();
        }
        let path = path.trim_end_matches('/');
        let Some(index) = path.rfind('/') else {
            return String::new();
        };
        if index == 0 {
            "/".to_owned()
        } else {
            path[..index].to_owned()
        }
    }
}

fn normalize_posix(path: &str) -> String {
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
