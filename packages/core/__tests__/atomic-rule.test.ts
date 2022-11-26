import { describe, expect, test } from 'vitest'
import { AtomicRule, ProcessOptions } from '../src/atomic-rule'
import { createContext } from './fixture'

function css(obj: ProcessOptions) {
  const ruleset = new AtomicRule(createContext())
  ruleset.process(obj)
  return ruleset.toCss()
}

describe('atomic / with basic style object', () => {
  test('respect important syntax', () => {
    expect(
      css({
        styles: {
          color: 'red !important',
          fontSize: '30px!',
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .text_red\\\\! {
              color: red !important
          }
          .fs_30px\\\\! {
              font-size: 30px !important
          }
      }"
    `)
  })

  test('should work with basic', () => {
    expect(css({ styles: { bg: 'red.300' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .bg_red\\\\.300 {
              background: var(--colors-red-300)
          }
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ styles: { width: '50px', w: '20px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_20px {
              width: 20px
          }
      }"
    `)

    expect(css({ styles: { width: { _: '50px', md: '60px' }, w: '70px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_70px {
              width: 70px
          }
      }"
    `)
  })

  test('should work with inner responsive', () => {
    expect(
      css({
        styles: {
          ml: { ltr: { sm: '4' }, rtl: '-4' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @screen sm {
              [dir=ltr] .ltr\\\\:sm\\\\:ml_4 {
                  margin-left: var(--spacing-4)
              }
          }
          [dir=rtl] .rtl\\\\:ml_-4 {
              margin-left: calc(var(--spacing-4) * -1)
          }
      }"
    `)
  })

  test('respect color mode', () => {
    expect(
      css({
        styles: {
          color: { light: 'red', dark: 'green' },
          opacity: { dark: 'slate400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          [data-theme=light] .light\\\\:text_red {
              color: red
          }
          [data-theme=dark] .dark\\\\:text_green {
              color: green
          }
          [data-theme=dark] .dark\\\\:opacity_slate400 {
              opacity: slate400
          }
      }"
    `)
  })

  test('should work with outer responsive', () => {
    expect(
      css({
        styles: {
          top: { sm: { rtl: '20px', hover: '50px' }, lg: '120px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @screen sm {
              [dir=rtl] .sm\\\\:rtl\\\\:t_20px {
                  top: 20px
              }
          }
          @screen sm {
              .sm\\\\:hover\\\\:t_50px:hover {
                  top: 50px
              }
          }
          @screen lg {
              .lg\\\\:t_120px {
                  top: 120px
              }
          }
      }"
    `)
  })

  test('should skip `_` notation', () => {
    expect(
      css({
        styles: {
          left: { _: '20px', md: '40px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .l_20px {
              left: 20px
          }
          @screen md {
              .md\\\\:l_40px {
                  left: 40px
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
        scope: ['& > p'],
        styles: {
          left: { _: '20px', md: '40px' },
          bg: { light: 'red400', dark: 'green500' },
          font: { rtl: 'sans', ltr: { dark: { sm: { hover: 'serif' } } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:l_20px > p {
              left: 20px
          }
          @screen md {
              .\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:l_40px > p {
                  left: 40px
              }
          }
          [data-theme=light] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400 > p {
              background: red400
          }
          [data-theme=dark] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500 > p {
              background: green500
          }
          [dir=rtl] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans > p {
              font: sans
          }
          @screen sm {
              [data-theme=dark] [dir=ltr] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif:hover > p {
                  font: serif
              }
          }
      }"
    `)
  })

  test('[parent selector] should work with nested selector', () => {
    expect(
      css({
        scope: ['input:hover &'],
        styles: {
          bg: 'red400',
          fontSize: { sm: '14px', lg: '18px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:bg_red400 {
              background: red400
          }
          @screen sm {
              input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fs_14px {
                  font-size: 14px
              }
          }
          @screen lg {
              input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
                  font-size: 18px
              }
          }
      }"
    `)
  })

  test('[selector] should work with nested selector', () => {
    expect(
      css({
        scope: ['&::placeholder'],
        styles: {
          left: '40px',
          bg: 'red400',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:l_40px::placeholder {
              left: 40px
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:bg_red400::placeholder {
              background: red400
          }
          @screen sm {
              .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:text_left::placeholder {
                  text-align: left
              }
          }
      }"
    `)
  })

  test('[@media] should work with nested selector', () => {
    expect(
      css({
        scope: ['@media base'],
        styles: {
          left: '40px',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @media base {
              .\\\\[\\\\@media_base\\\\]\\\\:l_40px {
                  left: 40px
              }
          }
          @media base {
              @screen sm {
                  .\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:text_left {
                      text-align: left
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
        styles: {
          hover: { bg: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:bg_pink\\\\.400:hover {
              background: pink.400
          }
      }"
    `)
  })

  test('nested > property', () => {
    expect(
      css({
        styles: {
          hover: { bg: { sm: { dark: 'red.300' } }, color: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @screen sm {
              [data-theme=dark] .hover\\\\:sm\\\\:dark\\\\:bg_red\\\\.300:hover {
                  background: var(--colors-red-300)
              }
          }
          .hover\\\\:text_pink\\\\.400:hover {
              color: pink.400
          }
      }"
    `)
  })

  test('nested > nested > property', () => {
    expect(
      css({
        styles: {
          hover: { disabled: { bg: { sm: 'red.300' } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @screen sm {
              .hover\\\\:disabled\\\\:sm\\\\:bg_red\\\\.300:hover:disabled {
                  background: var(--colors-red-300)
              }
          }
      }"
    `)
  })

  test('multiple scopes', () => {
    expect(
      css({
        scope: ['@media base', '&:hover'],
        styles: {
          left: '40px',
          textAlign: { sm: 'left' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          @media base {
              .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:l_40px:hover {
                  left: 40px
              }
          }
          @media base {
              @screen sm {
                  .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:sm\\\\:text_left:hover {
                      text-align: left
                  }
              }
          }
      }"
    `)
  })
})

describe('atomic / with direct nesting', () => {
  test('outlier: should work with basic', () => {
    expect(
      css({
        styles: {
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
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .all_unset {
              all: unset
          }
          .bg_red {
              background-color: red
          }
          .border_none {
              border: none
          }
          .p_\\\\$3_\\\\$3 {
              padding: $3 $3
          }
          .rounded_\\\\$button {
              border-radius: $button
          }
          .fs_\\\\$xsmall {
              font-size: $xsmall
          }
          .cursor_pointer {
              cursor: pointer
          }
          .\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2 + span {
              margin-left: $2
          }
          .\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none:focus, .\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none:hover {
              box-shadow: none
          }
          .test .\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue {
              background-color: blue
          }
          .\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red .my-class {
              color: red
          }
          :focus > .\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white {
              color: white
          }
          @media (min-width: 768px) {
              .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green {
                  background-color: green
              }
          }
          @media (min-width: 768px) {
              .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small {
                  font-size: $small
              }
          }
          @media (min-width: 768px) {
              .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow:hover {
                  background-color: yellow
              }
          }
          .\\\\[\\\\&_span\\\\]\\\\:text_red span {
              color: red
          }
      }"
    `)
  })

  test('simple nesting', () => {
    expect(
      css({
        styles: {
          '& kbd': {
            color: 'red',
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&_kbd\\\\]\\\\:text_red kbd {
              color: red
          }
      }"
    `)
  })
})
