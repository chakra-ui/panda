import { Utility } from '@pandacss/core'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { semanticTokens, tokens, utilities } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generatePropTypes } from '../src/generators/prop-types'

describe('generate property types', () => {
  test('should ', () => {
    expect(
      generatePropTypes(
        new Utility({
          tokens: new TokenDictionary({ tokens, semanticTokens }),
          config: utilities,
        }),
      ),
    ).toMatchInlineSnapshot(`
      "import { Properties as CSSProperties } from \\"./csstype\\"

      type BasePropTypes  = {
      	divideX: string;
      	divideY: string;
      	divideColor: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	divideStyle: CSSProperties[\\"borderStyle\\"];
      	top: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	left: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	start: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	right: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	end: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	bottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	insetX: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	insetY: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	float: \\"left\\" | \\"right\\" | \\"start\\" | \\"end\\";
      	color: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	fill: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	stroke: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	accentColor: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	outlineColor: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	aspectRatio: \\"auto\\" | \\"square\\" | \\"video\\";
      	gap: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	rowGap: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	columnGap: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	flexBasis: \\"0\\" | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\";
      	flex: \\"1\\" | \\"auto\\" | \\"initial\\" | \\"none\\";
      	padding: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingLeft: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingRight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingTop: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingBottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingX: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	paddingY: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	fontSize: \\"sm\\" | \\"xs\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	fontFamily: \\"heading\\" | \\"body\\" | \\"mono\\";
      	fontWeight: \\"normal\\" | \\"medium\\" | \\"semibold\\" | \\"bold\\";
      	fontSmoothing: \\"antialiased\\" | \\"subpixel-antialiased\\";
      	letterSpacing: \\"tighter\\" | \\"tight\\" | \\"normal\\" | \\"wide\\" | \\"wider\\" | \\"widest\\";
      	lineHeight: \\"normal\\" | \\"none\\" | \\"shorter\\" | \\"short\\" | \\"base\\" | \\"tall\\" | \\"taller\\";
      	textIndent: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	width: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\" | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\" | \\"2/4\\";
      	height: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	minHeight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	maxHeight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	minWidth: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	maxWidth: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"xs\\" | \\"sm\\" | \\"md\\" | \\"lg\\" | \\"xl\\";
      	marginLeft: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	marginRight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	marginTop: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	marginBottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	margin: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	marginX: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	marginY: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	background: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	backgroundColor: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	backgroundGradient: \\"none\\" | \\"to-t\\" | \\"to-tr\\" | \\"to-r\\" | \\"to-br\\" | \\"to-b\\" | \\"to-bl\\" | \\"to-l\\" | \\"to-tl\\";
      	gradientFrom: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	gradientTo: \\"current\\" | \\"gray.50\\" | \\"gray.100\\" | \\"gray.200\\" | \\"gray.300\\" | \\"gray.400\\" | \\"gray.500\\" | \\"gray.600\\" | \\"gray.700\\" | \\"gray.800\\" | \\"gray.900\\" | \\"gray.deep.test.yam\\" | \\"gray.deep.test.pool.poller\\" | \\"gray.deep.test.pool.tall\\" | \\"green.50\\" | \\"green.100\\" | \\"green.200\\" | \\"green.300\\" | \\"green.400\\" | \\"green.500\\" | \\"green.600\\" | \\"green.700\\" | \\"green.800\\" | \\"green.900\\" | \\"red.50\\" | \\"red.100\\" | \\"red.200\\" | \\"red.300\\" | \\"red.400\\" | \\"red.500\\" | \\"red.600\\" | \\"red.700\\" | \\"red.800\\" | \\"red.900\\" | \\"primary\\" | \\"secondary\\" | \\"complex\\" | \\"surface\\" | \\"button.thick\\" | \\"button.card.body\\" | \\"button.card.heading\\" | \\"colorPalette.50\\" | \\"colorPalette.100\\" | \\"colorPalette.200\\" | \\"colorPalette.300\\" | \\"colorPalette.400\\" | \\"colorPalette.500\\" | \\"colorPalette.600\\" | \\"colorPalette.700\\" | \\"colorPalette.800\\" | \\"colorPalette.900\\" | \\"colorPalette.yam\\" | \\"colorPalette.poller\\" | \\"colorPalette.tall\\" | \\"colorPalette.thick\\" | \\"colorPalette.body\\" | \\"colorPalette.heading\\";
      	transitionTimingFunction: \\"ease-in\\" | \\"ease-out\\" | \\"ease-in-out\\";
      	transitionProperty: \\"all\\" | \\"none\\" | \\"opacity\\" | \\"shadow\\" | \\"transform\\" | \\"base\\" | \\"background\\" | \\"colors\\";
      	animation: \\"none\\" | \\"spin\\" | \\"ping\\" | \\"pulse\\" | \\"bounce\\";
      	borderRadius: \\"none\\" | \\"sm\\" | \\"base\\" | \\"md\\" | \\"lg\\" | \\"xl\\" | \\"2xl\\" | \\"3xl\\" | \\"full\\";
      	boxShadow: \\"xs\\" | \\"sm\\" | \\"base\\" | \\"md\\";
      	filter: \\"auto\\";
      	blur: string | number;
      	scrollMargin: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginX: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginY: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginLeft: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginRight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginTop: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollMarginBottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPadding: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingX: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingY: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingLeft: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingRight: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingTop: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollPaddingBottom: \\"1\\" | \\"2\\" | \\"3\\" | \\"4\\" | \\"5\\" | \\"6\\" | \\"0.5\\" | \\"1.5\\" | \\"2.5\\" | \\"3.5\\" | \\"gutter\\" | \\"-1\\" | \\"-2\\" | \\"-3\\" | \\"-4\\" | \\"-5\\" | \\"-6\\" | \\"-0.5\\" | \\"-1.5\\" | \\"-2.5\\" | \\"-3.5\\" | \\"-gutter\\";
      	scrollSnapType: \\"none\\" | \\"x\\" | \\"y\\" | \\"both\\";
      	scrollSnapStrictness: \\"mandatory\\" | \\"proximity\\";
      	srOnly: \\"true\\" | \\"false\\";
      	colorPalette: \\"gray\\" | \\"gray.deep.test\\" | \\"gray.deep.test.pool\\" | \\"green\\" | \\"red\\" | \\"button\\" | \\"button.card\\";
      }



        type CssProp<T> = T extends keyof CSSProperties ? CSSProperties[T] : (string & {})
        
        type BaseProp<T> = T extends keyof BasePropTypes ? BasePropTypes[T] : (string & {})
        
        type Shorthand<T> = CssProp<T> | BaseProp<T>
         
        export type PropTypes = BasePropTypes & {
        
      	z: Shorthand<\\"zIndex\\">;
      	objectPos: Shorthand<\\"objectPosition\\">;
      	overscroll: Shorthand<\\"overscrollBehavior\\">;
      	overscrollX: Shorthand<\\"overscrollBehaviorX\\">;
      	overscrollY: Shorthand<\\"overscrollBehaviorY\\">;
      	pos: Shorthand<\\"position\\">;
      	flexDir: Shorthand<\\"flexDirection\\">;
      	p: Shorthand<\\"padding\\">;
      	pl: Shorthand<\\"paddingLeft\\">;
      	pr: Shorthand<\\"paddingRight\\">;
      	pt: Shorthand<\\"paddingTop\\">;
      	pb: Shorthand<\\"paddingBottom\\">;
      	px: Shorthand<\\"paddingX\\">;
      	py: Shorthand<\\"paddingY\\">;
      	w: Shorthand<\\"width\\">;
      	h: Shorthand<\\"height\\">;
      	minH: Shorthand<\\"minHeight\\">;
      	maxH: Shorthand<\\"maxHeight\\">;
      	minW: Shorthand<\\"minWidth\\">;
      	maxW: Shorthand<\\"maxWidth\\">;
      	ml: Shorthand<\\"marginLeft\\">;
      	mr: Shorthand<\\"marginRight\\">;
      	mt: Shorthand<\\"marginTop\\">;
      	mb: Shorthand<\\"marginBottom\\">;
      	m: Shorthand<\\"margin\\">;
      	mx: Shorthand<\\"marginX\\">;
      	my: Shorthand<\\"marginY\\">;
      	bgAttachment: Shorthand<\\"backgroundAttachment\\">;
      	bgClip: Shorthand<\\"backgroundClip\\">;
      	bg: Shorthand<\\"background\\">;
      	bgColor: Shorthand<\\"backgroundColor\\">;
      	bgOrigin: Shorthand<\\"backgroundOrigin\\">;
      	bgRepeat: Shorthand<\\"backgroundRepeat\\">;
      	bgBlend: Shorthand<\\"backgroundBlendMode\\">;
      	bgGradient: Shorthand<\\"backgroundGradient\\">;
      	shadow: Shorthand<\\"boxShadow\\">;
      }"
    `)
  })
})
