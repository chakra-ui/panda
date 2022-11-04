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
          .color-red\\\\! {
              color: red !important
          }
          .fontSize-30px\\\\! {
              font-size: 30px !important
          }
      }"
    `)
  })

  test('should work with basic', () => {
    expect(css({ styles: { bg: 'red.300' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .background-red\\\\.300 {
              background: red.300
          }
      }"
    `)
  })

  test('should resolve shorthand', () => {
    expect(css({ styles: { width: '50px', w: '20px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w-20px {
              width: 20px
          }
      }"
    `)

    expect(css({ styles: { width: { _: '50px', md: '60px' }, w: '70px' } })).toMatchInlineSnapshot(`
      "@layer utilities {
          .w-70px {
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
              [dir=ltr] .ltr\\\\:sm\\\\:marginLeft-4 {
                  margin-left: 4
              }
          }
          [dir=rtl] .rtl\\\\:marginLeft--4 {
              margin-left: -4
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
          [data-theme=light] .light\\\\:color-red {
              color: red
          }
          [data-theme=dark] .dark\\\\:color-green {
              color: green
          }
          [data-theme=dark] .dark\\\\:opacity-slate400 {
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
              [dir=rtl] .sm\\\\:rtl\\\\:top-20px {
                  top: 20px
              }
          }
          @screen sm {
              .sm\\\\:hover\\\\:top-50px:hover {
                  top: 50px
              }
          }
          @screen lg {
              .lg\\\\:top-120px {
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
          .left-20px {
              left: 20px
          }
          @screen md {
              .md\\\\:left-40px {
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
          .\\\\[\\\\&_\\\\>_p\\\\]\\\\:left-20px > p {
              left: 20px
          }
          @screen md {
              .\\\\[\\\\&_\\\\>_p\\\\]\\\\:md\\\\:left-40px > p {
                  left: 40px
              }
          }
          [data-theme=light] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:light\\\\:background-red400 > p {
              background: red400
          }
          [data-theme=dark] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:dark\\\\:background-green500 > p {
              background: green500
          }
          [dir=rtl] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:rtl\\\\:font-sans > p {
              font: sans
          }
          @screen sm {
              [data-theme=dark] [dir=ltr] .\\\\[\\\\&_\\\\>_p\\\\]\\\\:ltr\\\\:dark\\\\:sm\\\\:hover\\\\:font-serif:hover > p {
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
          input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:background-red400 {
              background: red400
          }
          @screen sm {
              input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:sm\\\\:fontSize-14px {
                  font-size: 14px
              }
          }
          @screen lg {
              input:hover .\\\\[input\\\\:hover_\\\\&\\\\]\\\\:lg\\\\:fontSize-18px {
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
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:left-40px::placeholder {
              left: 40px
          }
          .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:background-red400::placeholder {
              background: red400
          }
          @screen sm {
              .\\\\[\\\\&\\\\:\\\\:placeholder\\\\]\\\\:sm\\\\:ta-left::placeholder {
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
              .\\\\[\\\\@media_base\\\\]\\\\:left-40px {
                  left: 40px
              }
          }
          @media base {
              @screen sm {
                  .\\\\[\\\\@media_base\\\\]\\\\:sm\\\\:ta-left {
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
          .hover\\\\:background-pink\\\\.400:hover {
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
              [data-theme=dark] .hover\\\\:sm\\\\:dark\\\\:background-red\\\\.300:hover {
                  background: red.300
              }
          }
          .hover\\\\:color-pink\\\\.400:hover {
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
              .hover\\\\:disabled\\\\:sm\\\\:background-red\\\\.300:hover:disabled {
                  background: red.300
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
              .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:left-40px:hover {
                  left: 40px
              }
          }
          @media base {
              @screen sm {
                  .\\\\[\\\\@media_base__\\\\&\\\\:hover\\\\]\\\\:sm\\\\:ta-left:hover {
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
          .all-unset {
              all: unset
          }
          .backgroundColor-red {
              background-color: red
          }
          .border-none {
              border: none
          }
          .padding-\\\\$3_\\\\$3 {
              padding: $3 $3
          }
          .borderRadius-\\\\$button {
              border-radius: $button
          }
          .fontSize-\\\\$xsmall {
              font-size: $xsmall
          }
          .cursor-pointer {
              cursor: pointer
          }
          .\\\\&\\\\ \\\\+\\\\ span\\\\:marginLeft-\\\\$2 + span {
              margin-left: $2
          }
          .\\\\&\\\\:focus\\\\,\\\\ \\\\&\\\\:hover\\\\:boxShadow-none:focus, .\\\\&\\\\:focus\\\\,\\\\ \\\\&\\\\:hover\\\\:boxShadow-none:hover {
              box-shadow: none
          }
          .test .\\\\.test\\\\ \\\\&\\\\:backgroundColor-blue {
              background-color: blue
          }
          .\\\\&\\\\ \\\\.my-class\\\\:color-red .my-class {
              color: red
          }
          :focus > .\\\\:focus\\\\ \\\\>\\\\ \\\\&\\\\:color-white {
              color: white
          }
          @media (min-width: 768px) {
              .\\\\@media\\\\ \\\\(min-width\\\\:\\\\ 768px\\\\)\\\\:backgroundColor-green {
                  background-color: green
              }
          }
          @media (min-width: 768px) {
              .\\\\@media\\\\ \\\\(min-width\\\\:\\\\ 768px\\\\)\\\\:fontSize-\\\\$small {
                  font-size: $small
              }
          }
          @media (min-width: 768px) {
              .\\\\@media\\\\ \\\\(min-width\\\\:\\\\ 768px\\\\)\\\\:\\\\&\\\\:hover\\\\:backgroundColor-yellow:hover {
                  background-color: yellow
              }
          }
          .\\\\&\\\\ span\\\\:color-red span {
              color: red
          }
      }"
    `)
  })
})
