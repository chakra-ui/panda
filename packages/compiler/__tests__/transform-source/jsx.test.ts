import { describe, expect, test } from 'vitest'
import { createTransformProject, importMap, lines } from '../test-utils'

// Panda factory config: `<panda.div>` member tags, `Box`/`HStack`/`Wrap`/`Stack`
// patterns, a `button` config recipe (jsx: Button) and a `tabs` slot recipe
// (jsx: Tabs). The design system ships its recipe components from `@acme/ui`,
// which is mapped into the jsx importMap so Panda owns those tags (recipe
// components aren't exported from `@panda/jsx`). Mirrors crates/pandacss_project.
// Patterns use real `transform` callbacks matching preset-base (box/hstack/wrap/
// stack): each maps its pattern props to the flex style object Panda emits at
// build time. Wired through `pattern.transform` callbacks keyed by the config's
// `js-callback` transform refs, exactly like a compiled user config.
const pandaJsxCompiler = createTransformProject(
  {
    jsxFactory: 'panda',
    jsxFramework: 'react',
    importMap: { ...importMap, jsx: ['@panda/jsx', '@acme/ui'] },
    utilities: {
      color: {},
      fontWeight: {},
      gap: {},
      justifyContent: {},
      alignItems: {},
      flexDirection: {},
      flexWrap: {},
      padding: {},
      margin: {},
      width: {},
      display: { className: 'd' },
      fontSize: { className: 'fs' },
    },
    conditions: {
      hover: '&:hover',
      dark: '.dark &',
    },
    theme: {
      breakpoints: {
        sm: '640px',
        md: '768px',
      },
      recipes: {
        button: {
          className: 'button',
          jsx: ['Button'],
          base: { display: 'inline-flex' },
          defaultVariants: { size: 'md' },
          variants: {
            size: {
              sm: { fontSize: '12px' },
              md: { fontSize: '16px' },
              lg: { fontSize: '18px' },
            },
            visual: {
              solid: { color: 'white' },
              outline: { color: 'blue' },
            },
            block: {
              true: { display: 'flex' },
            },
          },
        },
      },
      slotRecipes: {
        tabs: {
          className: 'tabs',
          jsx: ['Tabs'],
          slots: ['root', 'trigger'],
          base: {
            root: { display: 'flex' },
            trigger: { color: 'blue' },
          },
          variants: {
            size: {
              sm: {
                root: { padding: '2px' },
                trigger: { padding: '1px' },
              },
            },
          },
        },
      },
    },
    patterns: {
      box: {
        jsxName: 'Box',
        transform: { kind: 'js-callback', id: 'patterns.box.transform' },
      },
      hstack: {
        jsxName: 'HStack',
        properties: {
          justify: { type: 'property', value: 'justifyContent' },
          gap: { type: 'property', value: 'gap' },
        },
        defaultValues: { gap: '8px' },
        transform: { kind: 'js-callback', id: 'patterns.hstack.transform' },
      },
      wrap: {
        jsxName: 'Wrap',
        properties: {
          gap: { type: 'property', value: 'gap' },
          rowGap: { type: 'property', value: 'gap' },
          columnGap: { type: 'property', value: 'gap' },
          align: { type: 'property', value: 'alignItems' },
          justify: { type: 'property', value: 'justifyContent' },
        },
        transform: { kind: 'js-callback', id: 'patterns.wrap.transform' },
      },
      stack: {
        jsxName: 'Stack',
        properties: {
          align: { type: 'property', value: 'alignItems' },
          justify: { type: 'property', value: 'justifyContent' },
          direction: { type: 'property', value: 'flexDirection' },
          gap: { type: 'property', value: 'gap' },
        },
        defaultValues: { direction: 'column', gap: '8px' },
        transform: { kind: 'js-callback', id: 'patterns.stack.transform' },
      },
    },
  },
  {
    crossFile: false,
    callbacks: {
      'pattern.transform': {
        'patterns.box.transform': (props) => props,
        'patterns.hstack.transform': (props) => {
          const { justify, gap, ...rest } = props
          return { display: 'flex', alignItems: 'center', justifyContent: justify, gap, flexDirection: 'row', ...rest }
        },
        'patterns.wrap.transform': (props) => {
          const { columnGap, rowGap, gap = columnGap || rowGap ? undefined : '8px', align, justify, ...rest } = props
          return {
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: align,
            justifyContent: justify,
            gap,
            columnGap,
            rowGap,
            ...rest,
          }
        },
        'patterns.stack.transform': (props) => {
          const { align, justify, direction, gap, ...rest } = props
          return { display: 'flex', flexDirection: direction, alignItems: align, justifyContent: justify, gap, ...rest }
        },
      },
    },
  },
)

// Default `styled` factory config: `<styled.div>` member tags and the built-in
// `Box` mapped component. Mirrors crates/pandacss_project `project_with_jsx`.
const styledJsxCompiler = createTransformProject({
  jsxFramework: 'react',
  shorthands: true,
  utilities: {
    color: {},
    padding: {},
    margin: {},
    width: {},
    fontWeight: {},
    display: { className: 'd' },
    backgroundColor: { shorthand: 'bg' },
  },
  conditions: {
    hover: '&:hover',
    dark: '.dark &',
    focus: '&:focus',
  },
  theme: {
    breakpoints: {
      sm: '640px',
      md: '768px',
    },
  },
})

describe('compiler.transformSource: jsx', () => {
  test('rewrites pattern JSX css props with the panda factory config', () => {
    const source = lines(
      "import { HStack } from '@panda/jsx'",
      'export const el = <HStack gap="4" css={{ color: \'red\' }} />',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/patterns.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="align-items_center color_red d_flex flex-direction_row gap_4" />"`,
    )
  })

  test('rewrites panda factory member tags to intrinsic elements', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'export const el = <panda.footer color="red" fontWeight="bold">footer</panda.footer>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/footer.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const el = <footer className="color_red font-weight_bold">footer</footer>"
    `)
  })

  test('rewrites Box as component identifiers without losing the target component', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box as={ChevronDownIcon} color="red" />',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/box.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const el = <ChevronDownIcon className="color_red" />"
    `)
  })

  // --- styled factory + Box mapped component (default factory config) ---

  test('rewrites a styled.div factory element to a plain div', () => {
    const source = lines("import { styled } from '@panda/jsx'", 'export const el = <styled.div color="red" />')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="color_red" />"`)
  })

  test('rewrites a paired styled.button element and its closing tag', () => {
    const source = lines(
      "import { styled } from '@panda/jsx'",
      'export const el = <styled.button color="red">Save</styled.button>',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <button className="color_red">Save</button>"`)
  })

  test('rewrites a self-closing Box mapped component to a div', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box color="red" />')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="color_red" />"`)
  })

  test('rewrites the closing tag of a paired Box element', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box color="red">child</Box>')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="color_red">child</div>"`)
  })

  test('pairs the outer closing tag for nested same-name Box elements', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box color="red"><Box>inner</Box></Box>',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { Box } from '@panda/jsx'
      export const el = <div className="color_red"><Box>inner</Box></div>"
    `)
  })

  test('does not treat a closing tag inside a string child as the element close', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box color="red">{"</Box>"}</Box>')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="color_red">{"</Box>"}</div>"`)
  })

  // --- className merging ---

  test('merges an existing static className with generated classes', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box className="foo" color="red" />')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="foo color_red" />"`)
  })

  test('merges a dynamic className expression with generated classes', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box className={props.className} color="red" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className={props.className + " color_red"} />"`)
  })

  test('merges className, style props, and a css prop together', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box className="foo" color="red" css={{ padding: \'2\' }} />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="foo color_red padding_2" />"`)
  })

  // --- as prop ---

  test('rewrites a static string as prop to a different tag', () => {
    const source = lines(
      "import { styled } from '@panda/jsx'",
      'export const el = <styled.div as="a" color="red" href="/home" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <a href="/home" className="color_red" />"`)
  })

  test('rewrites a component-identifier as prop to that component', () => {
    const source = lines(
      "import { styled } from '@panda/jsx'",
      'export const el = <styled.div as={Link} color="red" href="/home" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <Link href="/home" className="color_red" />"`)
  })

  test('leaves an element with a dynamic as prop untouched', () => {
    const source = lines(
      "import { styled } from '@panda/jsx'",
      'export const el = <styled.div as={props.as} color="red" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { styled } from '@panda/jsx'
      export const el = <styled.div as={props.as} color="red" />"
    `)
  })

  // --- bail cases ---

  test('leaves a spread element untouched without bailing the file', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box {...props} color="red" />')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Box } from '@panda/jsx'
      export const el = <Box {...props} color="red" />"
    `)
  })

  test('leaves a dynamic style prop element untouched while rewriting siblings', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const ok = <Box color="red" />',
      'export const skip = <Box color={props.color} />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "import { Box } from '@panda/jsx'
      export const ok = <div className="color_red" />
      export const skip = <Box color={props.color} />"
    `)
  })

  // --- conditional style props ---

  test('rewrites a finite conditional style prop to a ternary className', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box color={isError ? 'red' : 'blue'} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={isError ? "color_red" : "color_blue"} />"`,
    )
  })

  test('peels a static className in front of a conditional style prop', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box className=\"foo\" color={isError ? 'red' : 'blue'} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={"foo" + " " + (isError ? "color_red" : "color_blue")} />"`,
    )
  })

  test('rewrites responsive and hover conditions on a single element', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box color=\"blue\" _hover={{ color: 'red' }} md={{ padding: '4px' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="color_blue hover:color_red md:padding_4px" />"`,
    )
  })

  test('rewrites a nested hover conditional with a ternary value to ternary classes', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box color=\"blue\" _hover={{ color: isDark ? 'white' : 'black' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={isDark ? "color_blue hover:color_white" : "color_blue hover:color_black"} />"`,
    )
  })

  test('rewrites two conditional style props on one element', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box color={isError ? 'red' : 'blue'} bg={isDark ? 'black' : 'white'} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={(isError ? "color_red" : "color_blue") + " " + (isDark ? "bg_black" : "bg_white")} />"`,
    )
  })

  test('rewrites a static prop alongside two conditional props', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box padding=\"4\" color={isError ? 'red' : 'blue'} bg={isDark ? 'black' : 'white'} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={(isError ? "color_red padding_4" : "color_blue padding_4") + " " + (isDark ? "bg_black padding_4" : "bg_white padding_4")} />"`,
    )
  })

  test('rewrites a ternary directly in the className prop', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box className={ok ? 'a' : 'b'} color=\"red\" />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className={(ok ? 'a' : 'b') + " color_red"} />"`)
  })

  test('leaves a logical-or (||) style prop value untouched', () => {
    const source = lines("import { Box } from '@panda/jsx'", "export const el = <Box color={props.color || 'red'} />")

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { Box } from '@panda/jsx'
      export const el = <Box color={props.color || 'red'} />",
      }
    `)
  })

  test('leaves a logical-and (&&) style prop value untouched', () => {
    const source = lines("import { Box } from '@panda/jsx'", "export const el = <Box color={isActive && 'red'} />")

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { Box } from '@panda/jsx'
      export const el = <Box color={isActive && 'red'} />",
      }
    `)
  })

  test('leaves a logical-or className expression untouched', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box className={props.className || \'foo\'} color="red" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect({ changed: result.changed, code: result.code }).toMatchInlineSnapshot(`
      {
        "changed": false,
        "code": "import { Box } from '@panda/jsx'
      export const el = <Box className={props.className || 'foo'} color="red" />",
      }
    `)
  })

  // --- conditionals nested deep inside a style object ---

  test('rewrites two conditionals inside one nested condition block', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box _hover={{ color: a ? 'red' : 'blue', bg: b ? 'black' : 'white' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={(a ? "hover:color_red" : "hover:color_blue") + " " + (b ? "hover:bg_black" : "hover:bg_white")} />"`,
    )
  })

  test('rewrites conditionals in two separate nested condition blocks', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box _hover={{ color: a ? 'red' : 'blue' }} _focus={{ color: c ? 'black' : 'white' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={(a ? "hover:color_red" : "hover:color_blue") + " " + (c ? "focus:color_black" : "focus:color_white")} />"`,
    )
  })

  test('rewrites a conditional two levels deep in a style object', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box _hover={{ _dark: { color: isDark ? 'white' : 'black' } }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={isDark ? "hover:dark:color_white" : "hover:dark:color_black"} />"`,
    )
  })

  test('rewrites conditionals at different nesting depths together', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box color={a ? 'red' : 'blue'} _hover={{ padding: b ? '2' : '4' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={(a ? "color_red" : "color_blue") + " " + (b ? "hover:padding_2" : "hover:padding_4")} />"`,
    )
  })

  test('rewrites a deep conditional in the css prop object', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box css={{ _hover: { color: a ? 'red' : 'blue' } }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={a ? "hover:color_red" : "hover:color_blue"} />"`,
    )
  })

  test('rewrites a static condition block beside a deep conditional', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      "export const el = <Box _focus={{ color: 'green' }} _hover={{ color: a ? 'red' : 'blue' }} />",
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={a ? "focus:color_green hover:color_red" : "focus:color_green hover:color_blue"} />"`,
    )
  })

  // --- attribute value edge cases ---

  test('preserves a brace inside an attribute string value', () => {
    const source = lines("import { Box } from '@panda/jsx'", 'export const el = <Box json={\'}\'} color="red" />')

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div json={'}'} className="color_red" />"`)
  })

  test('preserves quotes inside an attribute value while merging classes', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const el = <Box aria-label={\'Say "hi"\'} color="red" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div aria-label={'Say "hi"'} className="color_red" />"`,
    )
  })

  test('rewrites multiple JSX elements in one file', () => {
    const source = lines(
      "import { Box } from '@panda/jsx'",
      'export const a = <Box color="red" />',
      'export const b = <Box color="blue" padding="4" />',
    )

    const result = styledJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`
      "export const a = <div className="color_red" />
      export const b = <div className="color_blue padding_4" />"
    `)
  })

  // --- panda factory member tags ---

  test('rewrites a self-closing panda.div factory element', () => {
    const source = lines("import { panda } from '@panda/jsx'", 'export const el = <panda.div color="red" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="color_red" />"`)
  })

  test('rewrites a paired panda.span factory element', () => {
    const source = lines(
      "import { panda } from '@panda/jsx'",
      'export const el = <panda.span color="red">label</panda.span>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <span className="color_red">label</span>"`)
  })

  // --- pattern JSX ---

  test('rewrites an HStack pattern element to a div with classes', () => {
    const source = lines("import { HStack } from '@panda/jsx'", 'export const el = <HStack gap="4" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="align-items_center d_flex flex-direction_row gap_4" />"`,
    )
  })

  test('rewrites a Wrap pattern element with multiple static props', () => {
    const source = lines("import { Wrap } from '@panda/jsx'", 'export const el = <Wrap gap="6" justify="center" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="d_flex flex-wrap_wrap gap_6 justify-content_center" />"`,
    )
  })

  test('rewrites a Stack pattern element to a div', () => {
    const source = lines("import { Stack } from '@panda/jsx'", 'export const el = <Stack gap="4" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="d_flex flex-direction_column gap_4" />"`,
    )
  })

  test('merges a css prop into a pattern element', () => {
    const source = lines(
      "import { Stack } from '@panda/jsx'",
      'export const el = <Stack gap="4" css={{ color: \'red\' }} />',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="color_red d_flex flex-direction_column gap_4" />"`,
    )
  })

  test('rewrites a namespaced pattern element (JSX.Stack)', () => {
    const source = lines("import * as JSX from '@panda/jsx'", 'export const el = <JSX.Stack gap="4" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="d_flex flex-direction_column gap_4" />"`,
    )
  })

  test('rewrites a pattern element with a nested conditional style prop', () => {
    const source = lines(
      "import { Stack } from '@panda/jsx'",
      "export const el = <Stack gap=\"4\" _hover={{ _dark: { color: isDark ? 'white' : 'black' } }} />",
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={isDark ? "d_flex flex-direction_column gap_4 hover:dark:color_white" : "d_flex flex-direction_column gap_4 hover:dark:color_black"} />"`,
    )
  })

  // --- recipe JSX ---

  test('rewrites a recipe JSX element to recipe classes', () => {
    const source = lines("import { Button } from '@acme/ui'", 'export const el = <Button size="sm" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="button button--size_sm" />"`)
  })

  test('rewrites a recipe JSX element with leftover style props', () => {
    const source = lines("import { Button } from '@acme/ui'", 'export const el = <Button size="sm" color="red" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="button button--size_sm color_red" />"`,
    )
  })

  test('rewrites a boolean shorthand recipe variant prop', () => {
    const source = lines("import { Button } from '@acme/ui'", 'export const el = <Button size="sm" block />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className="button button--block_true button--size_sm" />"`,
    )
  })

  test('rewrites a recipe JSX element with a nested conditional style prop', () => {
    const source = lines(
      "import { Button } from '@acme/ui'",
      "export const el = <Button size=\"sm\" _hover={{ _dark: { color: isDark ? 'white' : 'black' } }} />",
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(
      `"export const el = <div className={isDark ? "button button--size_sm hover:dark:color_white" : "button button--size_sm hover:dark:color_black"} />"`,
    )
  })

  test('leaves a variant-only slot recipe member for the runtime', () => {
    const source = lines("import { Tabs } from '@acme/ui'", 'export const el = <Tabs.Trigger size="sm" />')

    const result = pandaJsxCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Tabs } from '@acme/ui'
      export const el = <Tabs.Trigger size="sm" />"
    `)
  })
})

// A design system ships its own Button/Tabs/Card and imports them from its own
// package — never from @panda/jsx. Panda still matches these by name to generate
// recipe/atomic CSS (the component applies it internally), but the source
// transform must leave the JSX untouched: rewriting a library component to a
// <div> would swap out the real component and break the app.
describe('compiler.transformSource: component-library tags (not owned by Panda)', () => {
  test('leaves a design-system Button that maps to a recipe by name untouched', () => {
    const source = lines(
      "import { Button } from '@/components/button'",
      'export const SaveButton = () => <Button size="sm">Save</Button>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/save-button.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Button } from '@/components/button'
      export const SaveButton = () => <Button size="sm">Save</Button>"
    `)
  })

  test('leaves a component carrying style props untouched', () => {
    const source = lines(
      "import { Card } from '@/components/card'",
      'export const Panel = () => <Card color="red">Content</Card>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/panel.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Card } from '@/components/card'
      export const Panel = () => <Card color="red">Content</Card>"
    `)
  })

  test('leaves a slot-recipe component from a library untouched', () => {
    const source = lines(
      "import { Tabs } from '@/components/tabs'",
      'export const Nav = () => (',
      '  <Tabs.Root defaultValue="account">',
      '    <Tabs.Trigger value="account">Account</Tabs.Trigger>',
      '  </Tabs.Root>',
      ')',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/nav.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Tabs } from '@/components/tabs'
      export const Nav = () => (
        <Tabs.Root defaultValue="account">
          <Tabs.Trigger value="account">Account</Tabs.Trigger>
        </Tabs.Root>
      )"
    `)
  })

  test('leaves a library component that collides with a pattern name untouched', () => {
    const source = lines(
      "import { HStack } from '@chakra-ui/react'",
      'export const Row = () => <HStack gap="4">items</HStack>',
    )

    const result = pandaJsxCompiler.transformSource({ path: 'src/row.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { HStack } from '@chakra-ui/react'
      export const Row = () => <HStack gap="4">items</HStack>"
    `)
  })
})

// A monorepo can point Panda's jsx importMap at its own package, so those
// exports are treated as owned Panda components. Then — and only then — the
// transform rewrites tags imported from that module.
describe('compiler.transformSource: library module added to the jsx importMap', () => {
  const acmeCompiler = createTransformProject({
    jsxFactory: 'panda',
    jsxFramework: 'react',
    importMap: {
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns'],
      jsx: ['@panda/jsx', '@acme/ui'],
      tokens: ['@panda/tokens'],
    },
    utilities: {
      color: {},
      display: { className: 'd' },
      fontSize: { className: 'fs' },
    },
    theme: {
      recipes: {
        button: {
          className: 'button',
          jsx: ['Button'],
          base: { display: 'inline-flex' },
          defaultVariants: { size: 'md' },
          variants: { size: { sm: { fontSize: '12px' }, md: { fontSize: '16px' } } },
        },
      },
    },
  })

  test('rewrites a Button imported from the mapped module', () => {
    const source = lines("import { Button } from '@acme/ui'", 'export const el = <Button size="sm" />')

    const result = acmeCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.code).toMatchInlineSnapshot(`"export const el = <div className="button button--size_sm" />"`)
  })

  test('leaves the same Button imported from an unmapped module untouched', () => {
    const source = lines("import { Button } from '@other/ui'", 'export const el = <Button size="sm" />')

    const result = acmeCompiler.transformSource({ path: 'src/app.tsx', source })
    expect(result.changed).toBe(false)
    expect(result.code).toMatchInlineSnapshot(`
      "import { Button } from '@other/ui'
      export const el = <Button size="sm" />"
    `)
  })
})
