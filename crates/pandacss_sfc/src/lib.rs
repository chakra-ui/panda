//! Framework single-file components (Astro, Vue, Svelte) lowered to
//! JavaScript at the same byte offsets, so Oxc spans map back unchanged.

pub mod astro;
pub mod js;
pub mod markup;
pub mod svelte;
pub mod vue;
