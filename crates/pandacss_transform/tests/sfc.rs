use super::common::transform;
use indoc::indoc;
use insta::assert_snapshot;

#[test]
fn escapes_double_quotes_inside_vue_attributes() {
    let source = indoc! {r#"
        <script setup lang="ts">
        import { css } from '@panda/css';
        </script>

        <template>
          <div :class="css({ color: 'red' })">{{ css({ marginTop: '4px' }) }}</div>
        </template>
    "#};

    let output = transform("src/App.vue", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    <script setup lang="ts">
    </script>

    <template>
      <div :class="&quot;color_red&quot;">{{ "margin-top_4px" }}</div>
    </template>
    "#);
}

#[test]
fn escapes_single_quotes_inside_vue_attributes() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <div :class='css({ color: "red" })' />
        </template>
    "#};

    let output = transform("src/App.vue", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    <script setup>
    </script>

    <template>
      <div :class='"color_red"' />
    </template>
    "#);
}

#[test]
fn leaves_vue_script_rewrites_unescaped() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        const cls = css({ color: 'red' });
        </script>

        <template>
          <div :class="cls" />
        </template>
    "#};

    let output = transform("src/App.vue", source);

    assert!(output.changed);
    assert_snapshot!(output.code, @r#"
    <script setup>
    const cls = "color_red";
    </script>

    <template>
      <div :class="cls" />
    </template>
    "#);
}

#[test]
fn rewrites_svelte_and_astro_expressions() {
    let svelte = indoc! {r#"
        <script>
        import { css } from '@panda/css';
        </script>

        <div class={css({ color: 'red' })}></div>
    "#};
    let astro = indoc! {r#"
        ---
        import { css } from '@panda/css';
        ---

        <div class={css({ color: 'red' })}></div>
    "#};

    assert_snapshot!(transform("src/App.svelte", svelte).code, @r#"
    <script>
    </script>

    <div class={"color_red"}></div>
    "#);
    assert_snapshot!(transform("src/Card.astro", astro).code, @r#"
    ---
    ---

    <div class={"color_red"}></div>
    "#);
}
