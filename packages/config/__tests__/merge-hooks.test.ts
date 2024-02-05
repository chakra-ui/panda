import { describe, expect, test } from 'vitest'
import { mergeHooks } from '../src/merge-config'

describe('mergeConfigs / theme', () => {
  test('should merge hooks and call sequentially async', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        'config:resolved': (args) => {
          order.push(0)
          conf = args.conf

          // @ts-expect-error
          args.conf.xxx = 'aaa'
        },
      },
      {
        'config:resolved': (args) => {
          order.push(1)
          conf = args.conf

          // @ts-expect-error
          expect(args.conf.xxx).toBe('aaa')

          // @ts-expect-error
          args.conf.xxx = 'bbb'
        },
      },
    ])

    await hooks['config:resolved']?.({ conf: {} } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `)
    // @ts-expect-error
    expect(conf.xxx).toMatchInlineSnapshot(`"bbb"`)
  })

  test('should merge hooks and call sequentially using previous result', async () => {
    const order: number[] = []
    let original: string
    const hooks = mergeHooks([
      {
        'cssgen:done': (args) => {
          order.push(0)

          original = args.original as string
          return '0' + args.content.replace('aaa', 'bbb')
        },
      },
      {
        'cssgen:done': (args) => {
          order.push(1)

          expect(args.original).toBe(original)
          expect(args.original).toMatchInlineSnapshot(`"aaa bbb ccc"`)
          return args.content.replace('ccc', 'xxx') + '1'
        },
      },
    ])

    const result = hooks['cssgen:done']?.({ content: 'aaa bbb ccc' } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `)
    expect(result).toMatchInlineSnapshot(`"0bbb bbb xxx1"`)
  })
})
