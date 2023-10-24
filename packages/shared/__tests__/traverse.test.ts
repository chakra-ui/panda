import { describe, expect, it, vi } from 'vitest'
import { traverse } from '../src/traverse'

describe('traverse', () => {
  it('should traverse an object and call the callback function on each property', () => {
    const obj = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          arr: [4, { prop: '5' }],
        },
        f: null,
        g: undefined,
        h: false,
        i: '',
        j: 6,
      },
    }

    const callback = vi.fn()

    traverse(obj, callback)

    expect(callback.mock.calls.map(([{ value }]) => value).filter((v) => typeof v !== 'object' || v === null))
      .toMatchInlineSnapshot(`
        [
          1,
          2,
          3,
          4,
          "5",
          null,
          undefined,
          false,
          "",
          6,
        ]
      `)
    expect(callback.mock.calls.map((v) => v[0])).toMatchInlineSnapshot(`
      [
        {
          "depth": 0,
          "key": "a",
          "parent": {
            "a": 1,
            "b": {
              "c": 2,
              "d": {
                "arr": [
                  4,
                  {
                    "prop": "5",
                  },
                ],
                "e": 3,
              },
              "f": null,
              "g": undefined,
              "h": false,
              "i": "",
              "j": 6,
            },
          },
          "path": "a",
          "value": 1,
        },
        {
          "depth": 0,
          "key": "b",
          "parent": {
            "a": 1,
            "b": {
              "c": 2,
              "d": {
                "arr": [
                  4,
                  {
                    "prop": "5",
                  },
                ],
                "e": 3,
              },
              "f": null,
              "g": undefined,
              "h": false,
              "i": "",
              "j": 6,
            },
          },
          "path": "b",
          "value": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
        },
        {
          "depth": 1,
          "key": "c",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.c",
          "value": 2,
        },
        {
          "depth": 1,
          "key": "d",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.d",
          "value": {
            "arr": [
              4,
              {
                "prop": "5",
              },
            ],
            "e": 3,
          },
        },
        {
          "depth": 2,
          "key": "e",
          "parent": {
            "arr": [
              4,
              {
                "prop": "5",
              },
            ],
            "e": 3,
          },
          "path": "b.d.e",
          "value": 3,
        },
        {
          "depth": 2,
          "key": "arr",
          "parent": {
            "arr": [
              4,
              {
                "prop": "5",
              },
            ],
            "e": 3,
          },
          "path": "b.d.arr",
          "value": [
            4,
            {
              "prop": "5",
            },
          ],
        },
        {
          "depth": 3,
          "key": "0",
          "parent": [
            4,
            {
              "prop": "5",
            },
          ],
          "path": "b.d.arr.0",
          "value": 4,
        },
        {
          "depth": 3,
          "key": "1",
          "parent": [
            4,
            {
              "prop": "5",
            },
          ],
          "path": "b.d.arr.1",
          "value": {
            "prop": "5",
          },
        },
        {
          "depth": 4,
          "key": "prop",
          "parent": {
            "prop": "5",
          },
          "path": "b.d.arr.1.prop",
          "value": "5",
        },
        {
          "depth": 1,
          "key": "f",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.f",
          "value": null,
        },
        {
          "depth": 1,
          "key": "g",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.g",
          "value": undefined,
        },
        {
          "depth": 1,
          "key": "h",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.h",
          "value": false,
        },
        {
          "depth": 1,
          "key": "i",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.i",
          "value": "",
        },
        {
          "depth": 1,
          "key": "j",
          "parent": {
            "c": 2,
            "d": {
              "arr": [
                4,
                {
                  "prop": "5",
                },
              ],
              "e": 3,
            },
            "f": null,
            "g": undefined,
            "h": false,
            "i": "",
            "j": 6,
          },
          "path": "b.j",
          "value": 6,
        },
      ]
    `)
  })

  it('should traverse an array and call the callback function on each element', () => {
    const arr = [1, [2, [3]]]

    const callback = vi.fn()

    traverse(arr, callback)

    expect(callback.mock.calls.map((v) => v[0])).toMatchInlineSnapshot(`
      [
        {
          "depth": 0,
          "key": "0",
          "parent": [
            1,
            [
              2,
              [
                3,
              ],
            ],
          ],
          "path": "0",
          "value": 1,
        },
        {
          "depth": 0,
          "key": "1",
          "parent": [
            1,
            [
              2,
              [
                3,
              ],
            ],
          ],
          "path": "1",
          "value": [
            2,
            [
              3,
            ],
          ],
        },
        {
          "depth": 1,
          "key": "0",
          "parent": [
            2,
            [
              3,
            ],
          ],
          "path": "1.0",
          "value": 2,
        },
        {
          "depth": 1,
          "key": "1",
          "parent": [
            2,
            [
              3,
            ],
          ],
          "path": "1.1",
          "value": [
            3,
          ],
        },
        {
          "depth": 2,
          "key": "0",
          "parent": [
            3,
          ],
          "path": "1.1.0",
          "value": 3,
        },
      ]
    `)
  })

  it('should have the correct path', () => {
    const callback = vi.fn()

    traverse(
      {
        blur: {
          _dark: {
            bg: 'dark',
            shadow: '0 -1px 0 rgba(255,255,255,.1) inset',
          },
          shadow: '0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)',
          _supportsBackdrop: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85) !important',
            _dark: {
              backgroundColor: 'hsla(0,0%,7%,.8) !important',
            },
          },
        },
      },
      callback,
    )

    expect(callback.mock.calls.map((v) => v[0])).toMatchInlineSnapshot(`
      [
        {
          "depth": 0,
          "key": "blur",
          "parent": {
            "blur": {
              "_dark": {
                "bg": "dark",
                "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
              },
              "_supportsBackdrop": {
                "_dark": {
                  "backgroundColor": "hsla(0,0%,7%,.8) !important",
                },
                "backdropFilter": "blur(8px)",
                "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
              },
              "shadow": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
            },
          },
          "path": "blur",
          "value": {
            "_dark": {
              "bg": "dark",
              "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
            },
            "_supportsBackdrop": {
              "_dark": {
                "backgroundColor": "hsla(0,0%,7%,.8) !important",
              },
              "backdropFilter": "blur(8px)",
              "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
            },
            "shadow": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
          },
        },
        {
          "depth": 1,
          "key": "_dark",
          "parent": {
            "_dark": {
              "bg": "dark",
              "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
            },
            "_supportsBackdrop": {
              "_dark": {
                "backgroundColor": "hsla(0,0%,7%,.8) !important",
              },
              "backdropFilter": "blur(8px)",
              "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
            },
            "shadow": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
          },
          "path": "blur._dark",
          "value": {
            "bg": "dark",
            "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
          },
        },
        {
          "depth": 2,
          "key": "bg",
          "parent": {
            "bg": "dark",
            "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
          },
          "path": "blur._dark.bg",
          "value": "dark",
        },
        {
          "depth": 2,
          "key": "shadow",
          "parent": {
            "bg": "dark",
            "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
          },
          "path": "blur._dark.shadow",
          "value": "0 -1px 0 rgba(255,255,255,.1) inset",
        },
        {
          "depth": 1,
          "key": "shadow",
          "parent": {
            "_dark": {
              "bg": "dark",
              "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
            },
            "_supportsBackdrop": {
              "_dark": {
                "backgroundColor": "hsla(0,0%,7%,.8) !important",
              },
              "backdropFilter": "blur(8px)",
              "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
            },
            "shadow": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
          },
          "path": "blur.shadow",
          "value": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
        },
        {
          "depth": 1,
          "key": "_supportsBackdrop",
          "parent": {
            "_dark": {
              "bg": "dark",
              "shadow": "0 -1px 0 rgba(255,255,255,.1) inset",
            },
            "_supportsBackdrop": {
              "_dark": {
                "backgroundColor": "hsla(0,0%,7%,.8) !important",
              },
              "backdropFilter": "blur(8px)",
              "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
            },
            "shadow": "0 2px 4px rgba(0,0,0,.02),0 1px 0 rgba(0,0,0,.06)",
          },
          "path": "blur._supportsBackdrop",
          "value": {
            "_dark": {
              "backgroundColor": "hsla(0,0%,7%,.8) !important",
            },
            "backdropFilter": "blur(8px)",
            "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
          },
        },
        {
          "depth": 2,
          "key": "backdropFilter",
          "parent": {
            "_dark": {
              "backgroundColor": "hsla(0,0%,7%,.8) !important",
            },
            "backdropFilter": "blur(8px)",
            "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
          },
          "path": "blur._supportsBackdrop.backdropFilter",
          "value": "blur(8px)",
        },
        {
          "depth": 2,
          "key": "backgroundColor",
          "parent": {
            "_dark": {
              "backgroundColor": "hsla(0,0%,7%,.8) !important",
            },
            "backdropFilter": "blur(8px)",
            "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
          },
          "path": "blur._supportsBackdrop.backgroundColor",
          "value": "rgba(255, 255, 255, 0.85) !important",
        },
        {
          "depth": 2,
          "key": "_dark",
          "parent": {
            "_dark": {
              "backgroundColor": "hsla(0,0%,7%,.8) !important",
            },
            "backdropFilter": "blur(8px)",
            "backgroundColor": "rgba(255, 255, 255, 0.85) !important",
          },
          "path": "blur._supportsBackdrop._dark",
          "value": {
            "backgroundColor": "hsla(0,0%,7%,.8) !important",
          },
        },
        {
          "depth": 3,
          "key": "backgroundColor",
          "parent": {
            "backgroundColor": "hsla(0,0%,7%,.8) !important",
          },
          "path": "blur._supportsBackdrop._dark.backgroundColor",
          "value": "hsla(0,0%,7%,.8) !important",
        },
      ]
    `)
  })
})
