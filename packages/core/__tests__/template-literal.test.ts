import { astish } from '@pandacss/shared'
import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'

const css = (styles: TemplateStringsArray) => {
  const processor = createRuleProcessor({ syntax: 'template-literal' })
  return processor.css(astish(styles[0])).toCss()
}

describe('css template literal', () => {
  test('emits atomic css', () => {
    expect(css`
      width: 500px;
      height: 500px;
      background: red;
      @media (min-width: 700px) {
        background: blue;
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .width_500px {
          width: 500px;
      }

        .height_500px {
          height: 500px;
      }

        .background_red {
          background: red;
      }

        @media (min-width: 700px) {
          .\\[\\@media_\\(min-width\\:_700px\\)\\]\\:background_blue {
            background: blue;
      }
      }
      }"
    `)
  })

  test('should support native nesting', () => {
    expect(css`
      color: red;
      p {
        color: blue;
      }
      h1,
      h2,
      h3,
      h4 {
        color: pink;
        font-weight: bold;
        margin-bottom: 1rem;
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_red {
          color: red;
      }

        .\\[\\&_p\\]\\:color_blue p {
          color: blue;
      }

        .\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:color_pink h1,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:color_pink h2,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:color_pink h3,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:color_pink h4 {
          color: pink;
      }

        .\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:font-weight_bold h1,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:font-weight_bold h2,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:font-weight_bold h3,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:font-weight_bold h4 {
          font-weight: bold;
      }

        .\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:margin-bottom_1rem h1,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:margin-bottom_1rem h2,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:margin-bottom_1rem h3,.\\[\\&_h1\\,_h2\\,_h3\\,_h4\\]\\:margin-bottom_1rem h4 {
          margin-bottom: 1rem;
      }
      }"
    `)

    expect(css`
      justify-content: center;
      --test: 4px;
      :is(.content, footer) {
        padding: 16px;
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .justify-content_center {
          justify-content: center;
      }

        .\\--test_4px {
          --test: 4px;
      }

        .\\[\\&_\\:is\\(\\.content\\,_footer\\)\\]\\:padding_16px :is(.content, footer) {
          padding: 16px;
      }
      }"
    `)
  })

  test('nesting combinators', () => {
    expect(css`
      p + p {
        color: red;
      }
    `).toMatchInlineSnapshot(`
        "@layer utilities {
          .\\[\\&_p_\\+_p\\]\\:color_red p + p {
            color: red;
        }
        }"
      `)

    expect(css`
      p ~ p {
        color: red;
      }
    `).toMatchInlineSnapshot(`
        "@layer utilities {
          .\\[\\&_p_\\~_p\\]\\:color_red p ~ p {
            color: red;
        }
        }"
      `)

    expect(css`
      .box & {
        background-color: red;
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .box .\\[\\.box_\\&\\]\\:background-color_red {
          background-color: red;
      }
      }"
    `)
  })

  test('deep native nested', () => {
    expect(css`
      .box {
        p {
          background-color: red;
          @media (min-width: 700px) {
            background-color: blue;
          }
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.box\\]\\:\\[\\&_p\\]\\:background-color_red .box p {
          background-color: red;
      }

        @media (min-width: 700px) {
          .\\[\\&_\\.box\\]\\:\\[\\&_p\\]\\:\\[\\@media_\\(min-width\\:_700px\\)\\]\\:background-color_blue .box p {
            background-color: blue;
      }
      }
      }"
    `)

    expect(css`
      color: hotpink;

      > .is {
        color: rebeccapurple;

        > .awesome {
          color: deeppink;
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .color_hotpink {
          color: hotpink;
      }

        .\\[\\&_\\>_\\.is\\]\\:color_rebeccapurple > .is {
          color: rebeccapurple;
      }

        .\\[\\&_\\>_\\.is\\]\\:\\[\\&_\\>_\\.awesome\\]\\:color_deeppink > .is > .awesome {
          color: deeppink;
      }
      }"
    `)

    expect(css`
      .demo {
        .triangle,
        .square {
          opacity: 0.25;
          filter: blur(25px);
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.demo\\]\\:\\[\\&_\\.triangle\\,_\\.square\\]\\:opacity_0\\.25 .demo .triangle,.\\[\\&_\\.demo\\]\\:\\[\\&_\\.triangle\\,_\\.square\\]\\:opacity_0\\.25 .demo .square {
          opacity: 0.25;
      }

        .\\[\\&_\\.demo\\]\\:\\[\\&_\\.triangle\\,_\\.square\\]\\:filter_blur\\(25px\\) .demo .triangle,.\\[\\&_\\.demo\\]\\:\\[\\&_\\.triangle\\,_\\.square\\]\\:filter_blur\\(25px\\) .demo .square {
          filter: blur(25px);
      }
      }"
    `)

    expect(css`
      :not(.pink) {
        opacity: 0.25;
        filter: blur(25px);
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\:not\\(\\.pink\\)\\]\\:opacity_0\\.25 :not(.pink) {
          opacity: 0.25;
      }

        .\\[\\&_\\:not\\(\\.pink\\)\\]\\:filter_blur\\(25px\\) :not(.pink) {
          filter: blur(25px);
      }
      }"
    `)

    expect(css`
      .one,
      #two {
        .three {
          color: red;
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.one\\,_\\#two\\]\\:\\[\\&_\\.three\\]\\:color_red .one .three,.\\[\\&_\\.one\\,_\\#two\\]\\:\\[\\&_\\.three\\]\\:color_red #two .three {
          color: red;
      }
      }"
    `)

    expect(css`
      .foo {
        color: blue;
        & {
          padding: 2ch;
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.foo\\]\\:color_blue .foo {
          color: blue;
      }

        .\\[\\&_\\.foo\\]\\:\\[\\&\\]\\:padding_2ch .foo {
          padding: 2ch;
      }
      }"
    `)

    expect(css`
      .foo {
        color: blue;
        && {
          padding: 2ch;
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.foo\\]\\:color_blue .foo {
          color: blue;
      }

        :is(.\\[\\&_\\.foo\\]\\:\\[\\&\\&\\]\\:padding_2ch .foo):is(.\\[\\&_\\.foo\\]\\:\\[\\&\\&\\]\\:padding_2ch .foo) {
          padding: 2ch;
      }
      }"
    `)

    expect(css`
      .foo {
        & :is(.bar, &.baz) {
          color: red;
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.foo\\]\\:\\[\\&_\\:is\\(\\.bar\\,_\\&\\.baz\\)\\]\\:color_red .foo :is(.bar, .\\[\\&_\\.foo\\]\\:\\[\\&_\\:is\\(\\.bar\\,_\\&\\.baz\\)\\]\\:color_red .foo.baz) {
          color: red;
      }
      }"
    `)

    expect(css`
      figure {
        margin: 0;

        > figcaption {
          background: hsl(0 0% 0% / 50%);

          > p {
            font-size: 0.9rem;
          }
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_figure\\]\\:margin_0 figure {
          margin: 0;
      }

        .\\[\\&_figure\\]\\:\\[\\&_\\>_figcaption\\]\\:background_hsl\\(0_0\\%_0\\%_\\/_50\\%\\) figure > figcaption {
          background: hsl(0 0% 0% / 50%);
      }

        .\\[\\&_figure\\]\\:\\[\\&_\\>_figcaption\\]\\:\\[\\&_\\>_p\\]\\:font-size_0\\.9rem figure > figcaption > p {
          font-size: 0.9rem;
      }
      }"
    `)

    expect(css`
      .card {
        inline-size: 40ch;
        aspect-ratio: 3/4;

        @layer support {
          & body {
            min-block-size: 100%;
          }
        }
      }
    `).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\.card\\]\\:inline-size_40ch .card {
          inline-size: 40ch;
      }

        .\\[\\&_\\.card\\]\\:aspect-ratio_3\\/4 .card {
          aspect-ratio: 3/4;
      }

        @layer support {
          .\\[\\&_\\.card\\]\\:\\[\\@layer_support\\]\\:\\[\\&_body\\]\\:min-block-size_100\\% .card body {
            min-block-size: 100%;
      }
      }
      }"
    `)
  })
})
