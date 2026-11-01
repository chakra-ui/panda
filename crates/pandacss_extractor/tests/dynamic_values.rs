use indoc::indoc;
use insta::assert_snapshot;
use pandacss_extractor::{ExtractorConfig, JsxExtractionConfig, JsxKind, extract_verbose};

use crate::common::{matcher, panda_config, panda_jsx_config, panda_matchers};

fn dynamic_values(source: &str, path: &str, config: &ExtractorConfig) -> String {
    let result = extract_verbose(source, path, config);
    result
        .dynamic_style_values
        .iter()
        .map(|value| {
            let kind = serde_json::to_value(value.kind).expect("kind");
            let text = &source[value.span.start as usize..value.span.end as usize];
            format!(
                "{} {} `{text}`",
                kind.as_str().expect("kind string"),
                value.path.join(".")
            )
        })
        .collect::<Vec<_>>()
        .join("\n")
}

fn jsx_config() -> ExtractorConfig {
    let mut matchers = panda_matchers();
    matchers.jsx = Some(matcher("@panda/jsx", ["styled", "Box", "Stack"]));
    matchers.jsx_kinds = [("Stack", JsxKind::Pattern), ("Button", JsxKind::Recipe)]
        .into_iter()
        .map(|(name, kind)| (name.to_owned(), kind))
        .collect();
    let mut jsx = JsxExtractionConfig::default();
    jsx.component_names.insert("Button".into());
    ExtractorConfig::new(matchers)
        .with_jsx(jsx)
        .with_jsx_framework(true)
}

#[test]
fn reports_each_unreadable_value_in_a_css_object() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css({ color: color, bg: 'red', p: ['2', size], _hover: { color: hover, bg: 'blue' } });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"
    value color `color`
    value p.1 `size`
    value _hover.color `hover`
    ");
}

#[test]
fn reports_the_runtime_side_of_a_fallback() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css({ color: tone || 'red', bg: surface ?? 'gray', p: gap || other });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"
    fallback color `tone || 'red'`
    fallback bg `surface ?? 'gray'`
    value p `gap || other`
    ");
}

#[test]
fn reports_only_the_unreadable_arm_of_a_ternary() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        css({ color: active ? 'red' : 'blue', bg: active ? 'red' : surface });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"value bg `surface`");
}

#[test]
fn values_panda_resolves_are_not_reported() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        const brand = 'red.500';
        const sizes = { sm: '2', lg: '4' };
        css({ color: brand, p: sizes.lg, m: `${sizes.sm}` });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"");
}

#[test]
fn reports_a_shared_style_object_once_where_the_value_is_written() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        const card = { color: tone, bg: 'white' };
        css(card);
        css(card, { p: '4' });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"value color `tone`");
}

#[test]
fn reports_computed_keys_but_not_spreads() {
    let source = indoc! {r"
        import { css } from '@panda/css';
        const COLOR = 'color';
        css({
          [COLOR]: 'red',
          [property]: 'blue',
          ...props,
          ...(open ? { bg: 'red' } : rest),
          ...(compact && (dense ? { p: '1' } : { p: gap })),
          ...(base || { m: margin }),
        });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"
    property  `[property]: 'blue'`
    value p `gap`
    value m `margin`
    ");
}

#[test]
fn reports_whole_arguments_of_css_and_pattern_calls() {
    let source = indoc! {r"
        import { css, cx } from '@panda/css';
        import { stack } from '@panda/patterns';
        css(styles);
        css({ color: 'red' }, overrides);
        stack(props);
        stack({ gap: gap, direction: 'row' });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"
    argument  `styles`
    argument  `overrides`
    argument  `props`
    value gap `gap`
    ");
}

#[test]
fn recipe_and_token_arguments_are_not_style_values() {
    let source = indoc! {r"
        import { button } from '@panda/recipes';
        import { token } from '@panda/tokens';
        button({ size: size, visual: 'solid' });
        button(props);
        token(path);
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"");
}

#[test]
fn reports_values_inside_cva_and_sva_definitions() {
    let source = indoc! {r"
        import { cva, sva } from '@panda/css';
        cva({ base: { color: tone }, variants: { size: { sm: { p: pad }, lg: { p: '4' } } } });
        sva({ slots: ['root'], base: { root: { bg: surface } } });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"
    value base.color `tone`
    value variants.size.sm.p `pad`
    value base.root.bg `surface`
    ");
}

#[test]
fn reports_style_props_on_panda_jsx() {
    let source = indoc! {r"
        import { Box, Stack, styled } from '@panda/jsx';
        const a = <Box color={tone} bg='red' p={['2', size]} />;
        const b = <styled.div css={{ color: tone2, bg: 'red' }} />;
        const c = <Stack gap={gap} direction='row' />;
        const d = <Box color={only} />;
        const e = <Box {...rest} color='red' />;
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &jsx_config()), @"
    value color `tone`
    value p.1 `size`
    value css.color `tone2`
    value gap `gap`
    value color `only`
    ");
}

#[test]
fn skips_recipe_tags_and_components_panda_does_not_own() {
    let source = indoc! {r"
        import { Icon } from 'lucide-react';
        const a = <Button size={size} />;
        const b = <Icon color={tone} />;
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &jsx_config()), @"");
}

#[test]
fn reports_jsx_style_props_only_when_jsx_is_tracked() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx';
        const a = <Box color={tone} />;
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_config()), @"");
    assert_snapshot!(dynamic_values(source, "app.tsx", &panda_jsx_config()), @"value color `tone`");
}

#[test]
fn reports_compiled_jsx_runtime_props() {
    let source = indoc! {r"
        import { jsx } from 'react/jsx-runtime';
        import { Box } from '@panda/jsx';
        const a = jsx(Box, { color: tone, bg: 'red' });
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &jsx_config()), @"value color `tone`");
}

#[test]
fn reports_a_defaulted_parameter_where_it_is_used() {
    let source = indoc! {r"
        import { Box } from '@panda/jsx';
        export function Card({ tone = 'red', size }) {
          return <Box color={tone} p={size} />;
        }
    "};
    assert_snapshot!(dynamic_values(source, "app.tsx", &jsx_config()), @"
    fallback color `tone`
    value p `size`
    ");
}

#[test]
fn spans_point_into_vue_script_blocks() {
    let source = indoc! {r#"
        <script setup lang="ts">
        import { css } from '@panda/css';
        const card = css({ color: props.tone, bg: 'white' });
        </script>
        <template><div :class="card" /></template>
    "#};
    assert_snapshot!(dynamic_values(source, "Card.vue", &panda_config()), @"value color `props.tone`");
}

#[test]
fn spans_point_into_astro_frontmatter_and_client_scripts() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css';
        const card = css({ color: Astro.props.tone });
        ---
        <div class={card} />
        <script>import { css } from '@panda/css'; css({ bg: window.surface });</script>
    "};
    assert_snapshot!(dynamic_values(source, "Card.astro", &panda_config()), @"
    value color `Astro.props.tone`
    value bg `window.surface`
    ");
}

#[test]
fn reports_vue_template_bindings() {
    let source = indoc! {r#"
        <script setup lang="ts">
        import { Box, Stack } from '@panda/jsx';
        import { Icon } from 'icons';
        const brand = 'red.500';
        </script>
        <template>
          <Box :color="tone" bg="red" :p="brand" :m="open ? '2' : '4'" />
          <Box v-bind:color="tone2" @click="toggle" v-if="shown" :class="classes" />
          <Box :css="{ color: tone3, bg: 'red', p: ['2', gap] }" v-bind="rest" />
          <Stack :gap="gap2" :direction="tone4 || 'row'" />
          <Button :size="size" />
          <Icon :color="tone5" />
        </template>
    "#};
    assert_snapshot!(dynamic_values(source, "Card.vue", &jsx_config()), @"
    value color `tone`
    value color `tone2`
    value css.color `tone3`
    value css.p.1 `gap`
    value gap `gap2`
    value direction `tone4 || 'row'`
    ");
}

#[test]
fn reports_svelte_markup_attributes() {
    let source = indoc! {r#"
        <script lang="ts">
        import { Box } from '@panda/jsx';
        import { Icon } from 'icons';
        const brand = 'red.500';
        </script>

        <Box color={tone} bg="red" p={brand} class={classes} {...rest} />
        <Box css={{ color: tone2, bg: 'red' }} />
        <Button size={size} />
        <Icon color={tone3} />
    "#};
    assert_snapshot!(dynamic_values(source, "Card.svelte", &jsx_config()), @"
    value color `tone`
    value css.color `tone2`
    ");
}

#[test]
fn reports_astro_and_mdx_markup_attributes() {
    let astro = indoc! {r#"
        ---
        import { Box } from '@panda/jsx';
        const brand = 'red.500';
        ---
        <Box color={Astro.props.tone} bg="red" p={brand} />
        <Box css={{ color: tone2 }} />
        <Button size={size} />
    "#};
    assert_snapshot!(dynamic_values(astro, "Card.astro", &jsx_config()), @"
    value color `Astro.props.tone`
    value css.color `tone2`
    ");

    let mdx = indoc! {r#"
        import { Box } from '@panda/jsx'

        # Title

        <Box color={tone} bg="red" css={{ p: gap, m: '2' }} />
    "#};
    assert_snapshot!(dynamic_values(mdx, "page.mdx", &jsx_config()), @"
    value color `tone`
    value css.p `gap`
    ");
}

#[test]
fn a_tag_rule_with_props_keeps_dynamic_values_from_earlier_tags() {
    use pandacss_extractor::{JsxTagAction, JsxTagRule, NamePattern};
    use std::sync::Arc;

    let mut config = jsx_config();
    let mut jsx = config.jsx.clone();
    jsx.tag_rules.push(JsxTagRule {
        tag: Some(NamePattern::Exact("Stack".into())),
        from: None,
        action: JsxTagAction::Include(Some(Arc::new(["gap".to_owned()].into_iter().collect()))),
    });
    config = config.with_jsx(jsx);
    let source = indoc! {r#"
        <script setup lang="ts">
        import { Box, Stack } from '@panda/jsx';
        </script>
        <template>
          <Box :color="tone" />
          <Stack :gap="space" :color="ignored" />
        </template>
    "#};
    assert_snapshot!(dynamic_values(source, "Card.vue", &config), @"
    value color `tone`
    value gap `space`
    ");
}
