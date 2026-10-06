//! Framework single-file components (Astro, Vue, Svelte) lowered to
//! JavaScript at the same byte offsets, so Oxc spans map back unchanged.

pub mod astro;
pub mod js;
pub mod markup;
pub mod mdx;
pub mod svelte;
pub mod template;
pub mod vue;

pub use template::{
    ContainerDiagnostic, TemplateAttribute, TemplateAttributeValue, TemplateElement,
};
