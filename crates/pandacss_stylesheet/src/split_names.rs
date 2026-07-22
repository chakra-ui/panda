//! Deterministic, collision-safe filenames for split stylesheet entries.

use rustc_hash::{FxHashMap, FxHashSet};

use pandacss_shared::{file_stem, to_hash};

#[derive(Default)]
pub(crate) struct SplitNameRegistry {
    by_logical_name: FxHashMap<String, String>,
    used: FxHashSet<String>,
}

impl SplitNameRegistry {
    pub(crate) fn allocate(&mut self, logical_name: &str) -> String {
        if let Some(allocated) = self.by_logical_name.get(logical_name) {
            return allocated.clone();
        }

        let stem = file_stem(logical_name);
        let mut candidate = stem.clone();
        if self.used.contains(&candidate) {
            candidate = format!("{stem}-{}", to_hash(logical_name));
            let base = candidate.clone();
            let mut suffix = 2_u32;
            while self.used.contains(&candidate) {
                candidate = format!("{base}-{suffix}");
                suffix = suffix.saturating_add(1);
            }
        }

        self.used.insert(candidate.clone());
        self.by_logical_name
            .insert(logical_name.to_owned(), candidate.clone());
        candidate
    }
}

#[cfg(test)]
mod tests {
    use insta::assert_snapshot;

    use super::SplitNameRegistry;

    #[test]
    fn sanitizes_paths_and_disambiguates_collisions() {
        let mut names = SplitNameRegistry::default();
        let traversal = names.allocate("../../../outside");
        let colliding = names.allocate("outside");

        assert_snapshot!(
            format!(
                "traversal: {traversal}\ncollision: {colliding}\nrepeat: {}",
                names.allocate("../../../outside")
            ),
        @r"
        traversal: outside
        collision: outside-kchoyq
        repeat: outside
        "
        );
    }
}
