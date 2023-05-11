import { describe, expect, test } from 'vitest'
import { AtomicRule, type ProcessOptions } from '../src/atomic-rule'
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

    expect(css({ styles: { width: { base: '50px', md: '60px' }, w: '70px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_70px {
              width: 70px
          }
      }"
    `)
  })

  test('should resolve responsive array', () => {
    expect(css({ styles: { width: ['50px', '60px'] } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_50px {
              width: 50px
          }
          .sm\\\\:w_60px {
              @media screen and (min-width: 640px) {
                  width: 60px
              }
          }
      }"
    `)
  })

  test('should resolve responsive array with gaps', () => {
    expect(css({ styles: { width: ['50px', null, '60px'] } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_50px {
              width: 50px
          }
          .md\\\\:w_60px {
              @media screen and (min-width: 768px) {
                  width: 60px
              }
          }
      }"
    `)
  })

  test('should work with inner responsive', () => {
    expect(
      css({
        styles: {
          ml: { _ltr: { sm: '4' }, _rtl: '-4' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .ltr\\\\:sm\\\\:ml_4 {
              [dir=ltr] & {
                  @media screen and (min-width: 640px) {
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
        styles: {
          color: { _light: 'red', _dark: 'green' },
          opacity: { _dark: 'slate400' },
        },
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
        styles: {
          top: { sm: { _rtl: '20px', _hover: '50px' }, lg: '120px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .sm\\\\:rtl\\\\:t_20px {
              [dir=rtl] & {
                  @media screen and (min-width: 640px) {
                      top: 20px
                  }
              }
          }
          .sm\\\\:hover\\\\:t_50px {
              &:where(:hover, [data-hover]) {
                  @media screen and (min-width: 640px) {
                      top: 50px
                  }
              }
          }
          .lg\\\\:t_120px {
              @media screen and (min-width: 1024px) {
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
          left: { base: '20px', md: '40px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .l_20px {
              left: 20px
          }
          .md\\\\:l_40px {
              @media screen and (min-width: 768px) {
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
        styles: {
          '& > p': {
            left: { base: '20px', md: '40px' },
            bg: { _light: 'red400', _dark: 'green500' },
            font: { _rtl: 'sans', _ltr: { _dark: { sm: { _hover: 'serif' } } } },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:l_20px {
              & > p {
                  left: 20px
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:l_40px {
              & > p {
                  @media screen and (min-width: 768px) {
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
                  &:where(:hover, [data-hover]) {
                      [dir=ltr] & {
                           &.dark, .dark & {
                              @media screen and (min-width: 640px) {
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
        styles: {
          'input:hover &': {
            bg: 'red400',
            fontSize: { sm: '14px', lg: '18px' },
          },
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
                  @media screen and (min-width: 640px) {
                      font-size: 14px
                  }
              }
          }
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
              input:hover & {
                  @media screen and (min-width: 1024px) {
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
        styles: {
          '&::placeholder': {
            left: '40px',
            bg: 'red400',
            textAlign: { sm: 'left' },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:l_40px {
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
                  @media screen and (min-width: 640px) {
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
        styles: {
          '@media base': {
            left: '40px',
            textAlign: { sm: 'left' },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\@media_base\\\\]\\\\:l_40px {
              @media base {
                  left: 40px
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:text_left {
              @media base {
                  @media screen and (min-width: 640px) {
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
          _hover: { bg: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:bg_pink\\\\.400 {
              &:where(:hover, [data-hover]) {
                  background: var(--colors-pink-400)
              }
          }
      }"
    `)
  })

  test('nested > property', () => {
    expect(
      css({
        styles: {
          _hover: { bg: { sm: { _dark: 'red.300' } }, color: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:sm\\\\:dark\\\\:bg_red\\\\.300 {
              &:where(:hover, [data-hover]) {
                   &.dark, .dark & {
                      @media screen and (min-width: 640px) {
                          background: var(--colors-red-300)
                      }
                  }
              }
          }
          .hover\\\\:text_pink\\\\.400 {
              &:where(:hover, [data-hover]) {
                  color: var(--colors-pink-400)
              }
          }
      }"
    `)
  })

  test('nested > nested > property', () => {
    expect(
      css({
        styles: {
          _hover: { _disabled: { bg: { sm: 'red.300' } } },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:disabled\\\\:sm\\\\:bg_red\\\\.300 {
              &:where(:hover, [data-hover]) {
                  &:where(:disabled, [disabled], [data-disabled]) {
                      @media screen and (min-width: 640px) {
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
        styles: {
          '@media base': {
            '&:hover': {
              left: '40px',
              textAlign: { sm: 'left' },
            },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:l_40px {
              &:hover {
                  @media base {
                      left: 40px
                  }
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:sm\\\\:text_left {
              &:hover {
                  @media base {
                      @media screen and (min-width: 640px) {
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
        styles: {
          '@media (min-width: 768px)': {
            backgroundColor: 'green',
          },
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
        styles: {
          '& kbd': {
            color: 'red',
          },
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
