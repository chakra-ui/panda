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
          .fVOTto {
              color: red !important;
              font-size: 30px !important
          }
      }"
    `)
  })

  test('should work with basic', () => {
    expect(css({ styles: { bg: 'red.300' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .kqhTKz {
              background: var(--colors-red-300)
          }
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ styles: { width: '50px', w: '20px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .dRToyv {
              width: 20px
          }
      }"
    `)

    expect(css({ styles: { width: { base: '50px', md: '60px' }, w: '70px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .hVktBK {
              width: 70px
          }
      }"
    `)
  })

  test('should resolve responsive array', () => {
    expect(css({ styles: { width: ['50px', '60px'] } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .cCCFHz {
              @media screen and (min-width: 40em) {
                  width: 60px
              }
          }
          .cCCFHz {
              width: 50px
          }
      }"
    `)
  })

  test('should resolve responsive array with gaps', () => {
    expect(css({ styles: { width: ['50px', null, '60px'] } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .jzSCGQ {
              @media screen and (min-width: 48em) {
                  width: 60px
              }
          }
          .jzSCGQ {
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
          .fvPiUb {
              [dir=ltr] & {
                  @media screen and (min-width: 40em) {
                      margin-left: var(--spacing-4)
                  }
              }
          }
          .fvPiUb {
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
          .kfirSV {
               &.light, .light & {
                  color: red
              }
          }
          .kfirSV {
               &.dark, .dark & {
                  color: green
              }
          }
          .kfirSV {
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
          .dToxDd {
              [dir=rtl] & {
                  @media screen and (min-width: 40em) {
                      top: 20px
                  }
              }
          }
          .dToxDd {
              &:is(:hover, [data-hover]) {
                  @media screen and (min-width: 40em) {
                      top: 50px
                  }
              }
          }
          .dToxDd {
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
          .grCvRg {
              @media screen and (min-width: 48em) {
                  left: 40px
              }
          }
          .grCvRg {
              left: 20px
          }
      }"
    `)
  })

  test('should work with boolean transform', () => {
    expect(css({ styles: { debug: true } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .KdJkM {
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
          .dUhjO {
              & > p {
                  left: 20px
              }
          }
          .dUhjO {
              & > p {
                  @media screen and (min-width: 48em) {
                      left: 40px
                  }
              }
          }
          .dUhjO {
              & > p {
                   &.light, .light & {
                      background: red400
                  }
              }
          }
          .dUhjO {
              & > p {
                   &.dark, .dark & {
                      background: green500
                  }
              }
          }
          .dUhjO {
              & > p {
                  [dir=rtl] & {
                      font: sans
                  }
              }
          }
          .dUhjO {
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
          .jzNKXF {
              input:hover & {
                  background: red400
              }
          }
          .jzNKXF {
              input:hover & {
                  @media screen and (min-width: 40em) {
                      font-size: 14px
                  }
              }
          }
          .jzNKXF {
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
          .doHJfd {
              &::placeholder {
                  left: 40px
              }
          }
          .doHJfd {
              &::placeholder {
                  background: red400
              }
          }
          .doHJfd {
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
          .knFbfi {
              @media base {
                  left: 40px
              }
          }
          .knFbfi {
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
          .gZsUrG {
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
          .iUKBla {
              &:is(:hover, [data-hover]) {
                   &.dark, .dark & {
                      @media screen and (min-width: 40em) {
                          background: var(--colors-red-300)
                      }
                  }
              }
          }
          .iUKBla {
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
          .lliWRX {
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
          .dapdYc {
              &:hover {
                  @media base {
                      left: 40px
                  }
              }
          }
          .dapdYc {
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
          .kihEqI {
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
          .dtqgAs {
              & + span {
                  margin-left: $2
              }
          }
          .dtqgAs {
              &:focus, &:hover {
                  box-shadow: none
              }
          }
          .dtqgAs {
              .test & {
                  background-color: blue
              }
          }
          .dtqgAs {
              & .my-class {
                  color: red
              }
          }
          .dtqgAs {
              :focus > & {
                  color: var(--colors-white)
              }
          }
          .dtqgAs {
              @media (min-width: 768px) {
                  background-color: green
              }
          }
          .dtqgAs {
              @media (min-width: 768px) {
                  font-size: $small
              }
          }
          .dtqgAs {
              &:hover {
                  @media (min-width: 768px) {
                      background-color: yellow
                  }
              }
          }
          .dtqgAs {
              & span {
                  color: red
              }
          }
          .dtqgAs {
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
          .bDiHXC {
              & kbd {
                  color: red
              }
          }
      }"
    `)
  })
})
