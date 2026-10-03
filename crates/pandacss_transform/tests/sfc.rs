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
fn leaves_vue_v_pre_markup_literal_and_rewrites_following_bindings() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <div :class="css({ color: 'red' })" v-pre>
            <span :class="css({ color: 'blue' })">{{ css({ marginTop: '4px' }) }}</span>
            <img :class="css({ color: 'green' })">
          </div>
          <p :class="css({ color: 'purple' })" />
          <div v-pre="" :class="css({ color: 'orange' })" />
          <p :class="css({ color: 'black' })" />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <div :class="css({ color: 'red' })" v-pre>
        <span :class="css({ color: 'blue' })">{{ css({ marginTop: '4px' }) }}</span>
        <img :class="css({ color: 'green' })">
      </div>
      <p :class="&quot;color_purple&quot;" />
      <div v-pre="" :class="css({ color: 'orange' })" />
      <p :class="&quot;color_black&quot;" />
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

#[test]
fn escapes_quotes_in_long_form_vue_bindings() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <div v-bind:class="css({ color: 'red' })" />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <div v-bind:class="&quot;color_red&quot;" />
    </template>
    "#);
}

#[test]
fn escapes_quotes_in_vue_array_and_object_bindings() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        defineProps(['active']);
        </script>

        <template>
          <div :class="[css({ color: 'red' }), 'static']" />
          <div :class="{ [css({ color: 'blue' })]: active }" />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    defineProps(['active']);
    </script>

    <template>
      <div :class="[&quot;color_red&quot;, 'static']" />
      <div :class="{ [&quot;color_blue&quot;]: active }" />
    </template>
    "#);
}

#[test]
fn escapes_quotes_in_vue_pattern_calls() {
    let source = indoc! {r#"
        <script setup>
        import { hstack } from '@panda/patterns';
        </script>

        <template>
          <div :class="hstack({ gap: '2' })" />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <div :class="&quot;gap_2&quot;" />
    </template>
    "#);
}

#[test]
fn escapes_ampersands_in_vue_attributes() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <div :class="css({ '& > p': { color: 'red' } })" />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <div :class="&quot;[&amp;_>_p]:color_red&quot;" />
    </template>
    "#);
}

#[test]
fn escapes_each_vue_attribute_on_one_element() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <div
            :class="css({ color: 'red' })"
            :data-a='css({ color: "blue" })'
            title="css({ color: 'green' })"
          />
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <div
        :class="&quot;color_red&quot;"
        :data-a='"color_blue"'
        title="css({ color: 'green' })"
      />
    </template>
    "#);
}

#[test]
fn leaves_non_html_vue_templates_untouched() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template lang="pug">
        div(:class="css({ color: 'red' })")
        </template>
    "#};

    let output = transform("src/App.vue", source);

    assert!(!output.bailed);
    assert!(
        output
            .code
            .contains(r#"div(:class="css({ color: 'red' })")"#)
    );
}

#[test]
fn rewrites_quoted_svelte_attribute_expressions() {
    let source = indoc! {r#"
        <script>
        import { css } from '@panda/css';
        </script>

        <div class="{css({ color: 'red' })}"></div>
    "#};

    assert_snapshot!(transform("src/App.svelte", source).code, @r#"
    <script>
    </script>

    <div class="{"color_red"}"></div>
    "#);
}

#[test]
fn rewrites_svelte_module_and_instance_scripts() {
    let source = indoc! {r#"
        <script module>
        import { css } from '@panda/css';
        export const shared = css({ color: 'red' });
        </script>

        <script>
        const local = css({ color: 'blue' });
        </script>

        <div class={[local, css({ marginTop: '4px' })]}>{shared}</div>
    "#};

    assert_snapshot!(transform("src/App.svelte", source).code, @r#"
    <script module>
    export const shared = "color_red";
    </script>

    <script>
    const local = "color_blue";
    </script>

    <div class={[local, "margin-top_4px"]}>{shared}</div>
    "#);
}

#[test]
fn rewrites_astro_frontmatter_and_class_list() {
    let source = indoc! {r#"
        ---
        import { css } from '@panda/css';
        const title = css({ color: 'red' });
        ---

        <h1 class={title}>Title</h1>
        <p class:list={[css({ marginTop: '4px' }), 'lead']}>Body</p>
    "#};

    assert_snapshot!(transform("src/Card.astro", source).code, @r#"
    ---
    const title = "color_red";
    ---

    <h1 class={title}>Title</h1>
    <p class:list={["margin-top_4px", 'lead']}>Body</p>
    "#);
}

#[test]
fn leaves_astro_client_scripts_untouched() {
    let source = indoc! {r#"
        ---
        import { css } from '@panda/css';
        ---

        <h1 class={css({ color: 'red' })}>Title</h1>
        <script>
          import { css } from '@panda/css';
          document.body.className = css({ color: 'blue' });
        </script>
    "#};

    assert_snapshot!(transform("src/Card.astro", source).code, @r#"
    ---
    ---

    <h1 class={"color_red"}>Title</h1>
    <script>
      import { css } from '@panda/css';
      document.body.className = css({ color: 'blue' });
    </script>
    "#);
}

#[test]
fn keeps_the_astro_fence_when_removing_a_semicolon_less_last_import() {
    let source = indoc! {r"
        ---
        import Card from './Card.astro'
        import { css } from '@panda/css'
        import { hstack } from '@panda/patterns'
        ---

        <div class={hstack({ gap: '2' })}><Card class={css({ color: 'red' })} /></div>
    "};

    assert_snapshot!(transform("src/pages/index.astro", source).code, @r#"
    ---
    import Card from './Card.astro'
    ---

    <div class={"gap_2"}><Card class={"color_red"} /></div>
    "#);
}

#[test]
fn keeps_astro_frontmatter_separate_from_template_expressions() {
    let source = indoc! {r"
        ---
        import { css } from '@panda/css'
        const theme = { color: 'red' }
        ---

        <p class={css({ color: theme.color })}>x</p>
    "};

    assert_snapshot!(transform("src/Card.astro", source).code, @r#"
    ---
    const theme = { color: 'red' }
    ---

    <p class={"color_red"}>x</p>
    "#);
}

#[test]
fn rewrites_vue_bindings_after_a_nested_template() {
    let source = indoc! {r#"
        <script setup>
        import { css } from '@panda/css';
        </script>

        <template>
          <main>
            <template v-if="ok">
              <p :class="css({ color: 'red' })" />
            </template>
            <p :class="css({ color: 'blue' })" />
          </main>
        </template>
    "#};

    assert_snapshot!(transform("src/App.vue", source).code, @r#"
    <script setup>
    </script>

    <template>
      <main>
        <template v-if="ok">
          <p :class="&quot;color_red&quot;" />
        </template>
        <p :class="&quot;color_blue&quot;" />
      </main>
    </template>
    "#);
}

#[test]
fn astro_components_stay_and_nested_css_calls_rewrite() {
    let source = indoc! {r#"
        ---
        import { css } from '@panda/css';
        import { Box } from '@panda/jsx';
        const show = true;
        ---
        <Box color="red" p="2">top</Box>
        {show && <Box color="blue" p="3">inner</Box>}
        {show && (<div><!-- note --><p class={css({ color: 'green' })} /></div>)}
        {show && <b class={css({ color: 'red' })} /><i class={css({ color: 'blue' })} />}
        {show && <p title={`${css({ color: 'teal' })}`} />}
        <div is:raw>{css({ color: 'pink' })}</div>
    "#};

    assert_snapshot!(transform("src/Card.astro", source).code, @r#"
    ---
    import { Box } from '@panda/jsx';
    const show = true;
    ---
    <Box color="red" p="2">top</Box>
    {show && <Box color="blue" p="3">inner</Box>}
    {show && (<div><!-- note --><p class={"color_green"} /></div>)}
    {show && <b class={"color_red"} /><i class={"color_blue"} />}
    {show && <p title={`${"color_teal"}`} />}
    <div is:raw>{css({ color: 'pink' })}</div>
    "#);
}

#[test]
fn astro_rewrites_keep_crlf_and_non_ascii_offsets() {
    let source = "---\r\nimport { css } from '@panda/css';\r\n---\r\n<p>café — 日本</p>\r\n<p class={css({ color: 'red' })} />\r\n";
    assert_eq!(
        transform("src/Card.astro", source).code,
        "---\r\n\r\n---\r\n<p>café — 日本</p>\r\n<p class={\"color_red\"} />\r\n"
    );
}
