import { describe, expect, test } from 'vitest'
import { GroupedRule, type ProcessOptions } from '../src/grouped-rule'
import { createContext } from './fixture'

function css(obj: ProcessOptions) {
  const ruleset = new GroupedRule(createContext())
  ruleset.process(obj)
  return ruleset.toCss()
}

describe('grouped / with basic style object', () => {
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
          .text_red__fs_30px {
              color: red !important;
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
          .w_50px__sm\\\\:w_60px {
              @media screen and (min-width: 40em) {
                  width: 60px
              }
          }
          .w_50px__sm\\\\:w_60px {
              width: 50px
          }
      }"
    `)
  })

  test('should resolve responsive array with gaps', () => {
    expect(css({ styles: { width: ['50px', null, '60px'] } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w_50px__md\\\\:w_60px {
              @media screen and (min-width: 48em) {
                  width: 60px
              }
          }
          .w_50px__md\\\\:w_60px {
              width: 50px
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
          .ltr\\\\:sm\\\\:ml_4__rtl\\\\:ml_-4 {
              [dir=ltr] & {
                  @media screen and (min-width: 40em) {
                      margin-left: var(--spacing-4)
                  }
              }
          }
          .ltr\\\\:sm\\\\:ml_4__rtl\\\\:ml_-4 {
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
          .light\\\\:text_red__dark\\\\:text_green__dark\\\\:opacity_slate400 {
               &.light, .light & {
                  color: red
              }
          }
          .light\\\\:text_red__dark\\\\:text_green__dark\\\\:opacity_slate400 {
               &.dark, .dark & {
                  color: green
              }
          }
          .light\\\\:text_red__dark\\\\:text_green__dark\\\\:opacity_slate400 {
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
          .sm\\\\:rtl\\\\:top_20px__sm\\\\:hover\\\\:top_50px__lg\\\\:top_120px {
              [dir=rtl] & {
                  @media screen and (min-width: 40em) {
                      top: 20px
                  }
              }
          }
          .sm\\\\:rtl\\\\:top_20px__sm\\\\:hover\\\\:top_50px__lg\\\\:top_120px {
              &:is(:hover, [data-hover]) {
                  @media screen and (min-width: 40em) {
                      top: 50px
                  }
              }
          }
          .sm\\\\:rtl\\\\:top_20px__sm\\\\:hover\\\\:top_50px__lg\\\\:top_120px {
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
        styles: {
          left: { base: '20px', md: '40px' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .left_20px__md\\\\:left_40px {
              @media screen and (min-width: 48em) {
                  left: 40px
              }
          }
          .left_20px__md\\\\:left_40px {
              left: 20px
          }
      }"
    `)
  })

  test('should work with boolean transform', () => {
    expect(css({ styles: { debug: true } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .debug_true {
              outline: 1px solid blue !important;
              &>* {
                  outline: 1px solid red !important
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
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                  left: 20px
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                  @media screen and (min-width: 48em) {
                      left: 40px
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                   &.light, .light & {
                      background: red400
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                   &.dark, .dark & {
                      background: green500
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
              & > p {
                  [dir=rtl] & {
                      font: sans
                  }
              }
          }
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left_20px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left_40px__\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:bg_red400__\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:bg_green500__\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font_sans__\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font_serif {
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
        styles: {
          'input:hover &': {
            bg: 'red400',
            fontSize: { sm: '14px', lg: '18px' },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:bg_red400__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fs_14px__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
              input:hover & {
                  background: red400
              }
          }
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:bg_red400__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fs_14px__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
              input:hover & {
                  @media screen and (min-width: 40em) {
                      font-size: 14px
                  }
              }
          }
          .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:bg_red400__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fs_14px__\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fs_18px {
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
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left_40px__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:bg_red400__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:text_left {
              &::placeholder {
                  left: 40px
              }
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left_40px__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:bg_red400__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:text_left {
              &::placeholder {
                  background: red400
              }
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left_40px__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:bg_red400__\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:text_left {
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
        styles: {
          '@media base': {
            left: '40px',
            textAlign: { sm: 'left' },
          },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .\\\\[\\\\@media_base\\\\]\\\\:left_40px__\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:text_left {
              @media base {
                  left: 40px
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:left_40px__\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:text_left {
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
        styles: {
          _hover: { bg: 'pink.400' },
        },
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
        styles: {
          _hover: { bg: { sm: { _dark: 'red.300' } }, color: 'pink.400' },
        },
      }),
    ).toMatchInlineSnapshot(`
      "@layer utilities {
          .hover\\\\:sm\\\\:dark\\\\:bg_red\\\\.300__hover\\\\:text_pink\\\\.400 {
              &:is(:hover, [data-hover]) {
                   &.dark, .dark & {
                      @media screen and (min-width: 40em) {
                          background: var(--colors-red-300)
                      }
                  }
              }
          }
          .hover\\\\:sm\\\\:dark\\\\:bg_red\\\\.300__hover\\\\:text_pink\\\\.400 {
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
        styles: {
          _hover: { _disabled: { bg: { sm: 'red.300' } } },
        },
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
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:left_40px__\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:sm\\\\:text_left {
              &:hover {
                  @media base {
                      left: 40px
                  }
              }
          }
          .\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:left_40px__\\\\[\\\\@media_base\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:sm\\\\:text_left {
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
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              & + span {
                  margin-left: $2
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              &:focus, &:hover {
                  box-shadow: none
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              .test & {
                  background-color: blue
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              & .my-class {
                  color: red
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              :focus > & {
                  color: var(--colors-white)
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              @media (min-width: 768px) {
                  background-color: green
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              @media (min-width: 768px) {
                  font-size: $small
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              &:hover {
                  @media (min-width: 768px) {
                      background-color: yellow
                  }
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              & span {
                  color: red
              }
          }
          .all_unset__bg_red__border_none__p_\\\\$3_\\\\$3__rounded_\\\\$button__fs_\\\\$xsmall__cursor_pointer__\\\\[\\\\&_\\\\+_span\\\\]\\\\:ml_\\\\$2__\\\\[\\\\&\\\\:focus\\\\,_\\\\&\\\\:hover\\\\]\\\\:shadow_none__\\\\[\\\\.test_\\\\&\\\\]\\\\:bg_blue__\\\\[\\\\&_\\\\.my-class\\\\]\\\\:text_red__\\\\[\\\\:focus_\\\\>_\\\\&\\\\]\\\\:text_white__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:bg_green__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:fs_\\\\$small__\\\\[\\\\@media_\\\\(min-width\\\\:_768px\\\\)\\\\]\\\\:\\\\[\\\\&\\\\:hover\\\\]\\\\:bg_yellow__\\\\[\\\\&_span\\\\]\\\\:text_red {
              all: unset;
              background-color: red;
              border: var(--borders-none);
              padding: $3 $3;
              border-radius: $button;
              font-size: $xsmall;
              cursor: pointer
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
