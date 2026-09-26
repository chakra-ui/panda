import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  importMap: { css: ['@panda/css'] },
  theme: { tokens: { colors: { red: { 500: { value: '#f00' } } } } },
  utilities: { color: { className: 'c', values: 'colors' } },
  conditions: { hover: '&:hover' },
}`)

const message = (name: string) =>
  `Nested selector "${name}" has no "&", so Panda ignores it. Use "&${name}" or a condition like "_hover".`

ruleTester.run('no-invalid-nesting', {
  valid: [
    // Proper `&` selector.
    { filename: 'app.tsx', code: withCss("css({ '&:hover': { color: 'red.500' } })") },
    // Panda condition.
    { filename: 'app.tsx', code: withCss("css({ _hover: { color: 'red.500' } })") },
    // At-rule.
    { filename: 'app.tsx', code: withCss("css({ '@media (min-width: 700px)': { color: 'red.500' } })") },
    // A per-prop condition object on a normal property is not nesting.
    { filename: 'app.tsx', code: withCss("css({ color: { base: 'red.500' } })") },
  ],
  invalid: [
    // Pseudo without `&`, with a quick-fix suggestion.
    {
      filename: 'app.tsx',
      code: withCss("css({ ':hover': { color: 'red.500' } })"),
      errors: [
        {
          message: message(':hover'),
          suggestions: [
            { desc: 'Prefix with "&" → "&:hover"', output: withCss("css({ '&:hover': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Class selector without `&`.
    {
      filename: 'app.tsx',
      code: withCss("css({ '.foo': { color: 'red.500' } })"),
      errors: [
        {
          message: message('.foo'),
          suggestions: [
            { desc: 'Prefix with "&" → "&.foo"', output: withCss("css({ '&.foo': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Combinator without `&`.
    {
      filename: 'app.tsx',
      code: withCss("css({ '> div': { color: 'red.500' } })"),
      errors: [
        {
          message: message('> div'),
          suggestions: [
            { desc: 'Prefix with "&" → "&> div"', output: withCss("css({ '&> div': { color: 'red.500' } })") },
          ],
        },
      ],
    },
    // Inside a recipe (cva) base — surfaces as a recipe-variant entry.
    {
      filename: 'app.tsx',
      code: ["import { cva } from '@panda/css'", "cva({ base: { ':hover': { color: 'red.500' } } })"].join('\n'),
      errors: [
        {
          message: message(':hover'),
          suggestions: [
            {
              desc: 'Prefix with "&" → "&:hover"',
              output: ["import { cva } from '@panda/css'", "cva({ base: { '&:hover': { color: 'red.500' } } })"].join(
                '\n',
              ),
            },
          ],
        },
      ],
    },
  ],
})
