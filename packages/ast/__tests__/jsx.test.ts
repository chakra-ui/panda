import { describe, test, expect } from 'vitest'
import { transformSync } from '../src/transform'
import { jsxPlugin } from './fixture'

describe('[jsx]', () => {
  test('should extract', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
               <panda.button marginTop="40px" marginBottom="42px">Click me</panda.button>
               <panda.div bg="red.200">Click me</panda.div>
            </div>
        )
       }
     `

    const collect = new Set()

    transformSync(code, {
      plugins: [jsxPlugin(collect)],
    })

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
            "marginTop": "40px",
          },
          "name": "panda",
        },
        {
          "data": {},
          "name": "panda",
        },
      }
    `)
  })

  test('[import alias] should extract', () => {
    const code = `
       import { panda as styled } from ".panda/jsx"

       function Button() {
         return (
            <div marginTop="55555px">
               <styled.button marginTop="40px" marginBottom="42px">Click me</styled.button>
               <styled.div bg="red.200">Click me</styled.div>
            </div>
        )
       }
     `

    const collect = new Set()

    transformSync(code, {
      plugins: [jsxPlugin(collect)],
    })

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
            "marginTop": "40px",
          },
          "name": "panda",
        },
        {
          "data": {},
          "name": "panda",
        },
      }
    `)
  })

  test('should extract responsive', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.button marginTop={{sm: "40px", md: {rtl: "40px"}}} marginBottom="42px">Click me</panda.button>
               <panda.div bg="red.200">Click me</panda.div>
            </div>
        )
       }
     `

    const collect = new Set()

    transformSync(code, {
      plugins: [jsxPlugin(collect)],
    })

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
            "marginTop": {
              "md": {
                "rtl": "40px",
              },
              "sm": "40px",
            },
          },
          "name": "panda",
        },
        {
          "data": {},
          "name": "panda",
        },
      }
    `)
  })

  test('should extract conditions', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.button marginLeft={disabled ? "40px" : "50px"} marginBottom="42px">Click me</panda.button>
            </div>
        )
       }
     `

    const collect = new Set()

    transformSync(code, {
      plugins: [jsxPlugin(collect)],
    })

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "conditions": [
              {
                "marginLeft": "40px",
              },
              {
                "marginLeft": "50px",
              },
            ],
            "marginBottom": "42px",
          },
          "name": "panda",
        },
      }
    `)
  })

  test('should extract object prop', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
               <panda.div css={{ bg: "red.200" }}>Click me</panda.div>
            </div>
        )
       }
     `

    const collect = new Set()

    transformSync(code, {
      plugins: [jsxPlugin(collect)],
    })

    expect(collect).toMatchInlineSnapshot(`
      Set {
        {
          "data": {},
          "name": "panda",
        },
      }
    `)
  })
})
