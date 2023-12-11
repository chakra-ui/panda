import { describe, expect, test } from 'vitest'
import { createCssFn } from './fixture'

const css = createCssFn()

describe('atomic / with basic style object', () => {
  test('respect important syntax', () => {
    expect(
      css({
        color: 'red !important',
        fontSize: '30px!',
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
    expect(css({ bg: 'red.300' })).toMatchInlineSnapshot(`
      "@layer utilities {
          .bg_red\\\\.300 {
              background: var(--colors-red-300)
          }
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ width: '50px', w: '20px' })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_20px {
              width: 20px
          }
      }"
    `)

    expect(css({ width: { base: '50px', md: '60px' }, w: '70px' })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_70px {
              width: 70px
          }
      }"
    `)
  })

  test('should resolve responsive array', () => {
    expect(css({ width: ['50px', '60px'] })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_50px {
              width: 50px
          }
          .sm\\\\:w_60px {
              @media screen and (min-width: 40em) {
                  width: 60px
              }
          }
      }"
    `)
  })

  test('should resolve responsive array with gaps', () => {
    expect(css({ width: ['50px', null, '60px'] })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_50px {
              width: 50px
          }
          .md\\\\:w_60px {
              @media screen and (min-width: 48em) {
                  width: 60px
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
          .ltr\\\\:sm\\\\:ml_4 {
              [dir=ltr] & {
                  @media screen and (min-width: 40em) {
                      margin-left: var(--spacing-4)
                  }
              }
          }
          .rtl\\\\:ml_-4 {
              [dir=rtl] & {
                  margin-left: calc(var(--spacing-4) * -1)
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
          .light\\\\:text_red {
               &.light, .light & {
                  color: red
              }
          }
          .dark\\\\:text_green {
               &.dark, .dark & {
                  color: green
              }
          }
          .dark\\\\:opacity_slate400 {
               &.dark, .dark & {
                  opacity: slate400
              }
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
          .sm\\\\:rtl\\\\:top_20px {
              [dir=rtl] & {
                  @media screen and (min-width: 40em) {
                      top: 20px
                  }
              }
          }
          .sm\\\\:hover\\\\:top_50px {
              &:is(:hover, [data-hover]) {
                  @media screen and (min-width: 40em) {
                      top: 50px
                  }
              }
          }
          .lg\\\\:top_120px {
              @media screen and (min-width: 64em) {
                  top: 120px
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
              left: 20px
          }
          .md\\\\:left_40px {
              @media screen and (min-width: 48em) {
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
        '& > p': {
          left: { base: '20px', md: '40px' },
          bg: { _light: 'red400', _dark: 'green500' },
          font: { _rtl: 'sans', _ltr: { _dark: { sm: { _hover: 'serif' } } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px {
              & > p {
                  left: 20px
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px {
              & > p {
                  @media screen and (min-width: 48em) {
                      left: 40px
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400 {
              & > p {
                   &.light, .light & {
                      background: red400
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500 {
              & > p {
                   &.dark, .dark & {
                      background: green500
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans {
              & > p {
                  [dir=rtl] & {
                      font: sans
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                  &:is(:hover, [data-hover]) {
                      [dir=ltr] & {
                           &.dark, .dark & {
                              @media screen and (min-width: 40em) {
                                  font: serif
                              }
                          }
                      }
                  }
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
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:bg_red400 {
              input:hover & {
                  background: red400
              }
          }
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fs_14px {
              input:hover & {
                  @media screen and (min-width: 40em) {
                      font-size: 14px
                  }
              }
          }
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
              input:hover & {
                  @media screen and (min-width: 64em) {
                      font-size: 18px
                  }
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
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left_40px {
              &::placeholder {
                  left: 40px
              }
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:bg_red400 {
              &::placeholder {
                  background: red400
              }
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:text_left {
              &::placeholder {
                  @media screen and (min-width: 40em) {
                      text-align: left
                  }
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
          .\\\\[\\\\@media_base\\\\]\\\\:left_40px {
              @media base {
                  left: 40px
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:text_left {
              @media base {
                  @media screen and (min-width: 40em) {
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
        _hover: { bg: 'pink.400' },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:bg_pink\\\\.400 {
              &:is(:hover, [data-hover]) {
                  background: var(--colors-pink-400)
              }
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
          .hover\\\\:sm\\\\:dark\\\\:bg_red\\\\.300 {
              &:is(:hover, [data-hover]) {
                   &.dark, .dark & {
                      @media screen and (min-width: 40em) {
                          background: var(--colors-red-300)
                      }
                  }
              }
          }
          .hover\\\\:text_pink\\\\.400 {
              &:is(:hover, [data-hover]) {
                  color: var(--colors-pink-400)
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
          .hover\\\\:disabled\\\\:sm\\\\:bg_red\\\\.300 {
              &:is(:hover, [data-hover]) {
                  &:is(:disabled, [disabled], [data-disabled]) {
                      @media screen and (min-width: 40em) {
                          background: var(--colors-red-300)
                      }
                  }
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
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:left_40px {
              &:hover {
                  @media base {
                      left: 40px
                  }
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:sm\\\\:text_left {
              &:hover {
                  @media base {
                      @media screen and (min-width: 40em) {
                          text-align: left
                      }
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
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green {
              @media (min-width: 768px) {
                  background-color: green
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
              all: unset
          }
          .bg_red {
              background-color: red
          }
          .border_none {
              border: var(--borders-none)
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
          .\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2 {
              & + span {
                  margin-left: $2
              }
          }
          .\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none {
              &:focus, &:hover {
                  box-shadow: none
              }
          }
          .\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue {
              .test & {
                  background-color: blue
              }
          }
          .\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red {
              & .my-class {
                  color: red
              }
          }
          .\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white {
              :focus > & {
                  color: var(--colors-white)
              }
          }
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green {
              @media (min-width: 768px) {
                  background-color: green
              }
          }
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small {
              @media (min-width: 768px) {
                  font-size: $small
              }
          }
          .\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow {
              &:hover {
                  @media (min-width: 768px) {
                      background-color: yellow
                  }
              }
          }
          .\\\\[\\\\&_span\\\\]\\\\:text_red {
              & span {
                  color: red
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
          .\\\\[\\\\&_kbd\\\\]\\\\:text_red {
              & kbd {
                  color: red
              }
          }
      }"
    `)
  })
})
