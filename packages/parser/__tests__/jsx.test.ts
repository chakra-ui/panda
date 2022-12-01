import { describe, test, expect } from 'vitest'
import { jsxParser } from './fixture'

describe('jsx', () => {
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

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
            "marginTop": "40px",
          },
          "name": "panda.button",
          "type": "jsx-factory",
        },
        {
          "data": {},
          "name": "panda.div",
          "type": "jsx-factory",
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

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
            "marginTop": "40px",
          },
          "name": "styled.button",
          "type": "jsx-factory",
        },
        {
          "data": {},
          "name": "styled.div",
          "type": "jsx-factory",
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

    expect(jsxParser(code)).toMatchInlineSnapshot(`
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
          "name": "panda.button",
          "type": "jsx-factory",
        },
        {
          "data": {},
          "name": "panda.div",
          "type": "jsx-factory",
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

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "marginBottom": "42px",
          },
          "name": "panda.button",
          "type": "jsx-factory",
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

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "css": {
              "bg": "red.200",
            },
          },
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })

  test('should omit new line characters', () => {
    const code = `
       import { panda } from ".panda/jsx"

       function Button() {
        const disabled = true
         return (
            <div marginTop="55555px">
            <panda.div
              backgroundImage="linear-gradient(
                135deg,
                hsla(0, 0%, 100%, 0.75) 10%,
                transparent 0,
                transparent 50%,
                hsla(0, 0%, 100%, 0.75) 0,
                hsla(0, 0%, 100%, 0.75) 60%,
                transparent 0,
                transparent
              )"
          />
            </div>
        )
       }
     `

    expect(jsxParser(code)).toMatchInlineSnapshot(`
      Set {
        {
          "data": {
            "backgroundImage": "linear-gradient( 135deg, hsla(0, 0%, 100%, 0.75) 10%, transparent 0, transparent 50%, hsla(0, 0%, 100%, 0.75) 0, hsla(0, 0%, 100%, 0.75) 60%, transparent 0, transparent )",
          },
          "name": "panda.div",
          "type": "jsx-factory",
        },
      }
    `)
  })
})
