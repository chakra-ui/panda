use std::sync::LazyLock;

use pandacss_config::UserConfig;
use pandacss_encoder::{Atom, AtomValue, RecipeStyleGroupSnapshot};
use pandacss_literal::Literal;
use pandacss_shared::hyphenate_property;
use pandacss_tokens::{TokenCategory, TokenDictionary};
use pandacss_utility::Utility;
use rustc_hash::{FxHashMap, FxHashSet};
use serde_json::Value;

use super::{
    EmitContext, ReferenceSink, UtilityStyleOverrides, collect_css_var_refs,
    collect_token_reference_vars, composition_prop, composition_style_object,
    is_animation_property, raw_css_var_name, visit_token_reference_paths,
};

/// A configured asset that a style reads.
#[derive(Clone, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum StyleReference {
    /// A token path, such as `colors.red.500`.
    Token(String),
    Keyframe(String),
    /// A composition path, such as `textStyles.body` or `animationStyles.fade-in`.
    Composition(String),
    /// A canonical utility name.
    Utility(String),
}

/// Answers what a style references, using the same lowering the stylesheet uses to emit it.
///
/// Every answer is direct: an animation token is a [`StyleReference::Token`], and the
/// keyframes it names come from [`StyleReferences::dependencies`] of that token.
pub struct StyleReferences<'a> {
    cx: EmitContext<'a>,
    dictionary: Option<&'a TokenDictionary>,
    keyframes: Option<&'a serde_json::Map<String, Value>>,
}

static NO_OVERRIDES: LazyLock<UtilityStyleOverrides> =
    LazyLock::new(UtilityStyleOverrides::default);

impl<'a> StyleReferences<'a> {
    /// References against the config's own keyframes, without JS utility transforms.
    #[must_use]
    pub fn new(
        config: &'a UserConfig,
        utility: &'a Utility,
        dictionary: Option<&'a TokenDictionary>,
    ) -> Self {
        Self::with_overrides(
            config,
            utility,
            dictionary,
            &NO_OVERRIDES,
            config.theme.keyframes.as_object(),
        )
    }

    pub(crate) fn with_overrides(
        config: &'a UserConfig,
        utility: &'a Utility,
        dictionary: Option<&'a TokenDictionary>,
        overrides: &'a UtilityStyleOverrides,
        keyframes: Option<&'a serde_json::Map<String, Value>>,
    ) -> Self {
        Self {
            cx: EmitContext::new(config, utility, overrides, dictionary),
            dictionary,
            keyframes,
        }
    }

    /// What one authored property references, such as `color: 'red.500'`.
    #[must_use]
    pub fn property(&self, prop: &str, value: &Value) -> Vec<StyleReference> {
        let mut style = serde_json::Map::with_capacity(1);
        style.insert(prop.to_owned(), value.clone());
        self.style_object(&Value::Object(style))
    }

    /// What a style object references, through conditions and nested selectors.
    #[must_use]
    pub fn style_object(&self, styles: &Value) -> Vec<StyleReference> {
        self.collect(|cx, sink| cx.collect_styles_usage(styles, sink))
    }

    #[must_use]
    pub fn global_css(&self, global_css: &Value) -> Vec<StyleReference> {
        self.collect(|cx, sink| cx.collect_global_styles_usage(global_css, sink))
    }

    /// What a configured asset's own definition references: a token's value under every
    /// condition, a keyframe's steps, or a composition's styles.
    #[must_use]
    pub fn dependencies(&self, reference: &StyleReference) -> Vec<StyleReference> {
        match reference {
            StyleReference::Token(path) => self.collect(|_, sink| {
                let Some(dictionary) = self.dictionary else {
                    return;
                };

                let animation = dictionary
                    .token(path)
                    .is_some_and(|token| token.category == TokenCategory::Animations);
                let values = dictionary.token(path).into_iter().chain(
                    dictionary
                        .conditions()
                        .iter()
                        .filter_map(|condition| dictionary.token_with_condition(path, condition)),
                );

                for token in values {
                    if let Some(original) = token.original_value.as_deref() {
                        sink.write_paths_in(original);
                    }
                    if animation {
                        sink.declaration("animation", &token.value);
                    } else {
                        sink.value(&token.value);
                    }
                }

                sink.forget(&StyleReference::Token(path.clone()));
            }),
            StyleReference::Keyframe(name) => self.collect(|cx, sink| {
                let steps = self
                    .keyframes
                    .and_then(|frames| frames.get(name))
                    .and_then(Value::as_object);

                for step in steps.into_iter().flat_map(serde_json::Map::values) {
                    cx.collect_styles_usage(step, sink);
                }
            }),
            StyleReference::Composition(path) => self.collect(|cx, sink| {
                let Some((prop, name)) = composition_parts(path) else {
                    return;
                };

                let value = AtomValue::String(name.into());
                let result = cx.transform_atom_styles(prop, name, &value);

                if let Some(styles) = composition_style_object(prop, &result.styles) {
                    cx.collect_grouped_style_usage(styles, false, sink);
                }
            }),
            StyleReference::Utility(_) => Vec::new(),
        }
    }

    pub(crate) fn atom(&self, atom: &Atom) -> Vec<StyleReference> {
        self.collect(|cx, sink| cx.collect_atom_usage(atom, sink))
    }

    pub(crate) fn recipe_group(&self, group: &RecipeStyleGroupSnapshot) -> Vec<StyleReference> {
        self.collect(|cx, sink| cx.collect_recipe_group_usage(group, sink))
    }

    pub(crate) fn global_vars(&self) -> Vec<StyleReference> {
        self.collect(|cx, sink| cx.collect_global_vars_usage(sink))
    }

    /// Raw values, such as token paths captured from `token()` calls.
    pub(crate) fn values<'v>(
        &self,
        values: impl IntoIterator<Item = &'v str>,
    ) -> Vec<StyleReference> {
        self.collect(|_, sink| values.into_iter().for_each(|value| sink.value(value)))
    }

    pub(crate) fn is_configured_keyframe(&self, name: &str) -> bool {
        self.cx.config.theme.keyframes.get(name).is_some()
    }

    fn collect(
        &self,
        walk: impl FnOnce(&EmitContext<'a>, &mut ReferenceCollector<'_, 'a>),
    ) -> Vec<StyleReference> {
        let mut sink = ReferenceCollector {
            owner: self,
            seen: FxHashSet::default(),
            references: Vec::new(),
            written: FxHashMap::default(),
        };

        walk(&self.cx, &mut sink);
        sink.references
    }

    fn token_path(&self, var: &str) -> Option<String> {
        let token = self.dictionary?.token_by_var(&format!("var({var})"))?;
        Some(token.path.to_string())
    }

    fn utility_name(&self, prop: &str) -> Option<String> {
        let utility = self.cx.utility;
        let canonical = utility.resolve_shorthand(prop);
        if utility.is_known(canonical) {
            return Some(canonical.to_owned());
        }

        self.cx
            .config
            .utilities
            .keys()
            .find(|key| hyphenate_property(key) == prop)
            .cloned()
    }
}

/// Keeps direct references only: compositions stay whole and animation tokens are not
/// followed to their keyframes.
struct ReferenceCollector<'r, 'a> {
    owner: &'r StyleReferences<'a>,
    seen: FxHashSet<StyleReference>,
    references: Vec<StyleReference>,
    /// Variable → every token path written for the value being resolved next. Aliases
    /// can share a variable, so the variable alone can't say which ones were written.
    written: FxHashMap<String, Vec<String>>,
}

impl ReferenceCollector<'_, '_> {
    fn push(&mut self, reference: StyleReference) {
        if self.seen.insert(reference.clone()) {
            self.references.push(reference);
        }
    }

    fn write_path(&mut self, path: &str) {
        let Some(var) = self
            .owner
            .dictionary
            .and_then(|dictionary| dictionary.get_var_str(path, None))
            .and_then(raw_css_var_name)
        else {
            return;
        };
        let paths = self.written.entry(var.to_owned()).or_default();
        if !paths.iter().any(|written| written == path) {
            paths.push(path.to_owned());
        }
    }

    fn write_paths_in(&mut self, value: &str) {
        visit_token_reference_paths(value, &mut |path| self.write_path(path));
    }

    fn token_paths(&self, var: &str) -> Vec<String> {
        match self.written.get(var) {
            Some(paths) => paths.clone(),
            None => self.owner.token_path(var).into_iter().collect(),
        }
    }

    /// Drops a self-reference, so a token never depends on itself.
    fn forget(&mut self, reference: &StyleReference) {
        self.references.retain(|item| item != reference);
    }
}

impl ReferenceSink for ReferenceCollector<'_, '_> {
    fn declaration(&mut self, prop: &str, value: &str) {
        self.value(value);

        if is_animation_property(prop)
            && let Some(keyframes) = self.owner.keyframes
        {
            crate::visit_animation_names(value, None, |name| {
                if keyframes.contains_key(name) {
                    self.push(StyleReference::Keyframe(name.to_owned()));
                }
            });
        }
    }

    fn authored_declaration(&mut self, prop: &str, value: &str, authored: &[(&str, &str)]) {
        for (authored_prop, authored_value) in authored {
            let literal = Literal::String((*authored_value).to_owned());
            if let Some(resolved) = self
                .owner
                .cx
                .utility
                .resolve_utility_value(authored_prop, &literal)
            {
                for path in &resolved.tokens {
                    self.write_path(path);
                }
            }
        }
        self.declaration(prop, value);
    }

    fn value(&mut self, value: &str) {
        self.write_paths_in(value);
        let mut vars = FxHashSet::default();
        collect_css_var_refs(value, &mut vars);
        collect_token_reference_vars(value, self.owner.dictionary, &mut vars);

        let mut paths = vars
            .iter()
            .flat_map(|var| self.token_paths(var))
            .collect::<Vec<_>>();
        paths.sort_unstable();

        for path in paths {
            self.push(StyleReference::Token(path));
        }
        self.written.clear();
    }

    fn property(&mut self, prop: &str) {
        if let Some(name) = self.owner.utility_name(prop) {
            self.push(StyleReference::Utility(name));
        }
    }

    fn composition(&mut self, prop: &'static str, name: &str) {
        if self
            .owner
            .cx
            .utility
            .property_keys(prop)
            .iter()
            .any(|key| key == name)
        {
            self.push(StyleReference::Composition(format!("{prop}s.{name}")));
        }
    }

    fn expands_compositions(&self) -> bool {
        false
    }
}

/// `textStyles.body` → (`textStyle`, `body`).
fn composition_parts(path: &str) -> Option<(&'static str, &str)> {
    let (group, name) = path.split_once('.')?;
    Some((composition_prop(group.strip_suffix('s')?)?, name))
}
