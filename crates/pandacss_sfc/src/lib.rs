//! Framework single-file components (Astro, Vue, Svelte) lowered to
//! JavaScript at the same byte offsets, so Oxc spans map back unchanged.

pub mod astro;
pub mod js;
pub mod markup;
pub mod mdx;
pub mod svelte;
pub mod vue;

// The same span-backed attribute contract is shared by Astro and MDX.
pub use astro::{
    AstroAttribute as TemplateAttribute, AstroAttributeValue as TemplateAttributeValue,
    AstroDiagnostic as ContainerDiagnostic, AstroElement as TemplateElement,
};
