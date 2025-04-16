import { GlobalPositionTry } from '../src/global-position-try'

describe('global position try', () => {
  test('dash ident', () => {
    const pos = new GlobalPositionTry({
      globalPositionTry: {
        '--bottom-scrollable': {
          alignSelf: 'stretch',
        },
      },
    })

    expect(pos.toString()).toMatchInlineSnapshot(`
      "@position-try --bottom-scrollable {
        align-self: stretch;

      }"
    `)
  })

  test('without dash ident', () => {
    const pos = new GlobalPositionTry({
      globalPositionTry: {
        'bottom-scrollable': {
          positionArea: 'block-start span-inline-end',
          alignSelf: 'stretch',
        },
      },
    })

    expect(pos.toString()).toMatchInlineSnapshot(`
      "@position-try --bottom-scrollable {
        position-area: block-start span-inline-end;
      align-self: stretch;

      }"
    `)
  })
})
