import { GlobalFontface } from '../src/global-fontface'

describe('global fontface', () => {
  test('single src', () => {
    const fontface = new GlobalFontface({
      globalFontface: {
        Inter: {
          src: 'url(./inter.woff2)',
          fontWeight: 400,
          fontStyle: 'normal',
        },
      },
    })

    expect(fontface.toString()).toMatchInlineSnapshot(`
      "@font-face {
        font-family: Inter;
        src: url(./inter.woff2);
      font-weight: 400;
      font-style: normal;

      }"
    `)
  })

  test('multiple src', () => {
    const fontface = new GlobalFontface({
      globalFontface: {
        Inter: {
          src: ['url(./inter.woff2)', 'url(./inter.woff)'],
          fontWeight: 400,
          fontStyle: 'normal',
        },
      },
    })

    expect(fontface.toString()).toMatchInlineSnapshot(`
      "@font-face {
        font-family: Inter;
        src: url(./inter.woff2),url(./inter.woff);
      font-weight: 400;
      font-style: normal;

      }"
    `)
  })

  test('multiple font src', () => {
    const fontface = new GlobalFontface({
      globalFontface: {
        Inter: [
          {
            src: ['url(./inter.woff2)', 'url(./inter.woff)'],
            fontWeight: 400,
            fontStyle: 'normal',
          },
          {
            src: ['url(./inter-bold.woff2)', 'url(./inter-bold.woff)'],
            fontWeight: 700,
            fontStyle: 'normal',
          },
        ],
      },
    })

    expect(fontface.toString()).toMatchInlineSnapshot(`
      "@font-face {
        font-family: Inter;
        src: url(./inter.woff2),url(./inter.woff);
      font-weight: 400;
      font-style: normal;

      }

      @font-face {
        font-family: Inter;
        src: url(./inter-bold.woff2),url(./inter-bold.woff);
      font-weight: 700;
      font-style: normal;

      }"
    `)
  })
})
