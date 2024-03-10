import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generatePropTypes } from '../src/artifacts/types/prop-types'

describe('generate property types', () => {
  test('should ', () => {
    expect(generatePropTypes(createContext())).toMatchInlineSnapshot(`
      "import type { Conditional } from './conditions';
      import type { CssProperties } from './system-types';
      import type { Tokens } from '../tokens/index';

      interface UtilityValues {
      	aspectRatio: Tokens["aspectRatios"];
      	top: Tokens["spacing"];
      	left: Tokens["spacing"];
      	insetInline: Tokens["spacing"];
      	insetBlock: Tokens["spacing"];
      	inset: "auto" | Tokens["spacing"];
      	insetBlockEnd: Tokens["spacing"];
      	insetBlockStart: Tokens["spacing"];
      	insetInlineEnd: Tokens["spacing"];
      	insetInlineStart: Tokens["spacing"];
      	right: Tokens["spacing"];
      	bottom: Tokens["spacing"];
      	float: "left" | "right" | "start" | "end";
      	hideFrom: Tokens["breakpoints"];
      	hideBelow: Tokens["breakpoints"];
      	flexBasis: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "full";
      	flex: "1" | "auto" | "initial" | "none";
      	gridTemplateColumns: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";
      	gridTemplateRows: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";
      	gridColumn: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "full";
      	gridRow: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12" | "full";
      	gridAutoColumns: "min" | "max" | "fr";
      	gridAutoRows: "min" | "max" | "fr";
      	gap: Tokens["spacing"];
      	gridGap: Tokens["spacing"];
      	gridRowGap: Tokens["spacing"];
      	gridColumnGap: Tokens["spacing"];
      	rowGap: Tokens["spacing"];
      	columnGap: Tokens["spacing"];
      	padding: Tokens["spacing"];
      	paddingLeft: Tokens["spacing"];
      	paddingRight: Tokens["spacing"];
      	paddingTop: Tokens["spacing"];
      	paddingBottom: Tokens["spacing"];
      	paddingBlock: Tokens["spacing"];
      	paddingBlockEnd: Tokens["spacing"];
      	paddingBlockStart: Tokens["spacing"];
      	paddingInline: Tokens["spacing"];
      	paddingInlineEnd: Tokens["spacing"];
      	paddingInlineStart: Tokens["spacing"];
      	marginLeft: "auto" | Tokens["spacing"];
      	marginRight: "auto" | Tokens["spacing"];
      	marginTop: "auto" | Tokens["spacing"];
      	marginBottom: "auto" | Tokens["spacing"];
      	margin: "auto" | Tokens["spacing"];
      	marginBlock: "auto" | Tokens["spacing"];
      	marginBlockEnd: "auto" | Tokens["spacing"];
      	marginBlockStart: "auto" | Tokens["spacing"];
      	marginInline: "auto" | Tokens["spacing"];
      	marginInlineEnd: "auto" | Tokens["spacing"];
      	marginInlineStart: "auto" | Tokens["spacing"];
      	outlineColor: Tokens["colors"];
      	outline: Tokens["borders"];
      	outlineOffset: Tokens["spacing"];
      	divideX: string;
      	divideY: string;
      	divideColor: Tokens["colors"];
      	divideStyle: CssProperties["borderStyle"];
      	width: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	inlineSize: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	minWidth: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	minInlineSize: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	maxWidth: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	maxInlineSize: "auto" | Tokens["sizes"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6" | "1/12" | "2/12" | "3/12" | "4/12" | "5/12" | "6/12" | "7/12" | "8/12" | "9/12" | "10/12" | "11/12" | "screen";
      	height: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	blockSize: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	minHeight: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	minBlockSize: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	maxHeight: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	maxBlockSize: "auto" | Tokens["sizes"] | "svh" | "lvh" | "dvh" | "screen" | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "1/5" | "2/5" | "3/5" | "4/5" | "1/6" | "2/6" | "3/6" | "4/6" | "5/6";
      	color: Tokens["colors"];
      	fontFamily: Tokens["fonts"];
      	fontSize: Tokens["fontSizes"];
      	fontWeight: Tokens["fontWeights"];
      	fontSmoothing: "antialiased" | "subpixel-antialiased";
      	letterSpacing: Tokens["letterSpacings"];
      	lineHeight: Tokens["lineHeights"];
      	textDecorationColor: Tokens["colors"];
      	textEmphasisColor: Tokens["colors"];
      	textIndent: Tokens["spacing"];
      	textShadow: Tokens["shadows"];
      	textShadowColor: Tokens["colors"];
      	textWrap: "wrap" | "balance" | "nowrap";
      	truncate: boolean;
      	background: Tokens["colors"];
      	backgroundColor: Tokens["colors"];
      	backgroundGradient: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
      	textGradient: "to-t" | "to-tr" | "to-r" | "to-br" | "to-b" | "to-bl" | "to-l" | "to-tl";
      	gradientFrom: Tokens["colors"];
      	gradientTo: Tokens["colors"];
      	gradientVia: Tokens["colors"];
      	borderRadius: Tokens["radii"];
      	borderTopLeftRadius: Tokens["radii"];
      	borderTopRightRadius: Tokens["radii"];
      	borderBottomRightRadius: Tokens["radii"];
      	borderBottomLeftRadius: Tokens["radii"];
      	borderTopRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	borderRightRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	borderBottomRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	borderLeftRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	borderStartStartRadius: Tokens["radii"];
      	borderStartEndRadius: Tokens["radii"];
      	borderStartRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	borderEndStartRadius: Tokens["radii"];
      	borderEndEndRadius: Tokens["radii"];
      	borderEndRadius: Tokens["radii"] | CssProperties["borderRadius"];
      	border: Tokens["borders"];
      	borderColor: Tokens["colors"];
      	borderInline: Tokens["borders"];
      	borderInlineColor: Tokens["colors"];
      	borderBlock: Tokens["borders"];
      	borderBlockColor: Tokens["colors"];
      	borderLeft: Tokens["borders"];
      	borderLeftColor: Tokens["colors"];
      	borderInlineStart: Tokens["borders"];
      	borderInlineStartColor: Tokens["colors"];
      	borderRight: Tokens["borders"];
      	borderRightColor: Tokens["colors"];
      	borderInlineEnd: Tokens["borders"];
      	borderInlineEndColor: Tokens["colors"];
      	borderTop: Tokens["borders"];
      	borderTopColor: Tokens["colors"];
      	borderBottom: Tokens["borders"];
      	borderBottomColor: Tokens["colors"];
      	borderBlockEnd: Tokens["borders"];
      	borderBlockEndColor: Tokens["colors"];
      	borderBlockStart: Tokens["borders"];
      	borderBlockStartColor: Tokens["colors"];
      	boxShadow: Tokens["shadows"];
      	boxShadowColor: Tokens["colors"];
      	filter: "auto";
      	blur: Tokens["blurs"];
      	backdropFilter: "auto";
      	backdropBlur: Tokens["blurs"];
      	borderSpacing: Tokens["spacing"];
      	borderSpacingX: Tokens["spacing"];
      	borderSpacingY: Tokens["spacing"];
      	transitionTimingFunction: Tokens["easings"];
      	transitionDelay: Tokens["durations"];
      	transitionDuration: Tokens["durations"];
      	transition: "all" | "common" | "background" | "colors" | "opacity" | "shadow" | "transform";
      	animation: Tokens["animations"];
      	animationDelay: Tokens["durations"];
      	scale: "auto" | CssProperties["scale"];
      	translate: "auto" | CssProperties["translate"];
      	translateX: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "full" | "-1/2" | "-1/3" | "-2/3" | "-1/4" | "-2/4" | "-3/4" | "-full";
      	translateY: Tokens["spacing"] | "1/2" | "1/3" | "2/3" | "1/4" | "2/4" | "3/4" | "full" | "-1/2" | "-1/3" | "-2/3" | "-1/4" | "-2/4" | "-3/4" | "-full";
      	accentColor: Tokens["colors"];
      	caretColor: Tokens["colors"];
      	scrollbar: "visible" | "hidden";
      	scrollMargin: Tokens["spacing"];
      	scrollMarginLeft: Tokens["spacing"];
      	scrollMarginRight: Tokens["spacing"];
      	scrollMarginTop: Tokens["spacing"];
      	scrollMarginBottom: Tokens["spacing"];
      	scrollMarginBlock: Tokens["spacing"];
      	scrollMarginBlockEnd: Tokens["spacing"];
      	scrollMarginBlockStart: Tokens["spacing"];
      	scrollMarginInline: Tokens["spacing"];
      	scrollMarginInlineEnd: Tokens["spacing"];
      	scrollMarginInlineStart: Tokens["spacing"];
      	scrollPadding: Tokens["spacing"];
      	scrollPaddingBlock: Tokens["spacing"];
      	scrollPaddingBlockStart: Tokens["spacing"];
      	scrollPaddingBlockEnd: Tokens["spacing"];
      	scrollPaddingInline: Tokens["spacing"];
      	scrollPaddingInlineEnd: Tokens["spacing"];
      	scrollPaddingInlineStart: Tokens["spacing"];
      	scrollPaddingLeft: Tokens["spacing"];
      	scrollPaddingRight: Tokens["spacing"];
      	scrollPaddingTop: Tokens["spacing"];
      	scrollPaddingBottom: Tokens["spacing"];
      	scrollSnapType: "none" | "x" | "y" | "both";
      	scrollSnapStrictness: "mandatory" | "proximity";
      	scrollSnapMargin: Tokens["spacing"];
      	scrollSnapMarginTop: Tokens["spacing"];
      	scrollSnapMarginBottom: Tokens["spacing"];
      	scrollSnapMarginLeft: Tokens["spacing"];
      	scrollSnapMarginRight: Tokens["spacing"];
      	fill: Tokens["colors"];
      	stroke: Tokens["colors"];
      	srOnly: boolean;
      	debug: boolean;
      	containerName: CssProperties["containerName"];
      	colorPalette: "current" | "black" | "white" | "transparent" | "rose" | "pink" | "fuchsia" | "purple" | "violet" | "indigo" | "blue" | "sky" | "cyan" | "teal" | "emerald" | "green" | "lime" | "yellow" | "amber" | "orange" | "red" | "neutral" | "stone" | "zinc" | "gray" | "slate" | "deep" | "deep.test" | "deep.test.pool" | "primary" | "secondary" | "complex" | "button" | "button.card" | "surface";
      	textStyle: "headline.h1" | "headline.h2";
      }



      export type WithEscapeHatch<T> = T | \`[\${string}]\`

      export type OnlyKnown<Key, Value> = Value extends boolean
        ? Value
        : Value extends \`\${infer _}\` ? Value : never"
    `)
  })

  test('with globalVars', () => {
    expect(
      generatePropTypes(
        createContext({
          hooks: {
            'config:resolved': ({ config, utils }) => {
              return utils.omit(config, ['utilities', 'theme.tokens', 'theme.semanticTokens'])
            },
          },
          globalVars: {
            '--random-color': 'red',
            '--button-color': {
              syntax: '<color>',
              inherits: false,
              initialValue: 'blue',
            },
          },
        }),
      ),
    ).toMatchInlineSnapshot(`
      "import type { ConditionalValue } from './conditions';
      import type { CssProperties } from './system-types';
      import type { Tokens } from '../tokens/index';

      interface PropertyValueTypes {
      	colorPalette: string;
      	textStyle: "headline.h1" | "headline.h2";
      }



        type CssValue<T> = T extends keyof CssProperties ? CssProperties[T] : never

        type Shorthand<T> = T extends keyof PropertyValueTypes ? PropertyValueTypes[T] | CssValue<T> : CssValue<T>

        export interface PropertyTypes extends PropertyValueTypes {

      }

      type CssVars = "var(--random-color)" | "var(--button-color)"

      type StrictableProps =
        | 'alignContent'
        | 'alignItems'
        | 'alignSelf'
        | 'all'
        | 'animationComposition'
        | 'animationDirection'
        | 'animationFillMode'
        | 'appearance'
        | 'backfaceVisibility'
        | 'backgroundAttachment'
        | 'backgroundClip'
        | 'borderCollapse'
        | 'borderBlockEndStyle'
        | 'borderBlockStartStyle'
        | 'borderBlockStyle'
        | 'borderBottomStyle'
        | 'borderInlineEndStyle'
        | 'borderInlineStartStyle'
        | 'borderInlineStyle'
        | 'borderLeftStyle'
        | 'borderRightStyle'
        | 'borderTopStyle'
        | 'boxDecorationBreak'
        | 'boxSizing'
        | 'breakAfter'
        | 'breakBefore'
        | 'breakInside'
        | 'captionSide'
        | 'clear'
        | 'columnFill'
        | 'columnRuleStyle'
        | 'contentVisibility'
        | 'direction'
        | 'display'
        | 'emptyCells'
        | 'flexDirection'
        | 'flexWrap'
        | 'float'
        | 'fontKerning'
        | 'forcedColorAdjust'
        | 'isolation'
        | 'lineBreak'
        | 'mixBlendMode'
        | 'objectFit'
        | 'outlineStyle'
        | 'overflow'
        | 'overflowX'
        | 'overflowY'
        | 'overflowBlock'
        | 'overflowInline'
        | 'overflowWrap'
        | 'pointerEvents'
        | 'position'
        | 'resize'
        | 'scrollBehavior'
        | 'touchAction'
        | 'transformBox'
        | 'transformStyle'
        | 'userSelect'
        | 'visibility'
        | 'wordBreak'
        | 'writingMode'

      type WithColorOpacityModifier<T> = T extends string ? \`\${T}/\${string}\` : T
      type WithEscapeHatch<T> = T | \`[\${string}]\` | \`\${T}/{string}\` | WithColorOpacityModifier<T>

      type FilterVagueString<Key, Value> = Value extends boolean
        ? Value
        : Key extends StrictableProps
          ? Value extends \`\${infer _}\` ? Value : never
          : Value

      type PropOrCondition<Key, Value> = ConditionalValue<Value | (string & {}) | CssVars>

      type PropertyTypeValue<T extends string> = T extends keyof PropertyTypes
        ? PropOrCondition<T, PropertyTypes[T] | CssValue<T>>
        : never;

      type CssPropertyValue<T extends string> = T extends keyof CssProperties
        ? PropOrCondition<T, CssProperties[T]>
        : never;

      export type PropertyValue<T extends string> = T extends keyof PropertyTypes
        ? PropertyTypeValue<T>
        : T extends keyof CssProperties
          ? CssPropertyValue<T>
          : PropOrCondition<T, string | number>"
    `)
  })
})
