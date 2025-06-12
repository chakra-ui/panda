import { describe, expect, test } from 'vitest'
import { createRuleProcessor } from './fixture'
import type { Config, SystemStyleObject } from '@pandacss/types'

const css = (styles: SystemStyleObject, config?: Config) => {
  return createRuleProcessor(config).css(styles).toCss()
}

describe('atomic / with basic style object', () => {
  test('respect important syntax', () => {
    expect(
      css({
        color: 'red !important',
        fontSize: '30px!',
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .c_red\\! {
          color: red !important;
      }

        .fs_30px\\! {
          font-size: 30px !important;
      }
      }"
    `)
  })

  test('should work with basic', () => {
    expect(css({ bg: 'red.300' })).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_red\\.300 {
          background: var(--colors-red-300);
      }
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ width: '50px', w: '20px' })).toMatchInlineSnapshot(`
      "@layer utilities {
        .w_20px {
          width: 20px;
      }
      }"
    `)

    expect(css({ width: { base: '50px', md: '60px' }, w: '70px' })).toMatchInlineSnapshot(`
      "@layer utilities {
        .w_70px {
          width: 70px;
      }
      }"
    `)
  })

  test('should work with negative tokens', () => {
    expect(css({ mx: -2 })).toMatchInlineSnapshot(`
      "@layer utilities {
        .mx_-2 {
          margin-inline: calc(var(--spacing-2) * -1);
      }
      }"
    `)
  })

  test('should resolve responsive array', () => {
    expect(css({ width: ['50px', '60px'] })).toMatchInlineSnapshot(`
      "@layer utilities {
        .w_50px {
          width: 50px;
      }

        @media screen and (min-width: 40rem) {
          .sm\\:w_60px {
            width: 60px;
      }
      }
      }"
    `)
  })

  test('should resolve responsive array with gaps', () => {
    expect(css({ width: ['50px', null, '60px'] })).toMatchInlineSnapshot(`
      "@layer utilities {
        .w_50px {
          width: 50px;
      }

        @media screen and (min-width: 48rem) {
          .md\\:w_60px {
            width: 60px;
      }
      }
      }"
    `)
  })

  test('should work with inner responsive', () => {
    expect(
      css({
        ml: { _ltr: { sm: '4' }, _rtl: '-4' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        [dir=rtl] .rtl\\:ml_-4 {
          margin-left: calc(var(--spacing-4) * -1);
      }

        @media screen and (min-width: 40rem) {
          [dir=ltr] .ltr\\:sm\\:ml_4 {
            margin-left: var(--spacing-4);
      }
      }
      }"
    `)
  })

  test('respect color mode', () => {
    expect(
      css({
        color: { _light: 'red', _dark: 'green' },
        opacity: { _dark: 'slate400' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        [data-theme=light] .light\\:c_red,.light .light\\:c_red,.light\\:c_red.light,.light\\:c_red[data-theme=light] {
          color: red;
      }

        [data-theme=dark] .dark\\:c_green,.dark .dark\\:c_green,.dark\\:c_green.dark,.dark\\:c_green[data-theme=dark] {
          color: green;
      }

        [data-theme=dark] .dark\\:op_slate400,.dark .dark\\:op_slate400,.dark\\:op_slate400.dark,.dark\\:op_slate400[data-theme=dark] {
          opacity: slate400;
      }
      }"
    `)
  })

  test('should work with outer responsive', () => {
    expect(
      css({
        top: { sm: { _rtl: '20px', _hover: '50px' }, lg: '120px' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          [dir=rtl] .sm\\:rtl\\:top_20px {
            top: 20px;
      }
      }

        @media screen and (min-width: 40rem) {
          .sm\\:hover\\:top_50px:is(:hover, [data-hover]) {
            top: 50px;
      }
      }

        @media screen and (min-width: 64rem) {
          .lg\\:top_120px {
            top: 120px;
      }
      }
      }"
    `)
  })

  test('should skip `_` notation', () => {
    expect(
      css({
        left: { base: '20px', md: '40px' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .left_20px {
          left: 20px;
      }

        @media screen and (min-width: 48rem) {
          .md\\:left_40px {
            left: 40px;
      }
      }
      }"
    `)
  })
})

describe('atomic / with nesting scope', () => {
  test('[pseudo] should work with nested selector', () => {
    expect(
      css({
        '& > p': {
          left: { base: '20px', md: '40px' },
          bg: { _light: 'red400', _dark: 'green500' },
          font: { _rtl: 'sans', _ltr: { _dark: { sm: { _hover: 'serif' } } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_\\>_p\\]\\:left_20px > p {
          left: 20px;
      }

        [data-theme=light] .\\[\\&_\\>_p\\]\\:light\\:bg_red400 > p,.light .\\[\\&_\\>_p\\]\\:light\\:bg_red400 > p,.\\[\\&_\\>_p\\]\\:light\\:bg_red400 > p.light,.\\[\\&_\\>_p\\]\\:light\\:bg_red400 > p[data-theme=light] {
          background: red400;
      }

        [data-theme=dark] .\\[\\&_\\>_p\\]\\:dark\\:bg_green500 > p,.dark .\\[\\&_\\>_p\\]\\:dark\\:bg_green500 > p,.\\[\\&_\\>_p\\]\\:dark\\:bg_green500 > p.dark,.\\[\\&_\\>_p\\]\\:dark\\:bg_green500 > p[data-theme=dark] {
          background: green500;
      }

        [dir=rtl] .\\[\\&_\\>_p\\]\\:rtl\\:font_sans > p {
          font: sans;
      }

        @media screen and (min-width: 40rem) {
          [dir=ltr] [data-theme=dark] .\\[\\&_\\>_p\\]\\:ltr\\:dark\\:sm\\:hover\\:font_serif > p:is(:hover, [data-hover]),[dir=ltr] .dark .\\[\\&_\\>_p\\]\\:ltr\\:dark\\:sm\\:hover\\:font_serif > p:is(:hover, [data-hover]),[dir=ltr] .\\[\\&_\\>_p\\]\\:ltr\\:dark\\:sm\\:hover\\:font_serif > p:is(:hover, [data-hover]).dark,[dir=ltr] .\\[\\&_\\>_p\\]\\:ltr\\:dark\\:sm\\:hover\\:font_serif > p:is(:hover, [data-hover])[data-theme=dark] {
            font: serif;
      }
      }

        @media screen and (min-width: 48rem) {
          .\\[\\&_\\>_p\\]\\:md\\:left_40px > p {
            left: 40px;
      }
      }
      }"
    `)
  })

  test('[parent selector] should work with nested selector', () => {
    expect(
      css({
        'input:hover &': {
          bg: 'red400',
          fontSize: { sm: '14px', lg: '18px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        input:hover .\\[input\\:hover_\\&\\]\\:bg_red400 {
          background: red400;
      }

        @media screen and (min-width: 40rem) {
          input:hover .\\[input\\:hover_\\&\\]\\:sm\\:fs_14px {
            font-size: 14px;
      }
      }

        @media screen and (min-width: 64rem) {
          input:hover .\\[input\\:hover_\\&\\]\\:lg\\:fs_18px {
            font-size: 18px;
      }
      }
      }"
    `)
  })

  test('[selector] should work with nested selector', () => {
    expect(
      css({
        '&::placeholder': {
          left: '40px',
          bg: 'red400',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&\\:\\:placeholder\\]\\:bg_red400::placeholder {
          background: red400;
      }

        .\\[\\&\\:\\:placeholder\\]\\:left_40px::placeholder {
          left: 40px;
      }

        @media screen and (min-width: 40rem) {
          .\\[\\&\\:\\:placeholder\\]\\:sm\\:ta_left::placeholder {
            text-align: left;
      }
      }
      }"
    `)
  })

  test('[@media] should work with nested selector', () => {
    expect(
      css({
        '@media base': {
          left: '40px',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media base {
          .\\[\\@media_base\\]\\:left_40px {
            left: 40px;
      }
      }

        @media base {
          @media screen and (min-width: 40rem) {
            .\\[\\@media_base\\]\\:sm\\:ta_left {
              text-align: left;
      }
      }
      }
      }"
    `)
  })
})

describe('atomic / with grouped conditions styles', () => {
  test('simple', () => {
    expect(
      css({
        _hover: { bg: 'pink.400' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .hover\\:bg_pink\\.400:is(:hover, [data-hover]) {
          background: var(--colors-pink-400);
      }
      }"
    `)
  })

  test('nested > property', () => {
    expect(
      css({
        _hover: { bg: { sm: { _dark: 'red.300' } }, color: 'pink.400' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .hover\\:c_pink\\.400:is(:hover, [data-hover]) {
          color: var(--colors-pink-400);
      }

        @media screen and (min-width: 40rem) {
          [data-theme=dark] .hover\\:sm\\:dark\\:bg_red\\.300:is(:hover, [data-hover]),.dark .hover\\:sm\\:dark\\:bg_red\\.300:is(:hover, [data-hover]),.hover\\:sm\\:dark\\:bg_red\\.300:is(:hover, [data-hover]).dark,.hover\\:sm\\:dark\\:bg_red\\.300:is(:hover, [data-hover])[data-theme=dark] {
            background: var(--colors-red-300);
      }
      }
      }"
    `)
  })

  test('nested > nested > property', () => {
    expect(
      css({
        _hover: { _disabled: { bg: { sm: 'red.300' } } },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          .hover\\:disabled\\:sm\\:bg_red\\.300:is(:hover, [data-hover]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) {
            background: var(--colors-red-300);
      }
      }
      }"
    `)
  })

  test('multiple scopes', () => {
    expect(
      css({
        '@media base': {
          '&:hover': {
            left: '40px',
            textAlign: { sm: 'left' },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media base {
          .\\[\\@media_base\\]\\:\\[\\&\\:hover\\]\\:left_40px:hover {
            left: 40px;
      }
      }

        @media base {
          @media screen and (min-width: 40rem) {
            .\\[\\@media_base\\]\\:\\[\\&\\:hover\\]\\:sm\\:ta_left:hover {
              text-align: left;
      }
      }
      }
      }"
    `)
  })
})

describe('atomic / with direct nesting', () => {
  test('should work for inline media', () => {
    expect(
      css({
        '@media (min-width: 768px)': {
          backgroundColor: 'green',
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media (min-width: 768px) {
          .\\[\\@media_\\(min-width\\:_768px\\)\\]\\:bg-c_green {
            background-color: green;
      }
      }
      }"
    `)
  })

  test('outlier: should work with basic', () => {
    expect(
      css({
        all: 'unset',
        backgroundColor: 'red',
        border: 'none',
        padding: '$3 $3',
        borderRadius: '$button',
        fontSize: '$xsmall',
        cursor: 'pointer',
        '& + span': {
          marginLeft: '$2',
        },
        '&:focus, &:hover': {
          boxShadow: 'none',
        },
        '.test &': {
          backgroundColor: 'blue',
        },
        '& .my-class': {
          color: 'red',
        },
        ':focus > &': {
          color: 'white',
        },
        '@media (min-width: 768px)': {
          backgroundColor: 'green',
          fontSize: '$small',
          '&:hover': {
            backgroundColor: 'yellow',
          },
        },
        '& span': {
          color: 'red',
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .all_unset {
          all: unset;
      }

        .bd_none {
          border: var(--borders-none);
      }

        .p_\\$3_\\$3 {
          padding: $3 $3;
      }

        .bdr_\\$button {
          border-radius: $button;
      }

        .bg-c_red {
          background-color: red;
      }

        .fs_\\$xsmall {
          font-size: $xsmall;
      }

        .cursor_pointer {
          cursor: pointer;
      }

        .test .\\[\\.test_\\&\\]\\:bg-c_blue {
          background-color: blue;
      }

        .\\[\\&_\\.my-class\\]\\:c_red .my-class,.\\[\\&_span\\]\\:c_red span {
          color: red;
      }

        .\\[\\&_\\+_span\\]\\:ml_\\$2 + span {
          margin-left: $2;
      }

        .\\[\\&\\:focus\\,_\\&\\:hover\\]\\:bx-sh_none:focus,.\\[\\&\\:focus\\,_\\&\\:hover\\]\\:bx-sh_none:hover {
          box-shadow: none;
      }

        :focus > .\\[\\:focus_\\>_\\&\\]\\:c_white {
          color: var(--colors-white);
      }

        @media (min-width: 768px) {
          .\\[\\@media_\\(min-width\\:_768px\\)\\]\\:bg-c_green {
            background-color: green;
      }
          .\\[\\@media_\\(min-width\\:_768px\\)\\]\\:fs_\\$small {
            font-size: $small;
      }
          .\\[\\@media_\\(min-width\\:_768px\\)\\]\\:\\[\\&\\:hover\\]\\:bg-c_yellow:hover {
            background-color: yellow;
      }
      }
      }"
    `)
  })

  test('simple nesting', () => {
    expect(
      css({
        '& kbd': {
          color: 'red',
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .\\[\\&_kbd\\]\\:c_red kbd {
          color: red;
      }
      }"
    `)
  })

  test('should sort mobile first', () => {
    expect(
      css({
        '@media screen and (max-width: 640px)': {
          margin: '8',
        },
        '@media screen and (min-width: 980px)': {
          margin: '3',
        },
        '@media screen and (max-width: 980px)': {
          margin: '6',
        },
        '@supports (display: grid)': {
          backgroundColor: 'red',
        },
        '@media screen and (max-width: 768px)': {
          margin: '7',
        },
        '@media screen and (min-width: 640px)': {
          margin: '1',
        },
        '@supports not (display: grid)': {
          backgroundColor: 'green',
        },
        '@media screen and (min-width: 1280px)': {
          margin: '4',
        },
        '@supports (display: flex)': {
          backgroundColor: 'blue',
        },
        '@media screen and (min-width: 768px)': {
          margin: '2',
        },
        '@media screen and (max-width: 1280px)': {
          margin: '5',
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @supports (display: flex) {
          .\\[\\@supports_\\(display\\:_flex\\)\\]\\:bg-c_blue {
            background-color: blue;
      }
      }

        @supports (display: grid) {
          .\\[\\@supports_\\(display\\:_grid\\)\\]\\:bg-c_red {
            background-color: red;
      }
      }

        @supports not (display: grid) {
          .\\[\\@supports_not_\\(display\\:_grid\\)\\]\\:bg-c_green {
            background-color: green;
      }
      }

        @media screen and (min-width: 640px) {
          .\\[\\@media_screen_and_\\(min-width\\:_640px\\)\\]\\:m_1 {
            margin: var(--spacing-1);
      }
      }

        @media screen and (min-width: 768px) {
          .\\[\\@media_screen_and_\\(min-width\\:_768px\\)\\]\\:m_2 {
            margin: var(--spacing-2);
      }
      }

        @media screen and (min-width: 980px) {
          .\\[\\@media_screen_and_\\(min-width\\:_980px\\)\\]\\:m_3 {
            margin: var(--spacing-3);
      }
      }

        @media screen and (min-width: 1280px) {
          .\\[\\@media_screen_and_\\(min-width\\:_1280px\\)\\]\\:m_4 {
            margin: var(--spacing-4);
      }
      }

        @media screen and (max-width: 1280px) {
          .\\[\\@media_screen_and_\\(max-width\\:_1280px\\)\\]\\:m_5 {
            margin: var(--spacing-5);
      }
      }

        @media screen and (max-width: 980px) {
          .\\[\\@media_screen_and_\\(max-width\\:_980px\\)\\]\\:m_6 {
            margin: var(--spacing-6);
      }
      }

        @media screen and (max-width: 768px) {
          .\\[\\@media_screen_and_\\(max-width\\:_768px\\)\\]\\:m_7 {
            margin: var(--spacing-7);
      }
      }

        @media screen and (max-width: 640px) {
          .\\[\\@media_screen_and_\\(max-width\\:_640px\\)\\]\\:m_8 {
            margin: var(--spacing-8);
      }
      }
      }"
    `)
  })

  test('with custom formatTokenName and formatCssVar', () => {
    expect(
      css(
        { bg: '$blue-400' },
        {
          hooks: {
            'tokens:created': ({ configure }) => {
              configure({
                formatTokenName: (path) => '$' + path.join('-'),
                formatCssVar: (path) => {
                  const variable = path.join('---')
                  return {
                    var: variable as any,
                    ref: `var(--${variable})`,
                  }
                },
              })
            },
          },
        },
      ),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        .bg_\\$blue-400 {
          background: var(--colors---blue---400);
      }
      }"
    `)
  })

  test('responsive helpers', () => {
    expect(
      css({
        hideFrom: 'sm',
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (min-width: 40rem) {
          .hide_sm {
            display: none;
      }
      }
      }"
    `)

    expect(css({ hideBelow: 'lg' })).toMatchInlineSnapshot(`
      "@layer utilities {
        @media screen and (max-width: 63.9975rem) {
          .show_lg {
            display: none;
      }
      }
      }"
    `)
  })
})
