import { describe, expect, test } from 'vitest'
import { parse } from '../index'
import { visitCallExpressions } from '../src/call-expression'
import { visitVElement } from '../src/vue-element'

describe('vue template parser', () => {
  test('should parse', () => {
    const code = `
    <template>
      <p :class="css({ bg:'red.300', _hover: { bg: 'pink.400' }, mt: [1, null, 2] })">{{ greeting }} World!</p>
      <panda.div mt="40px" :_hover="{bg: 'red.400'}">
        <panda.div my=30px font-size=lg :font-weight=400>Welcome</panda.div>
      </panda.div>
    </template>
    
    <script>
    export default {
      data () {
        return {
          greeting: "Hello"
        };
      }
    };
    </script>
    
    <style scoped>
    p {
      font-size: 2em;
      text-align: center;
    }
    </style>
    `

    const map = new Map([
      ['css', new Set()],
      ['v-element', new Set()],
    ])

    const { children } = parse(code).templateBody ?? {}
    visitCallExpressions(children, {
      match(name) {
        return name === 'css'
      },
      fn(result) {
        map.get('css')?.add(result)
      },
    })

    visitVElement(children, {
      match: {
        tag(name) {
          return name.startsWith('panda')
        },
        prop({ tag, name }) {
          return tag === 'panda.div' && ['mt', '_hover', 'my', 'font-size', 'font-weight'].includes(name)
        },
      },
      fn(result) {
        map.get('v-element')?.add(result)
      },
    })

    expect(map).toMatchInlineSnapshot(`
      Map {
        "css" => Set {
          {
            "data": {
              "_hover": {
                "bg": "pink.400",
              },
              "bg": "red.300",
              "mt": [
                1,
                null,
                2,
              ],
            },
            "name": "css",
          },
        },
        "v-element" => Set {
          {
            "data": {
              "_hover": {
                "bg": "red.400",
              },
              "mt": "40px",
            },
            "name": "panda.div",
          },
          {
            "data": {
              "font-size": "lg",
              "font-weight": 400,
              "my": "30px",
            },
            "name": "panda.div",
          },
        },
      }
    `)
  })
})
