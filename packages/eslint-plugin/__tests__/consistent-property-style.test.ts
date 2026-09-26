import { createPandaRuleTester, withCss } from './panda-rule-tester'

const ruleTester = await createPandaRuleTester(`export default {
  outdir: 'styled-system',
  jsxFramework: 'react',
  importMap: { css: ['@panda/css'], jsx: ['@panda/jsx'] },
  theme: { tokens: { colors: { red: { 500: { value: '#f00' } } }, spacing: { 4: { value: '1rem' } } } },
  utilities: {
    color: { className: 'c', values: 'colors' },
    margin: { className: 'm', shorthand: 'm' },
    marginLeft: { className: 'ml', shorthand: 'ml' },
    padding: { className: 'p', shorthand: 'p' },
  },
}`)

ruleTester.run('consistent-property-style', {
  valid: [
    // Default `longhand`: canonical names and alias-less props are fine.
    { filename: 'app.tsx', code: withCss("css({ marginLeft: '4', color: 'red.500' })") },
    // `shorthand`: a prop already in alias form is fine.
    { filename: 'app.tsx', code: withCss("css({ ml: '4' })"), options: [{ style: 'shorthand' }] },
    // `ignore` exempts a specific property.
    { filename: 'app.tsx', code: withCss("css({ ml: '4' })"), options: [{ ignore: ['ml'] }] },
  ],
  invalid: [
    // Default `longhand`: alias rewritten to its canonical name.
    {
      filename: 'app.tsx',
      code: withCss("css({ ml: '4' })"),
      output: withCss("css({ marginLeft: '4' })"),
      errors: [{ message: 'Use the longhand "marginLeft" instead of "ml".' }],
    },
    // `shorthand`: canonical name rewritten to its alias.
    {
      filename: 'app.tsx',
      code: withCss("css({ marginLeft: '4' })"),
      output: withCss("css({ ml: '4' })"),
      options: [{ style: 'shorthand' }],
      errors: [{ message: 'Use the shorthand "ml" instead of "marginLeft".' }],
    },
    {
      filename: 'app.tsx',
      code: withCss("css({ margin: '4' })"),
      output: withCss("css({ m: '4' })"),
      options: [{ style: 'shorthand' }],
      errors: [{ message: 'Use the shorthand "m" instead of "margin".' }],
    },
    // JSX style props are rewritten the same way.
    {
      filename: 'app.tsx',
      code: ["import { styled } from '@panda/jsx'", "const A = () => <styled.div marginLeft='4' />"].join('\n'),
      output: ["import { styled } from '@panda/jsx'", "const A = () => <styled.div ml='4' />"].join('\n'),
      options: [{ style: 'shorthand' }],
      errors: [{ message: 'Use the shorthand "ml" instead of "marginLeft".' }],
    },
  ],
})
