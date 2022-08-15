import { CSSUtility } from '@css-panda/css-utility'
import { Dictionary } from '@css-panda/dictionary'
import { semanticTokens, tokens, utilities } from '@css-panda/fixture'
import { describe, expect, test } from 'vitest'
import { generatePropertyTypes } from '../src/generator-property-types'

describe('generate property types', () => {
  test('should ', () => {
    expect(
      generatePropertyTypes(
        new CSSUtility({
          tokens: new Dictionary({ tokens, semanticTokens }),
          config: utilities,
        }),
      ),
    ).toMatchInlineSnapshot(`
      "interface PropertyTypes {
      	background: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\";
      	color: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\";
      	aspectRatio: \\"auto\\" | \\"square\\" | \\"video\\";
      	flexBasis: \\"0\\" | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\";
      	flex: \\"1\\" | \\"auto\\" | \\"initial\\" | \\"none\\";
      	fontWeight: \\"normal\\" | \\"medium\\" | \\"semibold\\" | \\"bold\\";
      	letterSpacing: \\"tighter\\" | \\"tight\\" | \\"normal\\" | \\"wide\\" | \\"wider\\" | \\"widest\\";
      	width: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"0.5\\" | \\"-0.5\\" | \\"1.5\\" | \\"-1.5\\" | \\"2.5\\" | \\"-2.5\\" | \\"3.5\\" | \\"-3.5\\" | \\"gutter\\" | \\"-gutter\\" | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\" | \\"2/4\\";
      	maxWidth: \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	marginLeft: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"0.5\\" | \\"-0.5\\" | \\"1.5\\" | \\"-1.5\\" | \\"2.5\\" | \\"-2.5\\" | \\"3.5\\" | \\"-3.5\\" | \\"gutter\\" | \\"-gutter\\";
      	marginRight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"0.5\\" | \\"-0.5\\" | \\"1.5\\" | \\"-1.5\\" | \\"2.5\\" | \\"-2.5\\" | \\"3.5\\" | \\"-3.5\\" | \\"gutter\\" | \\"-gutter\\";
      	marginTop: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"0.5\\" | \\"-0.5\\" | \\"1.5\\" | \\"-1.5\\" | \\"2.5\\" | \\"-2.5\\" | \\"3.5\\" | \\"-3.5\\" | \\"gutter\\" | \\"-gutter\\";
      	marginBottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"0.5\\" | \\"-0.5\\" | \\"1.5\\" | \\"-1.5\\" | \\"2.5\\" | \\"-2.5\\" | \\"3.5\\" | \\"-3.5\\" | \\"gutter\\" | \\"-gutter\\";
      }"
    `)
  })
})
