import { describe, expect, test } from 'vitest'
import { generatePropTypes } from '../src/artifacts/types/prop-types'
import { generator } from './fixture'

describe('generate property types', () => {
  test('should ', () => {
    expect(generatePropTypes(generator)).toMatchInlineSnapshot(`
      "import type { ConditionalValue } from './conditions';
      import type { CssProperties } from './system-types'
      import type { Tokens } from './tokens'

      type PropertyValueTypes  = {
      	divideX: string;
      	divideY: string;
      	divideColor: Tokens[\\"colors\\"];
      	divideStyle: CssProperties[\\"borderStyle\\"];
      	top: Tokens[\\"spacing\\"];
      	left: Tokens[\\"spacing\\"];
      	start: Tokens[\\"spacing\\"];
      	right: Tokens[\\"spacing\\"];
      	end: Tokens[\\"spacing\\"];
      	bottom: Tokens[\\"spacing\\"];
      	insetX: Tokens[\\"spacing\\"];
      	insetY: Tokens[\\"spacing\\"];
      	float: \\"left\\" | \\"right\\" | \\"start\\" | \\"end\\";
      	color: Tokens[\\"colors\\"];
      	fill: Tokens[\\"colors\\"];
      	stroke: Tokens[\\"colors\\"];
      	accentColor: Tokens[\\"colors\\"];
      	outlineColor: Tokens[\\"colors\\"];
      	aspectRatio: \\"auto\\" | \\"square\\" | \\"video\\";
      	gap: Tokens[\\"spacing\\"];
      	rowGap: Tokens[\\"spacing\\"];
      	columnGap: Tokens[\\"spacing\\"];
      	flexBasis: \\"0\\" | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\";
      	flex: \\"1\\" | \\"auto\\" | \\"initial\\" | \\"none\\";
      	padding: Tokens[\\"spacing\\"];
      	paddingLeft: Tokens[\\"spacing\\"];
      	paddingRight: Tokens[\\"spacing\\"];
      	paddingTop: Tokens[\\"spacing\\"];
      	paddingBottom: Tokens[\\"spacing\\"];
      	paddingX: Tokens[\\"spacing\\"];
      	paddingY: Tokens[\\"spacing\\"];
      	fontSize: Tokens[\\"fontSizes\\"];
      	fontFamily: Tokens[\\"fonts\\"];
      	fontWeight: Tokens[\\"fontWeights\\"];
      	fontSmoothing: \\"antialiased\\" | \\"subpixel-antialiased\\";
      	letterSpacing: Tokens[\\"letterSpacings\\"];
      	lineHeight: Tokens[\\"lineHeights\\"];
      	textIndent: Tokens[\\"spacing\\"];
      	width: Tokens[\\"sizes\\"] | \\"1/2\\" | \\"1/3\\" | \\"2/3\\" | \\"1/4\\" | \\"2/4\\";
      	height: Tokens[\\"sizes\\"];
      	minHeight: Tokens[\\"sizes\\"];
      	maxHeight: Tokens[\\"sizes\\"];
      	minWidth: Tokens[\\"sizes\\"];
      	maxWidth: Tokens[\\"sizes\\"];
      	marginLeft: Tokens[\\"spacing\\"];
      	marginRight: Tokens[\\"spacing\\"];
      	marginTop: Tokens[\\"spacing\\"];
      	marginBottom: Tokens[\\"spacing\\"];
      	margin: Tokens[\\"spacing\\"];
      	marginX: Tokens[\\"spacing\\"];
      	marginY: Tokens[\\"spacing\\"];
      	background: Tokens[\\"colors\\"];
      	backgroundColor: Tokens[\\"colors\\"];
      	backgroundGradient: \\"none\\" | \\"to-t\\" | \\"to-tr\\" | \\"to-r\\" | \\"to-br\\" | \\"to-b\\" | \\"to-bl\\" | \\"to-l\\" | \\"to-tl\\";
      	gradientFrom: Tokens[\\"colors\\"];
      	gradientTo: Tokens[\\"colors\\"];
      	transitionTimingFunction: Tokens[\\"easings\\"];
      	transitionProperty: \\"all\\" | \\"none\\" | \\"opacity\\" | \\"shadow\\" | \\"transform\\" | \\"base\\" | \\"background\\" | \\"colors\\";
      	animation: Tokens[\\"animations\\"];
      	borderRadius: Tokens[\\"radii\\"];
      	boxShadow: Tokens[\\"shadows\\"];
      	filter: \\"auto\\";
      	blur: string | number;
      	scrollMargin: Tokens[\\"spacing\\"];
      	scrollMarginX: Tokens[\\"spacing\\"];
      	scrollMarginY: Tokens[\\"spacing\\"];
      	scrollMarginLeft: Tokens[\\"spacing\\"];
      	scrollMarginRight: Tokens[\\"spacing\\"];
      	scrollMarginTop: Tokens[\\"spacing\\"];
      	scrollMarginBottom: Tokens[\\"spacing\\"];
      	scrollPadding: Tokens[\\"spacing\\"];
      	scrollPaddingX: Tokens[\\"spacing\\"];
      	scrollPaddingY: Tokens[\\"spacing\\"];
      	scrollPaddingLeft: Tokens[\\"spacing\\"];
      	scrollPaddingRight: Tokens[\\"spacing\\"];
      	scrollPaddingTop: Tokens[\\"spacing\\"];
      	scrollPaddingBottom: Tokens[\\"spacing\\"];
      	scrollSnapType: \\"none\\" | \\"x\\" | \\"y\\" | \\"both\\";
      	scrollSnapStrictness: \\"mandatory\\" | \\"proximity\\";
      	srOnly: \\"true\\" | \\"false\\";
      	colorPalette: \\"gray\\" | \\"gray.deep.test\\" | \\"gray.deep.test.pool\\" | \\"green\\" | \\"red\\" | \\"button\\" | \\"button.card\\";
      }



        type CssValue<T> = T extends keyof CssProperties ? CssProperties[T] : never

        type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T] | CssValue<T> : CssValue<T>

        export type PropertyTypes = PropertyValueTypes & {
        
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
      }

      export type PropertyValue<T extends string> = T extends keyof PropertyTypes
        ? ConditionalValue<PropertyTypes[T] | CssValue<T>>
        : T extends keyof CssProperties
        ? ConditionalValue<CssProperties[T]>
        : ConditionalValue<string | number>"
    `)
  })
})
