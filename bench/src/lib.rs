//! Rust benchmark helpers for the Panda Rust engine migration.
//!
//! The first benchmark scripts are TypeScript-based because they measure the
//! current engine. Native benchmark helpers can be added here once Rust compiler
//! crates contain real behavior.

/// Placeholder to keep the Cargo workspace valid during setup.
#[must_use]
pub const fn is_setup() -> bool {
    true
}
