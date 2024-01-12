import { describe, expect, it } from 'vitest'
import { deepSet } from '../src/deep-set'

describe('deepSet', () => {
  it('should set a value at the specified path in the target object', () => {
    const target = {
      foo: {
        bar: {
          baz: 'oldValue',
        },
      },
    }

    const path = ['foo', 'bar', 'baz']
    const value = 'newValue'

    deepSet(target, path, value)

    expect(target).toMatchInlineSnapshot(`
      {
        "foo": {
          "bar": {
            "baz": "newValue",
          },
        },
      }
    `)
  })

  it('should create nested objects if they do not exist', () => {
    const target = {}
    const path = ['foo', 'bar', 'baz']
    const value = 'newValue'

    deepSet(target, path, value)

    expect(target).toMatchInlineSnapshot(`
      {
        "foo": {
          "bar": {
            "baz": "newValue",
          },
        },
      }
    `)
  })

  it('should overwrite existing values at the specified path', () => {
    const target = {
      foo: {
        bar: {
          baz: 'oldValue',
        },
      },
    }

    const path = ['foo', 'bar', 'baz']
    const value = 'newValue'

    deepSet(target, path, value)

    expect(target).toMatchInlineSnapshot(`
      {
        "foo": {
          "bar": {
            "baz": "newValue",
          },
        },
      }
    `)
  })

  it('should assign object at path', () => {
    const target = {
      foo: {
        bar: {
          baz: 'oldValue',
        },
      },
    }

    const path = ['foo', 'bar']
    const value = { nested: 'newValue' }

    deepSet(target, path, value)

    expect(target).toMatchInlineSnapshot(`
      {
        "foo": {
          "bar": {
            "baz": "oldValue",
            "nested": "newValue",
          },
        },
      }
    `)
  })

  it('should assign object at path (string)', () => {
    const target = {
      foo: {
        bar: {
          baz: 'oldValue',
        },
      },
    }

    const path = ['foo', 'bar', 'baz']
    const value = { nested: 'newValue' }

    deepSet(target, path, value)

    expect(target).toMatchInlineSnapshot(`
      {
        "foo": {
          "bar": {
            "baz": {
              "nested": "newValue",
            },
          },
        },
      }
    `)
  })
})
