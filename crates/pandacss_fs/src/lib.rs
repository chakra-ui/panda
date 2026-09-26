//! Filesystem abstraction for the Panda Rust pipeline: `os` (native `std::fs`
//! wrapper) and `memory` (in-memory, wasm-safe) impls of [`FileSystem`]. Core
//! crates depend on the trait only, never `std::fs`, so `--no-default-features
//! --features memory` builds for `wasm32-unknown-unknown`. See `design-notes/filesystem.md`.

mod file_system;
mod glob;
mod path;
mod path_system;

#[cfg(feature = "memory")]
mod memory;
#[cfg(feature = "os")]
mod os;

pub use crate::file_system::FileSystem;
pub use crate::glob::{
    GlobOptions, base_dir, matches_globs, normalize_glob_pattern, relative_glob, resolve_glob_base,
    walk_roots,
};
pub use crate::path::{normalize_lexical, to_forward_slash};
pub use crate::path_system::{OsPathSystem, PathSystem, PosixPathSystem};

#[cfg(feature = "memory")]
pub use crate::memory::MemoryFileSystem;
#[cfg(feature = "os")]
pub use crate::os::OsFileSystem;

pub use oxc_resolver::FileSystem as OxcResolverFileSystem;
