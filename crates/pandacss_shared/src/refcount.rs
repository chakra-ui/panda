//! Refcounted-set helpers: a value stays materialized while any owner references it.

use std::hash::Hash;

use rustc_hash::FxHashMap;

/// Bump `counts[key]`, running `on_first` on the 0→1 transition. Shared by
/// every refcounted cache — a value stays materialized as long
/// as at least one file references it.
#[allow(
    clippy::implicit_hasher,
    reason = "every refcounted cache uses FxHashMap"
)]
pub fn refcount_add<K: Eq + Hash + Clone>(
    counts: &mut FxHashMap<K, u32>,
    key: &K,
    on_first: impl FnOnce(),
) {
    let count = counts.entry(key.clone()).or_insert(0);
    *count += 1;
    if *count == 1 {
        on_first();
    }
}

/// Inverse of [`refcount_add`]: decrement, then run `on_zero` and drop the
/// key at the 1→0 transition.
#[allow(
    clippy::implicit_hasher,
    reason = "every refcounted cache uses FxHashMap"
)]
pub fn refcount_remove<K: Eq + Hash + Clone>(
    counts: &mut FxHashMap<K, u32>,
    key: &K,
    on_zero: impl FnOnce(),
) {
    if let Some(count) = counts.get_mut(key) {
        *count -= 1;
        if *count == 0 {
            counts.remove(key);
            on_zero();
        }
    }
}
