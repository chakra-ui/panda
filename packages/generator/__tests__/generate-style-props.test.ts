import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateStyleProps } from '../src/artifacts/types/style-props'

describe('generate property types', () => {
  test('should ', () => {
    expect(generateStyleProps(createContext())).toMatchInlineSnapshot(`
      "import type { ConditionalValue } from './conditions';
      import type { OnlyKnown, UtilityValues, WithEscapeHatch } from './prop-type';
      import type { CssProperties } from './system-types';
      import type { Token } from '../tokens/index';

      type AnyString = (string & {})
      type CssVars = \`var(--\${string})\`
      type CssVarValue = ConditionalValue<Token | AnyString | (number & {})>

      type CssVarName =  | AnyString
      type CssVarKeys = \`--\${CssVarName}\`

      export type CssVarProperties = {
        [key in CssVarKeys]?: CssVarValue
      }

      export interface SystemProperties {
         /**
         * The **\`appearance\`** CSS property is used to control native appearance of UI controls, that are based on operating system's theme.
         *
         * **Syntax**: \`none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button\`
         *
         * **Initial value**: \`none\` (but this value is overridden in the user agent CSS)
         */
      WebkitAppearance?: ConditionalValue<CssProperties["WebkitAppearance"] | AnyString>
       /**
         * The **\`-webkit-border-before\`** CSS property is a shorthand property for setting the individual logical block start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-width'> || <'border-style'> || <color>\`
         */
      WebkitBorderBefore?: ConditionalValue<CssProperties["WebkitBorderBefore"] | AnyString>
       /**
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitBorderBeforeColor?: ConditionalValue<CssProperties["WebkitBorderBeforeColor"] | AnyString>
       /**
         * **Syntax**: \`<'border-style'>\`
         *
         * **Initial value**: \`none\`
         */
      WebkitBorderBeforeStyle?: ConditionalValue<CssProperties["WebkitBorderBeforeStyle"] | AnyString>
       /**
         * **Syntax**: \`<'border-width'>\`
         *
         * **Initial value**: \`medium\`
         */
      WebkitBorderBeforeWidth?: ConditionalValue<CssProperties["WebkitBorderBeforeWidth"] | AnyString>
       /**
         * The **\`-webkit-box-reflect\`** CSS property lets you reflect the content of an element in one specific direction.
         *
         * **Syntax**: \`[ above | below | right | left ]? <length>? <image>?\`
         *
         * **Initial value**: \`none\`
         */
      WebkitBoxReflect?: ConditionalValue<CssProperties["WebkitBoxReflect"] | AnyString>
       /**
         * The **\`-webkit-line-clamp\`** CSS property allows limiting of the contents of a block to the specified number of lines.
         *
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      WebkitLineClamp?: ConditionalValue<CssProperties["WebkitLineClamp"] | AnyString>
       /**
         * The **\`mask\`** CSS shorthand property hides an element (partially or fully) by masking or clipping the image at specific points.
         *
         * **Syntax**: \`[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#\`
         */
      WebkitMask?: ConditionalValue<CssProperties["WebkitMask"] | AnyString>
       /**
         * If a \`mask-image\` is specified, \`-webkit-mask-attachment\` determines whether the mask image's position is fixed within the viewport, or scrolls along with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         */
      WebkitMaskAttachment?: ConditionalValue<CssProperties["WebkitMaskAttachment"] | AnyString>
       /**
         * The **\`mask-clip\`** CSS property determines the area which is affected by a mask. The painted content of an element must be restricted to this area.
         *
         * **Syntax**: \`[ <box> | border | padding | content | text ]#\`
         *
         * **Initial value**: \`border\`
         */
      WebkitMaskClip?: ConditionalValue<CssProperties["WebkitMaskClip"] | AnyString>
       /**
         * The **\`-webkit-mask-composite\`** property specifies the manner in which multiple mask images applied to the same element are composited with one another. Mask images are composited in the opposite order that they are declared with the \`-webkit-mask-image\` property.
         *
         * **Syntax**: \`<composite-style>#\`
         *
         * **Initial value**: \`source-over\`
         */
      WebkitMaskComposite?: ConditionalValue<CssProperties["WebkitMaskComposite"] | AnyString>
       /**
         * The **\`mask-image\`** CSS property sets the image that is used as mask layer for an element. By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. This can be controlled with the \`mask-mode\` property.
         *
         * **Syntax**: \`<mask-reference>#\`
         *
         * **Initial value**: \`none\`
         */
      WebkitMaskImage?: ConditionalValue<CssProperties["WebkitMaskImage"] | AnyString>
       /**
         * The **\`mask-origin\`** CSS property sets the origin of a mask.
         *
         * **Syntax**: \`[ <box> | border | padding | content ]#\`
         *
         * **Initial value**: \`padding\`
         */
      WebkitMaskOrigin?: ConditionalValue<CssProperties["WebkitMaskOrigin"] | AnyString>
       /**
         * The **\`mask-position\`** CSS property sets the initial position, relative to the mask position layer set by \`mask-origin\`, for each defined mask image.
         *
         * **Syntax**: \`<position>#\`
         *
         * **Initial value**: \`0% 0%\`
         */
      WebkitMaskPosition?: ConditionalValue<CssProperties["WebkitMaskPosition"] | AnyString>
       /**
         * The \`-webkit-mask-position-x\` CSS property sets the initial horizontal position of a mask image.
         *
         * **Syntax**: \`[ <length-percentage> | left | center | right ]#\`
         *
         * **Initial value**: \`0%\`
         */
      WebkitMaskPositionX?: ConditionalValue<CssProperties["WebkitMaskPositionX"] | AnyString>
       /**
         * The \`-webkit-mask-position-y\` CSS property sets the initial vertical position of a mask image.
         *
         * **Syntax**: \`[ <length-percentage> | top | center | bottom ]#\`
         *
         * **Initial value**: \`0%\`
         */
      WebkitMaskPositionY?: ConditionalValue<CssProperties["WebkitMaskPositionY"] | AnyString>
       /**
         * The **\`mask-repeat\`** CSS property sets how mask images are repeated. A mask image can be repeated along the horizontal axis, the vertical axis, both axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeat?: ConditionalValue<CssProperties["WebkitMaskRepeat"] | AnyString>
       /**
         * The \`-webkit-mask-repeat-x\` property specifies whether and how a mask image is repeated (tiled) horizontally.
         *
         * **Syntax**: \`repeat | no-repeat | space | round\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeatX?: ConditionalValue<CssProperties["WebkitMaskRepeatX"] | AnyString>
       /**
         * The \`-webkit-mask-repeat-y\` property sets whether and how a mask image is repeated (tiled) vertically.
         *
         * **Syntax**: \`repeat | no-repeat | space | round\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeatY?: ConditionalValue<CssProperties["WebkitMaskRepeatY"] | AnyString>
       /**
         * The **\`mask-size\`** CSS property specifies the sizes of the mask images. The size of the image can be fully or partially constrained in order to preserve its intrinsic ratio.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         */
      WebkitMaskSize?: ConditionalValue<CssProperties["WebkitMaskSize"] | AnyString>
       /**
         * The \`-webkit-overflow-scrolling\` CSS property controls whether or not touch devices use momentum-based scrolling for a given element.
         *
         * **Syntax**: \`auto | touch\`
         *
         * **Initial value**: \`auto\`
         */
      WebkitOverflowScrolling?: ConditionalValue<CssProperties["WebkitOverflowScrolling"] | AnyString>
       /**
         * **\`-webkit-tap-highlight-color\`** is a non-standard CSS property that sets the color of the highlight that appears over a link while it's being tapped. The highlighting indicates to the user that their tap is being successfully recognized, and indicates which element they're tapping on.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`black\`
         */
      WebkitTapHighlightColor?: ConditionalValue<CssProperties["WebkitTapHighlightColor"] | AnyString>
       /**
         * The **\`-webkit-text-fill-color\`** CSS property specifies the fill color of characters of text. If this property is not set, the value of the \`color\` property is used.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitTextFillColor?: ConditionalValue<CssProperties["WebkitTextFillColor"] | AnyString>
       /**
         * The **\`-webkit-text-stroke\`** CSS property specifies the width and color of strokes for text characters. This is a shorthand property for the longhand properties \`-webkit-text-stroke-width\` and \`-webkit-text-stroke-color\`.
         *
         * **Syntax**: \`<length> || <color>\`
         */
      WebkitTextStroke?: ConditionalValue<CssProperties["WebkitTextStroke"] | AnyString>
       /**
         * The **\`-webkit-text-stroke-color\`** CSS property specifies the stroke color of characters of text. If this property is not set, the value of the \`color\` property is used.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitTextStrokeColor?: ConditionalValue<CssProperties["WebkitTextStrokeColor"] | AnyString>
       /**
         * The **\`-webkit-text-stroke-width\`** CSS property specifies the width of the stroke for text.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         */
      WebkitTextStrokeWidth?: ConditionalValue<CssProperties["WebkitTextStrokeWidth"] | AnyString>
       /**
         * The \`-webkit-touch-callout\` CSS property controls the display of the default callout shown when you touch and hold a touch target.
         *
         * **Syntax**: \`default | none\`
         *
         * **Initial value**: \`default\`
         */
      WebkitTouchCallout?: ConditionalValue<CssProperties["WebkitTouchCallout"] | AnyString>
       /**
         * **Syntax**: \`read-only | read-write | read-write-plaintext-only\`
         *
         * **Initial value**: \`read-only\`
         */
      WebkitUserModify?: ConditionalValue<CssProperties["WebkitUserModify"] | AnyString>
       /**
         * The **\`accent-color\`** CSS property sets the accent color for user-interface controls generated by some elements.
         *
         * **Syntax**: \`auto | <color>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **93** | **92**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/accent-color
         */
      accentColor?: ConditionalValue<UtilityValues["accentColor"] | CssProperties["accentColor"] | AnyString>
       /**
         * The CSS **\`align-content\`** property sets the distribution of space between and around content items along a flexbox's cross-axis or a grid's block axis.
         *
         * **Syntax**: \`normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-content
         */
      alignContent?: ConditionalValue<CssVars | CssProperties["alignContent"] | AnyString>
       /**
         * The CSS **\`align-items\`** property sets the \`align-self\` value on all direct children as a group. In Flexbox, it controls the alignment of items on the Cross Axis. In Grid Layout, it controls the alignment of items on the Block Axis within their grid area.
         *
         * **Syntax**: \`normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-items
         */
      alignItems?: ConditionalValue<CssVars | CssProperties["alignItems"] | AnyString>
       /**
         * The **\`align-self\`** CSS property overrides a grid or flex item's \`align-items\` value. In Grid, it aligns the item inside the grid area. In Flexbox, it aligns the item on the cross axis.
         *
         * **Syntax**: \`auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position>\`
         *
         * **Initial value**: \`auto\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **10** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-self
         */
      alignSelf?: ConditionalValue<CssVars | CssProperties["alignSelf"] | AnyString>
       /**
         * The **\`align-tracks\`** CSS property sets the alignment in the masonry axis for grid containers that have masonry in their block axis.
         *
         * **Syntax**: \`[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-tracks
         */
      alignTracks?: ConditionalValue<CssProperties["alignTracks"] | AnyString>
       /**
         * The **\`all\`** shorthand CSS property resets all of an element's properties except \`unicode-bidi\`, \`direction\`, and CSS Custom Properties. It can set properties to their initial or inherited values, or to the values specified in another cascade layer or stylesheet origin.
         *
         * **Syntax**: \`initial | inherit | unset | revert | revert-layer\`
         *
         * **Initial value**: There is no practical initial value for it.
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **37** | **27**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/all
         */
      all?: ConditionalValue<CssVars | CssProperties["all"] | AnyString>
       /**
         * The **\`animation\`** shorthand CSS property applies an animation between styles. It is a shorthand for \`animation-name\`, \`animation-duration\`, \`animation-timing-function\`, \`animation-delay\`, \`animation-iteration-count\`, \`animation-direction\`, \`animation-fill-mode\`, and \`animation-play-state\`.
         *
         * **Syntax**: \`<single-animation>#\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation
         */
      animation?: ConditionalValue<UtilityValues["animation"] | CssProperties["animation"] | AnyString>
       /**
         * The **\`animation-composition\`** CSS property specifies the composite operation to use when multiple animations affect the same property simultaneously.
         *
         * **Syntax**: \`<single-animation-composition>#\`
         *
         * **Initial value**: \`replace\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **112** | **115** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-composition
         */
      animationComposition?: ConditionalValue<CssVars | CssProperties["animationComposition"] | AnyString>
       /**
         * The **\`animation-delay\`** CSS property specifies the amount of time to wait from applying the animation to an element before beginning to perform the animation. The animation can start later, immediately from its beginning, or immediately and partway through the animation.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-delay
         */
      animationDelay?: ConditionalValue<UtilityValues["animationDelay"] | CssProperties["animationDelay"] | AnyString>
       /**
         * The **\`animation-direction\`** CSS property sets whether an animation should play forward, backward, or alternate back and forth between playing the sequence forward and backward.
         *
         * **Syntax**: \`<single-animation-direction>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-direction
         */
      animationDirection?: ConditionalValue<CssVars | CssProperties["animationDirection"] | AnyString>
       /**
         * The **\`animation-duration\`** CSS property sets the length of time that an animation takes to complete one cycle.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-duration
         */
      animationDuration?: ConditionalValue<CssProperties["animationDuration"] | AnyString>
       /**
         * The **\`animation-fill-mode\`** CSS property sets how a CSS animation applies styles to its target before and after its execution.
         *
         * **Syntax**: \`<single-animation-fill-mode>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 5 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-fill-mode
         */
      animationFillMode?: ConditionalValue<CssVars | CssProperties["animationFillMode"] | AnyString>
       /**
         * The **\`animation-iteration-count\`** CSS property sets the number of times an animation sequence should be played before stopping.
         *
         * **Syntax**: \`<single-animation-iteration-count>#\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-iteration-count
         */
      animationIterationCount?: ConditionalValue<CssProperties["animationIterationCount"] | AnyString>
       /**
         * The **\`animation-name\`** CSS property specifies the names of one or more \`@keyframes\` at-rules that describe the animation to apply to an element. Multiple \`@keyframe\` at-rules are specified as a comma-separated list of names. If the specified name does not match any \`@keyframe\` at-rule, no properties are animated.
         *
         * **Syntax**: \`[ none | <keyframes-name> ]#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-name
         */
      animationName?: ConditionalValue<CssProperties["animationName"] | AnyString>
       /**
         * The **\`animation-play-state\`** CSS property sets whether an animation is running or paused.
         *
         * **Syntax**: \`<single-animation-play-state>#\`
         *
         * **Initial value**: \`running\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-play-state
         */
      animationPlayState?: ConditionalValue<CssProperties["animationPlayState"] | AnyString>
       /**
         * The **\`animation-range\`** CSS shorthand property is used to set the start and end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start and end.
         *
         * **Syntax**: \`[ <'animation-range-start'> <'animation-range-end'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range
         */
      animationRange?: ConditionalValue<CssProperties["animationRange"] | AnyString>
       /**
         * The **\`animation-range-end\`** CSS property is used to set the end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will end.
         *
         * **Syntax**: \`[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range-end
         */
      animationRangeEnd?: ConditionalValue<CssProperties["animationRangeEnd"] | AnyString>
       /**
         * The **\`animation-range-start\`** CSS property is used to set the start of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start.
         *
         * **Syntax**: \`[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range-start
         */
      animationRangeStart?: ConditionalValue<CssProperties["animationRangeStart"] | AnyString>
       /**
         * The **\`animation-timing-function\`** CSS property sets how an animation progresses through the duration of each cycle.
         *
         * **Syntax**: \`<easing-function>#\`
         *
         * **Initial value**: \`ease\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-timing-function
         */
      animationTimingFunction?: ConditionalValue<CssProperties["animationTimingFunction"] | AnyString>
       /**
         * The **\`animation-timeline\`** CSS property specifies the timeline that is used to control the progress of an animation.
         *
         * **Syntax**: \`<single-animation-timeline>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-timeline
         */
      animationTimeline?: ConditionalValue<CssProperties["animationTimeline"] | AnyString>
       /**
         * The **\`appearance\`** CSS property is used to control native appearance of UI controls, that are based on operating system's theme.
         *
         * **Syntax**: \`none | auto | textfield | menulist-button | <compat-auto>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  |   Edge   | IE  |
         * | :-----: | :-----: | :------: | :------: | :-: |
         * | **84**  | **80**  | **15.4** |  **84**  | No  |
         * | 1 _-x-_ | 1 _-x-_ | 3 _-x-_  | 12 _-x-_ |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/appearance
         */
      appearance?: ConditionalValue<CssVars | CssProperties["appearance"] | AnyString>
       /**
         * The **\`aspect-ratio\`** CSS property sets a **preferred aspect ratio** for the box, which will be used in the calculation of auto sizes and some other layout functions.
         *
         * **Syntax**: \`auto | <ratio>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **88** | **89**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/aspect-ratio
         */
      aspectRatio?: ConditionalValue<UtilityValues["aspectRatio"] | CssProperties["aspectRatio"] | AnyString>
       azimuth?: ConditionalValue<CssProperties["azimuth"] | AnyString>
       /**
         * The **\`backdrop-filter\`** CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything _behind_ the element, to see the effect you must make the element or its background at least partially transparent.
         *
         * **Syntax**: \`none | <filter-function-list>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |   Safari    |  Edge  | IE  |
         * | :----: | :-----: | :---------: | :----: | :-: |
         * | **76** | **103** | **9** _-x-_ | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/backdrop-filter
         */
      backdropFilter?: ConditionalValue<UtilityValues["backdropFilter"] | CssProperties["backdropFilter"] | AnyString>
       /**
         * The **\`backface-visibility\`** CSS property sets whether the back face of an element is visible when turned towards the user.
         *
         * **Syntax**: \`visible | hidden\`
         *
         * **Initial value**: \`visible\`
         *
         * |  Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :------: | :-----: | :-------: | :----: | :----: |
         * |  **36**  | **16**  | **15.4**  | **12** | **10** |
         * | 12 _-x-_ |         | 5.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/backface-visibility
         */
      backfaceVisibility?: ConditionalValue<CssVars | CssProperties["backfaceVisibility"] | AnyString>
       /**
         * The **\`background\`** shorthand CSS property sets all background style properties at once, such as color, image, origin and size, or repeat method.
         *
         * **Syntax**: \`[ <bg-layer> , ]* <final-bg-layer>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background
         */
      background?: ConditionalValue<UtilityValues["background"] | CssProperties["background"] | AnyString>
       /**
         * The **\`background-attachment\`** CSS property sets whether a background image's position is fixed within the viewport, or scrolls with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-attachment
         */
      backgroundAttachment?: ConditionalValue<CssVars | CssProperties["backgroundAttachment"] | AnyString>
       /**
         * The **\`background-blend-mode\`** CSS property sets how an element's background images should blend with each other and with the element's background color.
         *
         * **Syntax**: \`<blend-mode>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **35** | **30**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-blend-mode
         */
      backgroundBlendMode?: ConditionalValue<CssProperties["backgroundBlendMode"] | AnyString>
       /**
         * The **\`background-clip\`** CSS property sets whether an element's background extends underneath its border box, padding box, or content box.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **4**  |  **5**  | **12** | **9** |
         * |        |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-clip
         */
      backgroundClip?: ConditionalValue<CssVars | CssProperties["backgroundClip"] | AnyString>
       /**
         * The **\`background-color\`** CSS property sets the background color of an element.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`transparent\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-color
         */
      backgroundColor?: ConditionalValue<UtilityValues["backgroundColor"] | CssProperties["backgroundColor"] | AnyString>
       /**
         * The **\`background-image\`** CSS property sets one or more background images on an element.
         *
         * **Syntax**: \`<bg-image>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-image
         */
      backgroundImage?: ConditionalValue<CssProperties["backgroundImage"] | AnyString>
       /**
         * The **\`background-origin\`** CSS property sets the background's origin: from the border start, inside the border, or inside the padding.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`padding-box\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **4**  | **3**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-origin
         */
      backgroundOrigin?: ConditionalValue<CssProperties["backgroundOrigin"] | AnyString>
       /**
         * The **\`background-position\`** CSS property sets the initial position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`<bg-position>#\`
         *
         * **Initial value**: \`0% 0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position
         */
      backgroundPosition?: ConditionalValue<CssProperties["backgroundPosition"] | AnyString>
       /**
         * The **\`background-position-x\`** CSS property sets the initial horizontal position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-x
         */
      backgroundPositionX?: ConditionalValue<CssProperties["backgroundPositionX"] | AnyString>
       /**
         * The **\`background-position-y\`** CSS property sets the initial vertical position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-y
         */
      backgroundPositionY?: ConditionalValue<CssProperties["backgroundPositionY"] | AnyString>
       /**
         * The **\`background-repeat\`** CSS property sets how background images are repeated. A background image can be repeated along the horizontal and vertical axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-repeat
         */
      backgroundRepeat?: ConditionalValue<CssProperties["backgroundRepeat"] | AnyString>
       /**
         * The **\`background-size\`** CSS property sets the size of the element's background image. The image can be left to its natural size, stretched, or constrained to fit the available space.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **3**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-size
         */
      backgroundSize?: ConditionalValue<CssProperties["backgroundSize"] | AnyString>
       /**
         * The **\`block-size\`** CSS property defines the horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`width\` or the \`height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/block-size
         */
      blockSize?: ConditionalValue<UtilityValues["blockSize"] | CssProperties["blockSize"] | AnyString>
       /**
         * The **\`border\`** shorthand CSS property sets an element's border. It sets the values of \`border-width\`, \`border-style\`, and \`border-color\`.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border
         */
      border?: ConditionalValue<UtilityValues["border"] | CssProperties["border"] | AnyString>
       /**
         * The **\`border-block\`** CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block
         */
      borderBlock?: ConditionalValue<UtilityValues["borderBlock"] | CssProperties["borderBlock"] | AnyString>
       /**
         * The **\`border-block-color\`** CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-color
         */
      borderBlockColor?: ConditionalValue<UtilityValues["borderBlockColor"] | CssProperties["borderBlockColor"] | AnyString>
       /**
         * The **\`border-block-style\`** CSS property defines the style of the logical block borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\` and \`border-bottom-style\`, or \`border-left-style\` and \`border-right-style\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-style
         */
      borderBlockStyle?: ConditionalValue<CssVars | CssProperties["borderBlockStyle"] | AnyString>
       /**
         * The **\`border-block-width\`** CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-width
         */
      borderBlockWidth?: ConditionalValue<CssProperties["borderBlockWidth"] | AnyString>
       /**
         * The **\`border-block-end\`** CSS property is a shorthand property for setting the individual logical block-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end
         */
      borderBlockEnd?: ConditionalValue<UtilityValues["borderBlockEnd"] | CssProperties["borderBlockEnd"] | AnyString>
       /**
         * The **\`border-block-end-color\`** CSS property defines the color of the logical block-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-color
         */
      borderBlockEndColor?: ConditionalValue<UtilityValues["borderBlockEndColor"] | CssProperties["borderBlockEndColor"] | AnyString>
       /**
         * The **\`border-block-end-style\`** CSS property defines the style of the logical block-end border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-style
         */
      borderBlockEndStyle?: ConditionalValue<CssVars | CssProperties["borderBlockEndStyle"] | AnyString>
       /**
         * The **\`border-block-end-width\`** CSS property defines the width of the logical block-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-width
         */
      borderBlockEndWidth?: ConditionalValue<CssProperties["borderBlockEndWidth"] | AnyString>
       /**
         * The **\`border-block-start\`** CSS property is a shorthand property for setting the individual logical block-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start
         */
      borderBlockStart?: ConditionalValue<UtilityValues["borderBlockStart"] | CssProperties["borderBlockStart"] | AnyString>
       /**
         * The **\`border-block-start-color\`** CSS property defines the color of the logical block-start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-color
         */
      borderBlockStartColor?: ConditionalValue<UtilityValues["borderBlockStartColor"] | CssProperties["borderBlockStartColor"] | AnyString>
       /**
         * The **\`border-block-start-style\`** CSS property defines the style of the logical block start border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-style
         */
      borderBlockStartStyle?: ConditionalValue<CssVars | CssProperties["borderBlockStartStyle"] | AnyString>
       /**
         * The **\`border-block-start-width\`** CSS property defines the width of the logical block-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-width
         */
      borderBlockStartWidth?: ConditionalValue<CssProperties["borderBlockStartWidth"] | AnyString>
       /**
         * The **\`border-bottom\`** shorthand CSS property sets an element's bottom border. It sets the values of \`border-bottom-width\`, \`border-bottom-style\` and \`border-bottom-color\`.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom
         */
      borderBottom?: ConditionalValue<UtilityValues["borderBottom"] | CssProperties["borderBottom"] | AnyString>
       /**
         * The **\`border-bottom-color\`** CSS property sets the color of an element's bottom border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-bottom\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-color
         */
      borderBottomColor?: ConditionalValue<UtilityValues["borderBottomColor"] | CssProperties["borderBottomColor"] | AnyString>
       /**
         * The **\`border-bottom-left-radius\`** CSS property rounds the bottom-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius
         */
      borderBottomLeftRadius?: ConditionalValue<UtilityValues["borderBottomLeftRadius"] | CssProperties["borderBottomLeftRadius"] | AnyString>
       /**
         * The **\`border-bottom-right-radius\`** CSS property rounds the bottom-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius
         */
      borderBottomRightRadius?: ConditionalValue<UtilityValues["borderBottomRightRadius"] | CssProperties["borderBottomRightRadius"] | AnyString>
       /**
         * The **\`border-bottom-style\`** CSS property sets the line style of an element's bottom \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-style
         */
      borderBottomStyle?: ConditionalValue<CssVars | CssProperties["borderBottomStyle"] | AnyString>
       /**
         * The **\`border-bottom-width\`** CSS property sets the width of the bottom border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-width
         */
      borderBottomWidth?: ConditionalValue<CssProperties["borderBottomWidth"] | AnyString>
       /**
         * The **\`border-collapse\`** CSS property sets whether cells inside a \`<table>\` have shared or separate borders.
         *
         * **Syntax**: \`collapse | separate\`
         *
         * **Initial value**: \`separate\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-collapse
         */
      borderCollapse?: ConditionalValue<CssVars | CssProperties["borderCollapse"] | AnyString>
       /**
         * The **\`border-color\`** shorthand CSS property sets the color of an element's border.
         *
         * **Syntax**: \`<color>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-color
         */
      borderColor?: ConditionalValue<UtilityValues["borderColor"] | CssProperties["borderColor"] | AnyString>
       /**
         * The **\`border-end-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius
         */
      borderEndEndRadius?: ConditionalValue<UtilityValues["borderEndEndRadius"] | CssProperties["borderEndEndRadius"] | AnyString>
       /**
         * The **\`border-end-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius
         */
      borderEndStartRadius?: ConditionalValue<UtilityValues["borderEndStartRadius"] | CssProperties["borderEndStartRadius"] | AnyString>
       /**
         * The **\`border-image\`** CSS property draws an image around a given element. It replaces the element's regular border.
         *
         * **Syntax**: \`<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>\`
         *
         * | Chrome  |  Firefox  | Safari  |  Edge  |   IE   |
         * | :-----: | :-------: | :-----: | :----: | :----: |
         * | **16**  |  **15**   |  **6**  | **12** | **11** |
         * | 7 _-x-_ | 3.5 _-x-_ | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image
         */
      borderImage?: ConditionalValue<CssProperties["borderImage"] | AnyString>
       /**
         * The **\`border-image-outset\`** CSS property sets the distance by which an element's border image is set out from its border box.
         *
         * **Syntax**: \`[ <length> | <number> ]{1,4}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-outset
         */
      borderImageOutset?: ConditionalValue<CssProperties["borderImageOutset"] | AnyString>
       /**
         * The **\`border-image-repeat\`** CSS property defines how the edge regions and middle region of a source image are adjusted to fit the dimensions of an element's border image. The middle region can be displayed by using the keyword "fill" in the border-image-slice property.
         *
         * **Syntax**: \`[ stretch | repeat | round | space ]{1,2}\`
         *
         * **Initial value**: \`stretch\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-repeat
         */
      borderImageRepeat?: ConditionalValue<CssProperties["borderImageRepeat"] | AnyString>
       /**
         * The **\`border-image-slice\`** CSS property divides the image specified by \`border-image-source\` into regions. These regions form the components of an element's border image.
         *
         * **Syntax**: \`<number-percentage>{1,4} && fill?\`
         *
         * **Initial value**: \`100%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-slice
         */
      borderImageSlice?: ConditionalValue<CssProperties["borderImageSlice"] | AnyString>
       /**
         * The **\`border-image-source\`** CSS property sets the source image used to create an element's border image.
         *
         * **Syntax**: \`none | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-source
         */
      borderImageSource?: ConditionalValue<CssProperties["borderImageSource"] | AnyString>
       /**
         * The **\`border-image-width\`** CSS property sets the width of an element's border image.
         *
         * **Syntax**: \`[ <length-percentage> | <number> | auto ]{1,4}\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **13**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-width
         */
      borderImageWidth?: ConditionalValue<CssProperties["borderImageWidth"] | AnyString>
       /**
         * The **\`border-inline\`** CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline
         */
      borderInline?: ConditionalValue<UtilityValues["borderInline"] | CssProperties["borderInline"] | AnyString>
       /**
         * The **\`border-inline-end\`** CSS property is a shorthand property for setting the individual logical inline-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end
         */
      borderInlineEnd?: ConditionalValue<UtilityValues["borderInlineEnd"] | CssProperties["borderInlineEnd"] | AnyString>
       /**
         * The **\`border-inline-color\`** CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-color
         */
      borderInlineColor?: ConditionalValue<UtilityValues["borderInlineColor"] | CssProperties["borderInlineColor"] | AnyString>
       /**
         * The **\`border-inline-style\`** CSS property defines the style of the logical inline borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\` and \`border-bottom-style\`, or \`border-left-style\` and \`border-right-style\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-style
         */
      borderInlineStyle?: ConditionalValue<CssVars | CssProperties["borderInlineStyle"] | AnyString>
       /**
         * The **\`border-inline-width\`** CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-width
         */
      borderInlineWidth?: ConditionalValue<CssProperties["borderInlineWidth"] | AnyString>
       /**
         * The **\`border-inline-end-color\`** CSS property defines the color of the logical inline-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color
         */
      borderInlineEndColor?: ConditionalValue<UtilityValues["borderInlineEndColor"] | CssProperties["borderInlineEndColor"] | AnyString>
       /**
         * The **\`border-inline-end-style\`** CSS property defines the style of the logical inline end border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-style)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-style
         */
      borderInlineEndStyle?: ConditionalValue<CssVars | CssProperties["borderInlineEndStyle"] | AnyString>
       /**
         * The **\`border-inline-end-width\`** CSS property defines the width of the logical inline-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-width)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width
         */
      borderInlineEndWidth?: ConditionalValue<CssProperties["borderInlineEndWidth"] | AnyString>
       /**
         * The **\`border-inline-start\`** CSS property is a shorthand property for setting the individual logical inline-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start
         */
      borderInlineStart?: ConditionalValue<UtilityValues["borderInlineStart"] | CssProperties["borderInlineStart"] | AnyString>
       /**
         * The **\`border-inline-start-color\`** CSS property defines the color of the logical inline start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color
         */
      borderInlineStartColor?: ConditionalValue<UtilityValues["borderInlineStartColor"] | CssProperties["borderInlineStartColor"] | AnyString>
       /**
         * The **\`border-inline-start-style\`** CSS property defines the style of the logical inline start border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-style)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-style
         */
      borderInlineStartStyle?: ConditionalValue<CssVars | CssProperties["borderInlineStartStyle"] | AnyString>
       /**
         * The **\`border-inline-start-width\`** CSS property defines the width of the logical inline-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width
         */
      borderInlineStartWidth?: ConditionalValue<CssProperties["borderInlineStartWidth"] | AnyString>
       /**
         * The **\`border-left\`** shorthand CSS property sets all the properties of an element's left border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left
         */
      borderLeft?: ConditionalValue<UtilityValues["borderLeft"] | CssProperties["borderLeft"] | AnyString>
       /**
         * The **\`border-left-color\`** CSS property sets the color of an element's left border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-left\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-color
         */
      borderLeftColor?: ConditionalValue<UtilityValues["borderLeftColor"] | CssProperties["borderLeftColor"] | AnyString>
       /**
         * The **\`border-left-style\`** CSS property sets the line style of an element's left \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-style
         */
      borderLeftStyle?: ConditionalValue<CssVars | CssProperties["borderLeftStyle"] | AnyString>
       /**
         * The **\`border-left-width\`** CSS property sets the width of the left border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-width
         */
      borderLeftWidth?: ConditionalValue<CssProperties["borderLeftWidth"] | AnyString>
       /**
         * The **\`border-radius\`** CSS property rounds the corners of an element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.
         *
         * **Syntax**: \`<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-radius
         */
      borderRadius?: ConditionalValue<UtilityValues["borderRadius"] | CssProperties["borderRadius"] | AnyString>
       /**
         * The **\`border-right\`** shorthand CSS property sets all the properties of an element's right border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right
         */
      borderRight?: ConditionalValue<UtilityValues["borderRight"] | CssProperties["borderRight"] | AnyString>
       /**
         * The **\`border-right-color\`** CSS property sets the color of an element's right border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-right\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-color
         */
      borderRightColor?: ConditionalValue<UtilityValues["borderRightColor"] | CssProperties["borderRightColor"] | AnyString>
       /**
         * The **\`border-right-style\`** CSS property sets the line style of an element's right \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-style
         */
      borderRightStyle?: ConditionalValue<CssVars | CssProperties["borderRightStyle"] | AnyString>
       /**
         * The **\`border-right-width\`** CSS property sets the width of the right border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-width
         */
      borderRightWidth?: ConditionalValue<CssProperties["borderRightWidth"] | AnyString>
       /**
         * The **\`border-spacing\`** CSS property sets the distance between the borders of adjacent cells in a \`<table>\`. This property applies only when \`border-collapse\` is \`separate\`.
         *
         * **Syntax**: \`<length> <length>?\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-spacing
         */
      borderSpacing?: ConditionalValue<UtilityValues["borderSpacing"] | CssProperties["borderSpacing"] | AnyString>
       /**
         * The **\`border-start-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius
         */
      borderStartEndRadius?: ConditionalValue<UtilityValues["borderStartEndRadius"] | CssProperties["borderStartEndRadius"] | AnyString>
       /**
         * The **\`border-start-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius
         */
      borderStartStartRadius?: ConditionalValue<UtilityValues["borderStartStartRadius"] | CssProperties["borderStartStartRadius"] | AnyString>
       /**
         * The **\`border-style\`** shorthand CSS property sets the line style for all four sides of an element's border.
         *
         * **Syntax**: \`<line-style>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-style
         */
      borderStyle?: ConditionalValue<CssProperties["borderStyle"] | AnyString>
       /**
         * The **\`border-top\`** shorthand CSS property sets all the properties of an element's top border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top
         */
      borderTop?: ConditionalValue<UtilityValues["borderTop"] | CssProperties["borderTop"] | AnyString>
       /**
         * The **\`border-top-color\`** CSS property sets the color of an element's top border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-top\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-color
         */
      borderTopColor?: ConditionalValue<UtilityValues["borderTopColor"] | CssProperties["borderTopColor"] | AnyString>
       /**
         * The **\`border-top-left-radius\`** CSS property rounds the top-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius
         */
      borderTopLeftRadius?: ConditionalValue<UtilityValues["borderTopLeftRadius"] | CssProperties["borderTopLeftRadius"] | AnyString>
       /**
         * The **\`border-top-right-radius\`** CSS property rounds the top-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius
         */
      borderTopRightRadius?: ConditionalValue<UtilityValues["borderTopRightRadius"] | CssProperties["borderTopRightRadius"] | AnyString>
       /**
         * The **\`border-top-style\`** CSS property sets the line style of an element's top \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-style
         */
      borderTopStyle?: ConditionalValue<CssVars | CssProperties["borderTopStyle"] | AnyString>
       /**
         * The **\`border-top-width\`** CSS property sets the width of the top border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-width
         */
      borderTopWidth?: ConditionalValue<CssProperties["borderTopWidth"] | AnyString>
       /**
         * The **\`border-width\`** shorthand CSS property sets the width of an element's border.
         *
         * **Syntax**: \`<line-width>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-width
         */
      borderWidth?: ConditionalValue<CssProperties["borderWidth"] | AnyString>
       /**
         * The **\`bottom\`** CSS property participates in setting the vertical position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/bottom
         */
      bottom?: ConditionalValue<UtilityValues["bottom"] | CssProperties["bottom"] | AnyString>
       boxAlign?: ConditionalValue<CssProperties["boxAlign"] | AnyString>
       /**
         * The **\`box-decoration-break\`** CSS property specifies how an element's fragments should be rendered when broken across multiple lines, columns, or pages.
         *
         * **Syntax**: \`slice | clone\`
         *
         * **Initial value**: \`slice\`
         *
         * |    Chrome    | Firefox |   Safari    | Edge | IE  |
         * | :----------: | :-----: | :---------: | :--: | :-: |
         * | **22** _-x-_ | **32**  | **7** _-x-_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-decoration-break
         */
      boxDecorationBreak?: ConditionalValue<CssVars | CssProperties["boxDecorationBreak"] | AnyString>
       boxDirection?: ConditionalValue<CssProperties["boxDirection"] | AnyString>
       boxFlex?: ConditionalValue<CssProperties["boxFlex"] | AnyString>
       boxFlexGroup?: ConditionalValue<CssProperties["boxFlexGroup"] | AnyString>
       boxLines?: ConditionalValue<CssProperties["boxLines"] | AnyString>
       boxOrdinalGroup?: ConditionalValue<CssProperties["boxOrdinalGroup"] | AnyString>
       boxOrient?: ConditionalValue<CssProperties["boxOrient"] | AnyString>
       boxPack?: ConditionalValue<CssProperties["boxPack"] | AnyString>
       /**
         * The **\`box-shadow\`** CSS property adds shadow effects around an element's frame. You can set multiple effects separated by commas. A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
         *
         * **Syntax**: \`none | <shadow>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  |  **4**  | **5.1** | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-shadow
         */
      boxShadow?: ConditionalValue<UtilityValues["boxShadow"] | CssProperties["boxShadow"] | AnyString>
       /**
         * The **\`box-sizing\`** CSS property sets how the total width and height of an element is calculated.
         *
         * **Syntax**: \`content-box | border-box\`
         *
         * **Initial value**: \`content-box\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  | **29**  | **5.1** | **12** | **8** |
         * | 1 _-x-_ | 1 _-x-_ | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-sizing
         */
      boxSizing?: ConditionalValue<CssVars | CssProperties["boxSizing"] | AnyString>
       /**
         * The **\`break-after\`** CSS property sets how page, column, or region breaks should behave after a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-after
         */
      breakAfter?: ConditionalValue<CssVars | CssProperties["breakAfter"] | AnyString>
       /**
         * The **\`break-before\`** CSS property sets how page, column, or region breaks should behave before a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-before
         */
      breakBefore?: ConditionalValue<CssVars | CssProperties["breakBefore"] | AnyString>
       /**
         * The **\`break-inside\`** CSS property sets how page, column, or region breaks should behave inside a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | avoid-page | avoid-column | avoid-region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-inside
         */
      breakInside?: ConditionalValue<CssVars | CssProperties["breakInside"] | AnyString>
       /**
         * The **\`caption-side\`** CSS property puts the content of a table's \`<caption>\` on the specified side. The values are relative to the \`writing-mode\` of the table.
         *
         * **Syntax**: \`top | bottom | block-start | block-end | inline-start | inline-end\`
         *
         * **Initial value**: \`top\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/caption-side
         */
      captionSide?: ConditionalValue<CssVars | CssProperties["captionSide"] | AnyString>
       /** **Syntax**: \`<'caret-color'> || <'caret-shape'>\` */
      caret?: ConditionalValue<CssProperties["caret"] | AnyString>
       /**
         * The **\`caret-color\`** CSS property sets the color of the **insertion caret**, the visible marker where the next character typed will be inserted. This is sometimes referred to as the **text input cursor**. The caret appears in elements such as \`<input>\` or those with the \`contenteditable\` attribute. The caret is typically a thin vertical line that flashes to help make it more noticeable. By default, it is black, but its color can be altered with this property.
         *
         * **Syntax**: \`auto | <color>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **53**  | **11.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/caret-color
         */
      caretColor?: ConditionalValue<UtilityValues["caretColor"] | CssProperties["caretColor"] | AnyString>
       /**
         * **Syntax**: \`auto | bar | block | underscore\`
         *
         * **Initial value**: \`auto\`
         */
      caretShape?: ConditionalValue<CssProperties["caretShape"] | AnyString>
       /**
         * The **\`clear\`** CSS property sets whether an element must be moved below (cleared) floating elements that precede it. The \`clear\` property applies to floating and non-floating elements.
         *
         * **Syntax**: \`none | left | right | both | inline-start | inline-end\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/clear
         */
      clear?: ConditionalValue<CssVars | CssProperties["clear"] | AnyString>
       clip?: ConditionalValue<CssProperties["clip"] | AnyString>
       /**
         * The **\`clip-path\`** CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden.
         *
         * **Syntax**: \`<clip-source> | [ <basic-shape> || <geometry-box> ] | none\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **55**  | **3.5** | **9.1** | **79** | **10** |
         * | 23 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/clip-path
         */
      clipPath?: ConditionalValue<CssProperties["clipPath"] | AnyString>
       /**
         * The **\`color\`** CSS property sets the foreground color value of an element's text and text decorations, and sets the \`currentcolor\` value. \`currentcolor\` may be used as an indirect value on _other_ properties and is the default for other color properties, such as \`border-color\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`canvastext\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/color
         */
      color?: ConditionalValue<UtilityValues["color"] | CssProperties["color"] | AnyString>
       /**
         * The **\`color-scheme\`** CSS property allows an element to indicate which color schemes it can comfortably be rendered in.
         *
         * **Syntax**: \`normal | [ light | dark | <custom-ident> ]+ && only?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **81** | **96**  | **13** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/color-scheme
         */
      colorScheme?: ConditionalValue<CssProperties["colorScheme"] | AnyString>
       /**
         * The **\`column-count\`** CSS property breaks an element's content into the specified number of columns.
         *
         * **Syntax**: \`<integer> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-count
         */
      columnCount?: ConditionalValue<CssProperties["columnCount"] | AnyString>
       /**
         * The **\`column-fill\`** CSS property controls how an element's contents are balanced when broken into columns.
         *
         * **Syntax**: \`auto | balance | balance-all\`
         *
         * **Initial value**: \`balance\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **50** | **52**  |  **9**  | **12** | **10** |
         * |        |         | 8 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-fill
         */
      columnFill?: ConditionalValue<CssVars | CssProperties["columnFill"] | AnyString>
       /**
         * The **\`column-gap\`** CSS property sets the size of the gap (gutter) between an element's columns.
         *
         * **Syntax**: \`normal | <length-percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **1**  | **1.5** | **3**  | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-gap
         */
      columnGap?: ConditionalValue<UtilityValues["columnGap"] | CssProperties["columnGap"] | AnyString>
       /**
         * The **\`column-rule\`** shorthand CSS property sets the width, style, and color of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule
         */
      columnRule?: ConditionalValue<CssProperties["columnRule"] | AnyString>
       /**
         * The **\`column-rule-color\`** CSS property sets the color of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-color
         */
      columnRuleColor?: ConditionalValue<CssProperties["columnRuleColor"] | AnyString>
       /**
         * The **\`column-rule-style\`** CSS property sets the style of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'border-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-style
         */
      columnRuleStyle?: ConditionalValue<CssVars | CssProperties["columnRuleStyle"] | AnyString>
       /**
         * The **\`column-rule-width\`** CSS property sets the width of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'border-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-width
         */
      columnRuleWidth?: ConditionalValue<CssProperties["columnRuleWidth"] | AnyString>
       /**
         * The **\`column-span\`** CSS property makes it possible for an element to span across all columns when its value is set to \`all\`.
         *
         * **Syntax**: \`none | all\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **50**  | **71**  |   **9**   | **12** | **10** |
         * | 6 _-x-_ |         | 5.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-span
         */
      columnSpan?: ConditionalValue<CssProperties["columnSpan"] | AnyString>
       /**
         * The **\`column-width\`** CSS property sets the ideal column width in a multi-column layout. The container will have as many columns as can fit without any of them having a width less than the \`column-width\` value. If the width of the container is narrower than the specified value, the single column's width will be smaller than the declared column width.
         *
         * **Syntax**: \`<length> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **50**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-width
         */
      columnWidth?: ConditionalValue<CssProperties["columnWidth"] | AnyString>
       /**
         * The **\`columns\`** CSS shorthand property sets the number of columns to use when drawing an element's contents, as well as those columns' widths.
         *
         * **Syntax**: \`<'column-width'> || <'column-count'>\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **50** | **52**  |  **9**  | **12** | **10** |
         * |        |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/columns
         */
      columns?: ConditionalValue<CssProperties["columns"] | AnyString>
       /**
         * The **\`contain\`** CSS property indicates that an element and its contents are, as much as possible, independent from the rest of the document tree. Containment enables isolating a subsection of the DOM, providing performance benefits by limiting calculations of layout, style, paint, size, or any combination to a DOM subtree rather than the entire page. Containment can also be used to scope CSS counters and quotes.
         *
         * **Syntax**: \`none | strict | content | [ [ size || inline-size ] || layout || style || paint ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **52** | **69**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain
         */
      contain?: ConditionalValue<CssProperties["contain"] | AnyString>
       /**
         * The **\`contain-intrinsic-size\`** CSS shorthand property sets the size of an element that a browser will use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`[ auto? [ none | <length> ] ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **83** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-size
         */
      containIntrinsicSize?: ConditionalValue<CssProperties["containIntrinsicSize"] | AnyString>
       /**
         * The **\`contain-intrinsic-block-size\`** CSS logical property defines the block size of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-contain-intrinsic-block-size
         */
      containIntrinsicBlockSize?: ConditionalValue<CssProperties["containIntrinsicBlockSize"] | AnyString>
       /**
         * The **\`contain-intrinsic-length\`** CSS property sets the height of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-height
         */
      containIntrinsicHeight?: ConditionalValue<CssProperties["containIntrinsicHeight"] | AnyString>
       /**
         * The **\`contain-intrinsic-inline-size\`** CSS logical property defines the inline-size of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-contain-intrinsic-inline-size
         */
      containIntrinsicInlineSize?: ConditionalValue<CssProperties["containIntrinsicInlineSize"] | AnyString>
       /**
         * The **\`contain-intrinsic-width\`** CSS property sets the width of an element that a browser will use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-width
         */
      containIntrinsicWidth?: ConditionalValue<CssProperties["containIntrinsicWidth"] | AnyString>
       /**
         * The **container** shorthand CSS property establishes the element as a query container and specifies the name or name for the containment context used in a container query.
         *
         * **Syntax**: \`<'container-name'> [ / <'container-type'> ]?\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container
         */
      container?: ConditionalValue<CssProperties["container"] | AnyString>
       /**
         * The **container-name** CSS property specifies a list of query container names used by the @container at-rule in a container query. A container query will apply styles to elements based on the size of the nearest ancestor with a containment context. When a containment context is given a name, it can be specifically targeted using the \`@container\` at-rule instead of the nearest ancestor with containment.
         *
         * **Syntax**: \`none | <custom-ident>+\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container-name
         */
      containerName?: ConditionalValue<UtilityValues["containerName"] | CssProperties["containerName"] | AnyString>
       /**
         * The **container-type** CSS property is used to define the type of containment used in a container query.
         *
         * **Syntax**: \`normal | size | inline-size\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container-type
         */
      containerType?: ConditionalValue<CssProperties["containerType"] | AnyString>
       /**
         * The **\`content\`** CSS property replaces an element with a generated value. Objects inserted using the \`content\` property are **anonymous replaced elements**.
         *
         * **Syntax**: \`normal | none | [ <content-replacement> | <content-list> ] [/ [ <string> | <counter> ]+ ]?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/content
         */
      content?: ConditionalValue<CssProperties["content"] | AnyString>
       /**
         * The **\`content-visibility\`** CSS property controls whether or not an element renders its contents at all, along with forcing a strong set of containments, allowing user agents to potentially omit large swathes of layout and rendering work until it becomes needed. It enables the user agent to skip an element's rendering work (including layout and painting) until it is needed — which makes the initial page load much faster.
         *
         * **Syntax**: \`visible | auto | hidden\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome |   Firefox   | Safari | Edge | IE  |
         * | :----: | :---------: | :----: | :--: | :-: |
         * | **85** | **preview** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/content-visibility
         */
      contentVisibility?: ConditionalValue<CssVars | CssProperties["contentVisibility"] | AnyString>
       /**
         * The **\`counter-increment\`** CSS property increases or decreases the value of a CSS counter by a given value.
         *
         * **Syntax**: \`[ <counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **3**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-increment
         */
      counterIncrement?: ConditionalValue<CssProperties["counterIncrement"] | AnyString>
       /**
         * The **\`counter-reset\`** CSS property resets a CSS counter to a given value. This property will create a new counter or reversed counter with the given name on the specified element.
         *
         * **Syntax**: \`[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **3**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-reset
         */
      counterReset?: ConditionalValue<CssProperties["counterReset"] | AnyString>
       /**
         * The **\`counter-set\`** CSS property sets a CSS counter to a given value. It manipulates the value of existing counters, and will only create new counters if there isn't already a counter of the given name on the element.
         *
         * **Syntax**: \`[ <counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **85** | **68**  | **17.2** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-set
         */
      counterSet?: ConditionalValue<CssProperties["counterSet"] | AnyString>
       /**
         * The **\`cursor\`** CSS property sets the mouse cursor, if any, to show when the mouse pointer is over an element.
         *
         * **Syntax**: \`[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing ] ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/cursor
         */
      cursor?: ConditionalValue<CssProperties["cursor"] | AnyString>
       /**
         * The **\`direction\`** CSS property sets the direction of text, table columns, and horizontal overflow. Use \`rtl\` for languages written from right to left (like Hebrew or Arabic), and \`ltr\` for those written from left to right (like English and most other languages).
         *
         * **Syntax**: \`ltr | rtl\`
         *
         * **Initial value**: \`ltr\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **2**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/direction
         */
      direction?: ConditionalValue<CssVars | CssProperties["direction"] | AnyString>
       /**
         * The **\`display\`** CSS property sets whether an element is treated as a block or inline element and the layout used for its children, such as flow layout, grid or flex.
         *
         * **Syntax**: \`[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>\`
         *
         * **Initial value**: \`inline\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/display
         */
      display?: ConditionalValue<CssVars | CssProperties["display"] | AnyString>
       /**
         * The **\`empty-cells\`** CSS property sets whether borders and backgrounds appear around \`<table>\` cells that have no visible content.
         *
         * **Syntax**: \`show | hide\`
         *
         * **Initial value**: \`show\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/empty-cells
         */
      emptyCells?: ConditionalValue<CssVars | CssProperties["emptyCells"] | AnyString>
       /**
         * The **\`filter\`** CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
         *
         * **Syntax**: \`none | <filter-function-list>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  | IE  |
         * | :------: | :-----: | :-----: | :----: | :-: |
         * |  **53**  | **35**  | **9.1** | **12** | No  |
         * | 18 _-x-_ |         | 6 _-x-_ |        |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/filter
         */
      filter?: ConditionalValue<UtilityValues["filter"] | CssProperties["filter"] | AnyString>
       /**
         * The **\`flex\`** CSS shorthand property sets how a flex _item_ will grow or shrink to fit the space available in its flex container.
         *
         * **Syntax**: \`none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |    IE    |
         * | :------: | :-----: | :-----: | :----: | :------: |
         * |  **29**  | **20**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ |         | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex
         */
      flex?: ConditionalValue<UtilityValues["flex"] | CssProperties["flex"] | AnyString>
       /**
         * The **\`flex-basis\`** CSS property sets the initial main size of a flex item. It sets the size of the content box unless otherwise set with \`box-sizing\`.
         *
         * **Syntax**: \`content | <'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **22**  |  **9**  | **12** | **11** |
         * | 22 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-basis
         */
      flexBasis?: ConditionalValue<UtilityValues["flexBasis"] | CssProperties["flexBasis"] | AnyString>
       /**
         * The **\`flex-direction\`** CSS property sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).
         *
         * **Syntax**: \`row | row-reverse | column | column-reverse\`
         *
         * **Initial value**: \`row\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |    IE    |
         * | :------: | :------: | :-----: | :----: | :------: |
         * |  **29**  |  **81**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ | 49 _-x-_ | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-direction
         */
      flexDirection?: ConditionalValue<CssVars | CssProperties["flexDirection"] | AnyString>
       /**
         * The **\`flex-flow\`** CSS shorthand property specifies the direction of a flex container, as well as its wrapping behavior.
         *
         * **Syntax**: \`<'flex-direction'> || <'flex-wrap'>\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-flow
         */
      flexFlow?: ConditionalValue<CssProperties["flexFlow"] | AnyString>
       /**
         * The **\`flex-grow\`** CSS property sets the flex grow factor of a flex item's main size.
         *
         * **Syntax**: \`<number>\`
         *
         * **Initial value**: \`0\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |            IE            |
         * | :------: | :-----: | :-----: | :----: | :----------------------: |
         * |  **29**  | **20**  |  **9**  | **12** |          **11**          |
         * | 22 _-x-_ |         | 7 _-x-_ |        | 10 _(-ms-flex-positive)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-grow
         */
      flexGrow?: ConditionalValue<CssProperties["flexGrow"] | AnyString>
       /**
         * The **\`flex-shrink\`** CSS property sets the flex shrink factor of a flex item. If the size of all flex items is larger than the flex container, items shrink to fit according to \`flex-shrink\`.
         *
         * **Syntax**: \`<number>\`
         *
         * **Initial value**: \`1\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **10** |
         * | 22 _-x-_ |         | 8 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-shrink
         */
      flexShrink?: ConditionalValue<CssProperties["flexShrink"] | AnyString>
       /**
         * The **\`flex-wrap\`** CSS property sets whether flex items are forced onto one line or can wrap onto multiple lines. If wrapping is allowed, it sets the direction that lines are stacked.
         *
         * **Syntax**: \`nowrap | wrap | wrap-reverse\`
         *
         * **Initial value**: \`nowrap\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-wrap
         */
      flexWrap?: ConditionalValue<CssVars | CssProperties["flexWrap"] | AnyString>
       /**
         * The **\`float\`** CSS property places an element on the left or right side of its container, allowing text and inline elements to wrap around it. The element is removed from the normal flow of the page, though still remaining a part of the flow (in contrast to absolute positioning).
         *
         * **Syntax**: \`left | right | none | inline-start | inline-end\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/float
         */
      float?: ConditionalValue<UtilityValues["float"] | CssVars | AnyString>
       /**
         * The **\`font\`** CSS shorthand property sets all the different properties of an element's font. Alternatively, it sets an element's font to a system font.
         *
         * **Syntax**: \`[ [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] | caption | icon | menu | message-box | small-caption | status-bar\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font
         */
      font?: ConditionalValue<CssProperties["font"] | AnyString>
       /**
         * The **\`font-family\`** CSS property specifies a prioritized list of one or more font family names and/or generic family names for the selected element.
         *
         * **Syntax**: \`[ <family-name> | <generic-family> ]#\`
         *
         * **Initial value**: depends on user agent
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-family
         */
      fontFamily?: ConditionalValue<UtilityValues["fontFamily"] | CssProperties["fontFamily"] | AnyString>
       /**
         * The **\`font-feature-settings\`** CSS property controls advanced typographic features in OpenType fonts.
         *
         * **Syntax**: \`normal | <feature-tag-value>#\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |   IE   |
         * | :------: | :------: | :-----: | :----: | :----: |
         * |  **48**  |  **34**  | **9.1** | **15** | **10** |
         * | 16 _-x-_ | 15 _-x-_ |         |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-feature-settings
         */
      fontFeatureSettings?: ConditionalValue<CssProperties["fontFeatureSettings"] | AnyString>
       /**
         * The **\`font-kerning\`** CSS property sets the use of the kerning information stored in a font.
         *
         * **Syntax**: \`auto | normal | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **33** | **32**  |  **9**  | n/a  | No  |
         * |        |         | 6 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-kerning
         */
      fontKerning?: ConditionalValue<CssVars | CssProperties["fontKerning"] | AnyString>
       /**
         * The **\`font-language-override\`** CSS property controls the use of language-specific glyphs in a typeface.
         *
         * **Syntax**: \`normal | <string>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **34**  |   No   | n/a  | No  |
         * |        | 4 _-x-_ |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-language-override
         */
      fontLanguageOverride?: ConditionalValue<CssProperties["fontLanguageOverride"] | AnyString>
       /**
         * The **\`font-optical-sizing\`** CSS property sets whether text rendering is optimized for viewing at different sizes.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **79** | **62**  | **11** | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-optical-sizing
         */
      fontOpticalSizing?: ConditionalValue<CssProperties["fontOpticalSizing"] | AnyString>
       /**
         * **Syntax**: \`normal | light | dark | <palette-identifier>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **101** | **107** | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-palette
         */
      fontPalette?: ConditionalValue<CssProperties["fontPalette"] | AnyString>
       /**
         * The **\`font-variation-settings\`** CSS property provides low-level control over variable font characteristics, by specifying the four letter axis names of the characteristics you want to vary, along with their values.
         *
         * **Syntax**: \`normal | [ <string> <number> ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **62** | **62**  | **11** | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variation-settings
         */
      fontVariationSettings?: ConditionalValue<CssProperties["fontVariationSettings"] | AnyString>
       /**
         * The **\`font-size\`** CSS property sets the size of the font. Changing the font size also updates the sizes of the font size-relative \`<length>\` units, such as \`em\`, \`ex\`, and so forth.
         *
         * **Syntax**: \`<absolute-size> | <relative-size> | <length-percentage>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-size
         */
      fontSize?: ConditionalValue<UtilityValues["fontSize"] | CssProperties["fontSize"] | AnyString>
       /**
         * The **\`font-size-adjust\`** CSS property sets the size of lower-case letters relative to the current font size (which defines the size of upper-case letters).
         *
         * **Syntax**: \`none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * |   No   |  **3**  | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-size-adjust
         */
      fontSizeAdjust?: ConditionalValue<CssProperties["fontSizeAdjust"] | AnyString>
       /**
         * The **\`font-smooth\`** CSS property controls the application of anti-aliasing when fonts are rendered.
         *
         * **Syntax**: \`auto | never | always | <absolute-size> | <length>\`
         *
         * **Initial value**: \`auto\`
         *
         * |              Chrome              |              Firefox               |              Safari              | Edge | IE  |
         * | :------------------------------: | :--------------------------------: | :------------------------------: | :--: | :-: |
         * | **5** _(-webkit-font-smoothing)_ | **25** _(-moz-osx-font-smoothing)_ | **4** _(-webkit-font-smoothing)_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-smooth
         */
      fontSmooth?: ConditionalValue<CssProperties["fontSmooth"] | AnyString>
       /**
         * The **\`font-stretch\`** CSS property selects a normal, condensed, or expanded face from a font.
         *
         * **Syntax**: \`<font-stretch-absolute>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **60** |  **9**  | **11** | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-stretch
         */
      fontStretch?: ConditionalValue<CssProperties["fontStretch"] | AnyString>
       /**
         * The **\`font-style\`** CSS property sets whether a font should be styled with a normal, italic, or oblique face from its \`font-family\`.
         *
         * **Syntax**: \`normal | italic | oblique <angle>?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-style
         */
      fontStyle?: ConditionalValue<CssProperties["fontStyle"] | AnyString>
       /**
         * The **\`font-synthesis\`** CSS property controls which missing typefaces, bold, italic, or small-caps, may be synthesized by the browser.
         *
         * **Syntax**: \`none | [ weight || style || small-caps || position]\`
         *
         * **Initial value**: \`weight style small-caps position \`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **97** | **34**  | **9**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis
         */
      fontSynthesis?: ConditionalValue<CssProperties["fontSynthesis"] | AnyString>
       /**
         * The **\`font-synthesis-position\`** CSS property lets you specify whether or not a browser may synthesize the subscript and superscript "position" typefaces when they are missing in a font family, while using \`font-variant-position\` to set the positions.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **118** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-position
         */
      fontSynthesisPosition?: ConditionalValue<CssProperties["fontSynthesisPosition"] | AnyString>
       /**
         * The **\`font-synthesis-small-caps\`** CSS property lets you specify whether or not the browser may synthesize small-caps typeface when it is missing in a font family. Small-caps glyphs typically use the form of uppercase letters but are reduced to the size of lowercase letters.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-small-caps
         */
      fontSynthesisSmallCaps?: ConditionalValue<CssProperties["fontSynthesisSmallCaps"] | AnyString>
       /**
         * The **\`font-synthesis-style\`** CSS property lets you specify whether or not the browser may synthesize the oblique typeface when it is missing in a font family.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-style
         */
      fontSynthesisStyle?: ConditionalValue<CssProperties["fontSynthesisStyle"] | AnyString>
       /**
         * The **\`font-synthesis-weight\`** CSS property lets you specify whether or not the browser may synthesize the bold typeface when it is missing in a font family.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-weight
         */
      fontSynthesisWeight?: ConditionalValue<CssProperties["fontSynthesisWeight"] | AnyString>
       /**
         * The **\`font-variant\`** CSS shorthand property allows you to set all the font variants for a font.
         *
         * **Syntax**: \`normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant
         */
      fontVariant?: ConditionalValue<CssProperties["fontVariant"] | AnyString>
       /**
         * The **\`font-variant-alternates\`** CSS property controls the usage of alternate glyphs. These alternate glyphs may be referenced by alternative names defined in \`@font-feature-values\`.
         *
         * **Syntax**: \`normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  | Edge | IE  |
         * | :-----: | :-----: | :-----: | :--: | :-: |
         * | **111** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-alternates
         */
      fontVariantAlternates?: ConditionalValue<CssProperties["fontVariantAlternates"] | AnyString>
       /**
         * The **\`font-variant-caps\`** CSS property controls the use of alternate glyphs for capital letters.
         *
         * **Syntax**: \`normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **52** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-caps
         */
      fontVariantCaps?: ConditionalValue<CssProperties["fontVariantCaps"] | AnyString>
       /**
         * The **\`font-variant-east-asian\`** CSS property controls the use of alternate glyphs for East Asian scripts, like Japanese and Chinese.
         *
         * **Syntax**: \`normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **63** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-east-asian
         */
      fontVariantEastAsian?: ConditionalValue<CssProperties["fontVariantEastAsian"] | AnyString>
       /**
         * **Syntax**: \`normal | text | emoji | unicode\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-emoji
         */
      fontVariantEmoji?: ConditionalValue<CssProperties["fontVariantEmoji"] | AnyString>
       /**
         * The **\`font-variant-ligatures\`** CSS property controls which ligatures and contextual forms are used in textual content of the elements it applies to. This leads to more harmonized forms in the resulting text.
         *
         * **Syntax**: \`normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  | Edge | IE  |
         * | :------: | :-----: | :-----: | :--: | :-: |
         * |  **34**  | **34**  | **9.1** | n/a  | No  |
         * | 31 _-x-_ |         | 7 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-ligatures
         */
      fontVariantLigatures?: ConditionalValue<CssProperties["fontVariantLigatures"] | AnyString>
       /**
         * The **\`font-variant-numeric\`** CSS property controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
         *
         * **Syntax**: \`normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **52** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric
         */
      fontVariantNumeric?: ConditionalValue<CssProperties["fontVariantNumeric"] | AnyString>
       /**
         * The **\`font-variant-position\`** CSS property controls the use of alternate, smaller glyphs that are positioned as superscript or subscript.
         *
         * **Syntax**: \`normal | sub | super\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  | Edge | IE  |
         * | :-----: | :-----: | :-----: | :--: | :-: |
         * | **117** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-position
         */
      fontVariantPosition?: ConditionalValue<CssProperties["fontVariantPosition"] | AnyString>
       /**
         * The **\`font-weight\`** CSS property sets the weight (or boldness) of the font. The weights available depend on the \`font-family\` that is currently set.
         *
         * **Syntax**: \`<font-weight-absolute> | bolder | lighter\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-weight
         */
      fontWeight?: ConditionalValue<UtilityValues["fontWeight"] | CssProperties["fontWeight"] | AnyString>
       /**
         * The **\`forced-color-adjust\`** CSS property allows authors to opt certain elements out of forced colors mode. This then restores the control of those values to CSS.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |              Edge               |                 IE                  |
         * | :----: | :-----: | :----: | :-----------------------------: | :---------------------------------: |
         * | **89** | **113** |   No   |             **79**              | **10** _(-ms-high-contrast-adjust)_ |
         * |        |         |        | 12 _(-ms-high-contrast-adjust)_ |                                     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/forced-color-adjust
         */
      forcedColorAdjust?: ConditionalValue<CssVars | CssProperties["forcedColorAdjust"] | AnyString>
       /**
         * The **\`gap\`** CSS property sets the gaps (gutters) between rows and columns. It is a shorthand for \`row-gap\` and \`column-gap\`.
         *
         * **Syntax**: \`<'row-gap'> <'column-gap'>?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/gap
         */
      gap?: ConditionalValue<UtilityValues["gap"] | CssProperties["gap"] | AnyString>
       /**
         * The **\`grid\`** CSS property is a shorthand property that sets all of the explicit and implicit grid properties in a single declaration.
         *
         * **Syntax**: \`<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid
         */
      grid?: ConditionalValue<CssProperties["grid"] | AnyString>
       /**
         * The **\`grid-area\`** CSS shorthand property specifies a grid item's size and location within a grid by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the edges of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]{0,3}\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-area
         */
      gridArea?: ConditionalValue<CssProperties["gridArea"] | AnyString>
       /**
         * The **\`grid-auto-columns\`** CSS property specifies the size of an implicitly-created grid column track or pattern of tracks.
         *
         * **Syntax**: \`<track-size>+\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |             IE              |
         * | :----: | :-----: | :------: | :----: | :-------------------------: |
         * | **57** | **70**  | **10.1** | **16** | **10** _(-ms-grid-columns)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-columns
         */
      gridAutoColumns?: ConditionalValue<UtilityValues["gridAutoColumns"] | CssProperties["gridAutoColumns"] | AnyString>
       /**
         * The **\`grid-auto-flow\`** CSS property controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.
         *
         * **Syntax**: \`[ row | column ] || dense\`
         *
         * **Initial value**: \`row\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-flow
         */
      gridAutoFlow?: ConditionalValue<CssProperties["gridAutoFlow"] | AnyString>
       /**
         * The **\`grid-auto-rows\`** CSS property specifies the size of an implicitly-created grid row track or pattern of tracks.
         *
         * **Syntax**: \`<track-size>+\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |            IE            |
         * | :----: | :-----: | :------: | :----: | :----------------------: |
         * | **57** | **70**  | **10.1** | **16** | **10** _(-ms-grid-rows)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-rows
         */
      gridAutoRows?: ConditionalValue<UtilityValues["gridAutoRows"] | CssProperties["gridAutoRows"] | AnyString>
       /**
         * The **\`grid-column\`** CSS shorthand property specifies a grid item's size and location within a grid column by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column
         */
      gridColumn?: ConditionalValue<UtilityValues["gridColumn"] | CssProperties["gridColumn"] | AnyString>
       /**
         * The **\`grid-column-end\`** CSS property specifies a grid item's end position within the grid column by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the block-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column-end
         */
      gridColumnEnd?: ConditionalValue<CssProperties["gridColumnEnd"] | AnyString>
       gridColumnGap?: ConditionalValue<UtilityValues["gridColumnGap"] | CssProperties["gridColumnGap"] | AnyString>
       /**
         * The **\`grid-column-start\`** CSS property specifies a grid item's start position within the grid column by contributing a line, a span, or nothing (automatic) to its grid placement. This start position defines the block-start edge of the grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column-start
         */
      gridColumnStart?: ConditionalValue<CssProperties["gridColumnStart"] | AnyString>
       gridGap?: ConditionalValue<UtilityValues["gridGap"] | CssProperties["gridGap"] | AnyString>
       /**
         * The **\`grid-row\`** CSS shorthand property specifies a grid item's size and location within a grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row
         */
      gridRow?: ConditionalValue<UtilityValues["gridRow"] | CssProperties["gridRow"] | AnyString>
       /**
         * The **\`grid-row-end\`** CSS property specifies a grid item's end position within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row-end
         */
      gridRowEnd?: ConditionalValue<CssProperties["gridRowEnd"] | AnyString>
       gridRowGap?: ConditionalValue<UtilityValues["gridRowGap"] | CssProperties["gridRowGap"] | AnyString>
       /**
         * The **\`grid-row-start\`** CSS property specifies a grid item's start position within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row-start
         */
      gridRowStart?: ConditionalValue<CssProperties["gridRowStart"] | AnyString>
       /**
         * The **\`grid-template\`** CSS property is a shorthand property for defining grid columns, grid rows, and grid areas.
         *
         * **Syntax**: \`none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template
         */
      gridTemplate?: ConditionalValue<CssProperties["gridTemplate"] | AnyString>
       /**
         * The **\`grid-template-areas\`** CSS property specifies named grid areas, establishing the cells in the grid and assigning them names.
         *
         * **Syntax**: \`none | <string>+\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-areas
         */
      gridTemplateAreas?: ConditionalValue<CssProperties["gridTemplateAreas"] | AnyString>
       /**
         * The **\`grid-template-columns\`** CSS property defines the line names and track sizing functions of the grid columns.
         *
         * **Syntax**: \`none | <track-list> | <auto-track-list> | subgrid <line-name-list>?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |             IE              |
         * | :----: | :-----: | :------: | :----: | :-------------------------: |
         * | **57** | **52**  | **10.1** | **16** | **10** _(-ms-grid-columns)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-columns
         */
      gridTemplateColumns?: ConditionalValue<UtilityValues["gridTemplateColumns"] | CssProperties["gridTemplateColumns"] | AnyString>
       /**
         * The **\`grid-template-rows\`** CSS property defines the line names and track sizing functions of the grid rows.
         *
         * **Syntax**: \`none | <track-list> | <auto-track-list> | subgrid <line-name-list>?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |            IE            |
         * | :----: | :-----: | :------: | :----: | :----------------------: |
         * | **57** | **52**  | **10.1** | **16** | **10** _(-ms-grid-rows)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-rows
         */
      gridTemplateRows?: ConditionalValue<UtilityValues["gridTemplateRows"] | CssProperties["gridTemplateRows"] | AnyString>
       /**
         * The **\`hanging-punctuation\`** CSS property specifies whether a punctuation mark should hang at the start or end of a line of text. Hanging punctuation may be placed outside the line box.
         *
         * **Syntax**: \`none | [ first || [ force-end | allow-end ] || last ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   No    | **10** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hanging-punctuation
         */
      hangingPunctuation?: ConditionalValue<CssProperties["hangingPunctuation"] | AnyString>
       /**
         * The **\`height\`** CSS property specifies the height of an element. By default, the property defines the height of the content area. If \`box-sizing\` is set to \`border-box\`, however, it instead determines the height of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/height
         */
      height?: ConditionalValue<UtilityValues["height"] | CssProperties["height"] | AnyString>
       /**
         * The **\`hyphenate-character\`** CSS property sets the character (or string) used at the end of a line before a hyphenation break.
         *
         * **Syntax**: \`auto | <string>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |  Safari   | Edge | IE  |
         * | :-----: | :-----: | :-------: | :--: | :-: |
         * | **106** | **98**  |  **17**   | n/a  | No  |
         * | 6 _-x-_ |         | 5.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hyphenate-character
         */
      hyphenateCharacter?: ConditionalValue<CssProperties["hyphenateCharacter"] | AnyString>
       /**
         * The **\`hyphenate-limit-chars\`** CSS property specifies the minimum word length to allow hyphenation of words as well as the the minimum number of characters before and after the hyphen.
         *
         * **Syntax**: \`[ auto | <integer> ]{1,3}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** |   No    |   No   | n/a  | No  |
         */
      hyphenateLimitChars?: ConditionalValue<CssProperties["hyphenateLimitChars"] | AnyString>
       /**
         * The **\`hyphens\`** CSS property specifies how words should be hyphenated when text wraps across multiple lines. It can prevent hyphenation entirely, hyphenate at manually-specified points within the text, or let the browser automatically insert hyphens where appropriate.
         *
         * **Syntax**: \`none | manual | auto\`
         *
         * **Initial value**: \`manual\`
         *
         * |  Chrome  | Firefox |  Safari   |  Edge  |      IE      |
         * | :------: | :-----: | :-------: | :----: | :----------: |
         * |  **55**  | **43**  |  **17**   | **79** | **10** _-x-_ |
         * | 13 _-x-_ | 6 _-x-_ | 5.1 _-x-_ |        |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hyphens
         */
      hyphens?: ConditionalValue<CssProperties["hyphens"] | AnyString>
       /**
         * The **\`image-orientation\`** CSS property specifies a layout-independent correction to the orientation of an image.
         *
         * **Syntax**: \`from-image | <angle> | [ <angle>? flip ]\`
         *
         * **Initial value**: \`from-image\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **81** | **26**  | **13.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/image-orientation
         */
      imageOrientation?: ConditionalValue<CssProperties["imageOrientation"] | AnyString>
       /**
         * The **\`image-rendering\`** CSS property sets an image scaling algorithm. The property applies to an element itself, to any images set in its other properties, and to its descendants.
         *
         * **Syntax**: \`auto | crisp-edges | pixelated\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **13** | **3.6** | **6**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/image-rendering
         */
      imageRendering?: ConditionalValue<CssProperties["imageRendering"] | AnyString>
       /**
         * **Syntax**: \`[ from-image || <resolution> ] && snap?\`
         *
         * **Initial value**: \`1dppx\`
         */
      imageResolution?: ConditionalValue<CssProperties["imageResolution"] | AnyString>
       imeMode?: ConditionalValue<CssProperties["imeMode"] | AnyString>
       /**
         * The \`initial-letter\` CSS property sets styling for dropped, raised, and sunken initial letters.
         *
         * **Syntax**: \`normal | [ <number> <integer>? ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |   Safari    | Edge | IE  |
         * | :-----: | :-----: | :---------: | :--: | :-: |
         * | **110** |   No    | **9** _-x-_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/initial-letter
         */
      initialLetter?: ConditionalValue<CssProperties["initialLetter"] | AnyString>
       initialLetterAlign?: ConditionalValue<CssProperties["initialLetterAlign"] | AnyString>
       /**
         * The **\`inline-size\`** CSS property defines the horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`width\` or the \`height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inline-size
         */
      inlineSize?: ConditionalValue<UtilityValues["inlineSize"] | CssProperties["inlineSize"] | AnyString>
       /**
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         */
      inputSecurity?: ConditionalValue<CssProperties["inputSecurity"] | AnyString>
       /**
         * The **\`inset\`** CSS property is a shorthand that corresponds to the \`top\`, \`right\`, \`bottom\`, and/or \`left\` properties. It has the same multi-value syntax of the \`margin\` shorthand.
         *
         * **Syntax**: \`<'top'>{1,4}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset
         */
      inset?: ConditionalValue<UtilityValues["inset"] | CssProperties["inset"] | AnyString>
       /**
         * The **\`inset-block\`** CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block
         */
      insetBlock?: ConditionalValue<UtilityValues["insetBlock"] | CssProperties["insetBlock"] | AnyString>
       /**
         * The **\`inset-block-end\`** CSS property defines the logical block end offset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block-end
         */
      insetBlockEnd?: ConditionalValue<UtilityValues["insetBlockEnd"] | CssProperties["insetBlockEnd"] | AnyString>
       /**
         * The **\`inset-block-start\`** CSS property defines the logical block start offset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block-start
         */
      insetBlockStart?: ConditionalValue<UtilityValues["insetBlockStart"] | CssProperties["insetBlockStart"] | AnyString>
       /**
         * The **\`inset-inline\`** CSS property defines the logical start and end offsets of an element in the inline direction, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline
         */
      insetInline?: ConditionalValue<UtilityValues["insetInline"] | CssProperties["insetInline"] | AnyString>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      insetInlineEnd?: ConditionalValue<UtilityValues["insetInlineEnd"] | CssProperties["insetInlineEnd"] | AnyString>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      insetInlineStart?: ConditionalValue<UtilityValues["insetInlineStart"] | CssProperties["insetInlineStart"] | AnyString>
       /**
         * The **\`isolation\`** CSS property determines whether an element must create a new stacking context.
         *
         * **Syntax**: \`auto | isolate\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **41** | **36**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/isolation
         */
      isolation?: ConditionalValue<CssVars | CssProperties["isolation"] | AnyString>
       /**
         * The CSS **\`justify-content\`** property defines how the browser distributes space between and around content items along the main-axis of a flex container, and the inline axis of a grid container.
         *
         * **Syntax**: \`normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-content
         */
      justifyContent?: ConditionalValue<CssProperties["justifyContent"] | AnyString>
       /**
         * The CSS **\`justify-items\`** property defines the default \`justify-self\` for all items of the box, giving them all a default way of justifying each box along the appropriate axis.
         *
         * **Syntax**: \`normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]\`
         *
         * **Initial value**: \`legacy\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **52** | **20**  | **9**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-items
         */
      justifyItems?: ConditionalValue<CssProperties["justifyItems"] | AnyString>
       /**
         * The CSS **\`justify-self\`** property sets the way a box is justified inside its alignment container along the appropriate axis.
         *
         * **Syntax**: \`auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :------: | :----: | :----: |
         * | **57** | **45**  | **10.1** | **16** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-self
         */
      justifySelf?: ConditionalValue<CssProperties["justifySelf"] | AnyString>
       /**
         * The **\`justify-tracks\`** CSS property sets the alignment in the masonry axis for grid containers that have masonry in their inline axis.
         *
         * **Syntax**: \`[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-tracks
         */
      justifyTracks?: ConditionalValue<CssProperties["justifyTracks"] | AnyString>
       /**
         * The **\`left\`** CSS property participates in specifying the horizontal position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/left
         */
      left?: ConditionalValue<UtilityValues["left"] | CssProperties["left"] | AnyString>
       /**
         * The **\`letter-spacing\`** CSS property sets the horizontal spacing behavior between text characters. This value is added to the natural spacing between characters while rendering the text. Positive values of \`letter-spacing\` causes characters to spread farther apart, while negative values of \`letter-spacing\` bring characters closer together.
         *
         * **Syntax**: \`normal | <length>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/letter-spacing
         */
      letterSpacing?: ConditionalValue<UtilityValues["letterSpacing"] | CssProperties["letterSpacing"] | AnyString>
       /**
         * The **\`line-break\`** CSS property sets how to break lines of Chinese, Japanese, or Korean (CJK) text when working with punctuation and symbols.
         *
         * **Syntax**: \`auto | loose | normal | strict | anywhere\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE    |
         * | :-----: | :-----: | :-----: | :----: | :-----: |
         * | **58**  | **69**  | **11**  | **14** | **5.5** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |         |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-break
         */
      lineBreak?: ConditionalValue<CssVars | CssProperties["lineBreak"] | AnyString>
       /**
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      lineClamp?: ConditionalValue<CssProperties["lineClamp"] | AnyString>
       /**
         * The **\`line-height\`** CSS property sets the height of a line box. It's commonly used to set the distance between lines of text. On block-level elements, it specifies the minimum height of line boxes within the element. On non-replaced inline elements, it specifies the height that is used to calculate line box height.
         *
         * **Syntax**: \`normal | <number> | <length> | <percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-height
         */
      lineHeight?: ConditionalValue<UtilityValues["lineHeight"] | CssProperties["lineHeight"] | AnyString>
       /**
         * The **\`line-height-step\`** CSS property sets the step unit for line box heights. When the property is set, line box heights are rounded up to the closest multiple of the unit.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |  n/a   |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-height-step
         */
      lineHeightStep?: ConditionalValue<CssProperties["lineHeightStep"] | AnyString>
       /**
         * The **\`list-style\`** CSS shorthand property allows you to set all the list style properties at once.
         *
         * **Syntax**: \`<'list-style-type'> || <'list-style-position'> || <'list-style-image'>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style
         */
      listStyle?: ConditionalValue<CssProperties["listStyle"] | AnyString>
       /**
         * The **\`list-style-image\`** CSS property sets an image to be used as the list item marker.
         *
         * **Syntax**: \`<image> | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-image
         */
      listStyleImage?: ConditionalValue<CssProperties["listStyleImage"] | AnyString>
       /**
         * The **\`list-style-position\`** CSS property sets the position of the \`::marker\` relative to a list item.
         *
         * **Syntax**: \`inside | outside\`
         *
         * **Initial value**: \`outside\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-position
         */
      listStylePosition?: ConditionalValue<CssProperties["listStylePosition"] | AnyString>
       /**
         * The **\`list-style-type\`** CSS property sets the marker (such as a disc, character, or custom counter style) of a list item element.
         *
         * **Syntax**: \`<counter-style> | <string> | none\`
         *
         * **Initial value**: \`disc\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-type
         */
      listStyleType?: ConditionalValue<CssProperties["listStyleType"] | AnyString>
       /**
         * The **\`margin\`** CSS shorthand property sets the margin area on all four sides of an element.
         *
         * **Syntax**: \`[ <length> | <percentage> | auto ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin
         */
      margin?: ConditionalValue<UtilityValues["margin"] | CssProperties["margin"] | AnyString>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      marginBlock?: ConditionalValue<UtilityValues["marginBlock"] | CssProperties["marginBlock"] | AnyString>
       /**
         * The **\`margin-block-end\`** CSS property defines the logical block end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block-end
         */
      marginBlockEnd?: ConditionalValue<UtilityValues["marginBlockEnd"] | CssProperties["marginBlockEnd"] | AnyString>
       /**
         * The **\`margin-block-start\`** CSS property defines the logical block start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block-start
         */
      marginBlockStart?: ConditionalValue<UtilityValues["marginBlockStart"] | CssProperties["marginBlockStart"] | AnyString>
       /**
         * The **\`margin-bottom\`** CSS property sets the margin area on the bottom of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-bottom
         */
      marginBottom?: ConditionalValue<UtilityValues["marginBottom"] | CssProperties["marginBottom"] | AnyString>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      marginInline?: ConditionalValue<UtilityValues["marginInline"] | CssProperties["marginInline"] | AnyString>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      marginInlineEnd?: ConditionalValue<UtilityValues["marginInlineEnd"] | CssProperties["marginInlineEnd"] | AnyString>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      marginInlineStart?: ConditionalValue<UtilityValues["marginInlineStart"] | CssProperties["marginInlineStart"] | AnyString>
       /**
         * The **\`margin-left\`** CSS property sets the margin area on the left side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-left
         */
      marginLeft?: ConditionalValue<UtilityValues["marginLeft"] | CssProperties["marginLeft"] | AnyString>
       /**
         * The **\`margin-right\`** CSS property sets the margin area on the right side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-right
         */
      marginRight?: ConditionalValue<UtilityValues["marginRight"] | CssProperties["marginRight"] | AnyString>
       /**
         * The **\`margin-top\`** CSS property sets the margin area on the top of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-top
         */
      marginTop?: ConditionalValue<UtilityValues["marginTop"] | CssProperties["marginTop"] | AnyString>
       /**
         * The \`margin-trim\` property allows the container to trim the margins of its children where they adjoin the container's edges.
         *
         * **Syntax**: \`none | in-flow | all\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * |   No   |   No    | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-trim
         */
      marginTrim?: ConditionalValue<CssProperties["marginTrim"] | AnyString>
       /**
         * The **\`mask\`** CSS shorthand property hides an element (partially or fully) by masking or clipping the image at specific points.
         *
         * **Syntax**: \`<mask-layer>#\`
         *
         * | Chrome | Firefox |  Safari   | Edge  | IE  |
         * | :----: | :-----: | :-------: | :---: | :-: |
         * | **1**  | **53**  | **15.4**  | 12-79 | No  |
         * |        |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask
         */
      mask?: ConditionalValue<CssProperties["mask"] | AnyString>
       /**
         * The **\`mask-border\`** CSS shorthand property lets you create a mask along the edge of an element's border.
         *
         * **Syntax**: \`<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>\`
         *
         * |              Chrome              | Firefox |             Safari             | Edge | IE  |
         * | :------------------------------: | :-----: | :----------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image)_ |   No    |            **17.2**            | n/a  | No  |
         * |                                  |         | 3.1 _(-webkit-mask-box-image)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border
         */
      maskBorder?: ConditionalValue<CssProperties["maskBorder"] | AnyString>
       /**
         * The **\`mask-border-mode\`** CSS property specifies the blending mode used in a mask border.
         *
         * **Syntax**: \`luminance | alpha\`
         *
         * **Initial value**: \`alpha\`
         */
      maskBorderMode?: ConditionalValue<CssProperties["maskBorderMode"] | AnyString>
       /**
         * The **\`mask-border-outset\`** CSS property specifies the distance by which an element's mask border is set out from its border box.
         *
         * **Syntax**: \`[ <length> | <number> ]{1,4}\`
         *
         * **Initial value**: \`0\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-outset)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-outset)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-outset
         */
      maskBorderOutset?: ConditionalValue<CssProperties["maskBorderOutset"] | AnyString>
       /**
         * The **\`mask-border-repeat\`** CSS property sets how the edge regions of a source image are adjusted to fit the dimensions of an element's mask border.
         *
         * **Syntax**: \`[ stretch | repeat | round | space ]{1,2}\`
         *
         * **Initial value**: \`stretch\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-repeat)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-repeat)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-repeat
         */
      maskBorderRepeat?: ConditionalValue<CssProperties["maskBorderRepeat"] | AnyString>
       /**
         * The **\`mask-border-slice\`** CSS property divides the image set by \`mask-border-source\` into regions. These regions are used to form the components of an element's mask border.
         *
         * **Syntax**: \`<number-percentage>{1,4} fill?\`
         *
         * **Initial value**: \`0\`
         *
         * |                 Chrome                 | Firefox |                Safari                | Edge | IE  |
         * | :------------------------------------: | :-----: | :----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-slice)_ |   No    |               **17.2**               | n/a  | No  |
         * |                                        |         | 3.1 _(-webkit-mask-box-image-slice)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-slice
         */
      maskBorderSlice?: ConditionalValue<CssProperties["maskBorderSlice"] | AnyString>
       /**
         * The **\`mask-border-source\`** CSS property sets the source image used to create an element's mask border.
         *
         * **Syntax**: \`none | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-source)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-source)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-source
         */
      maskBorderSource?: ConditionalValue<CssProperties["maskBorderSource"] | AnyString>
       /**
         * The **\`mask-border-width\`** CSS property sets the width of an element's mask border.
         *
         * **Syntax**: \`[ <length-percentage> | <number> | auto ]{1,4}\`
         *
         * **Initial value**: \`auto\`
         *
         * |                 Chrome                 | Firefox |                Safari                | Edge | IE  |
         * | :------------------------------------: | :-----: | :----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-width)_ |   No    |               **17.2**               | n/a  | No  |
         * |                                        |         | 3.1 _(-webkit-mask-box-image-width)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-width
         */
      maskBorderWidth?: ConditionalValue<CssProperties["maskBorderWidth"] | AnyString>
       /**
         * The **\`mask-clip\`** CSS property determines the area which is affected by a mask. The painted content of an element must be restricted to this area.
         *
         * **Syntax**: \`[ <geometry-box> | no-clip ]#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-clip
         */
      maskClip?: ConditionalValue<CssProperties["maskClip"] | AnyString>
       /**
         * The **\`mask-composite\`** CSS property represents a compositing operation used on the current mask layer with the mask layers below it.
         *
         * **Syntax**: \`<compositing-operator>#\`
         *
         * **Initial value**: \`add\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 18-79 | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-composite
         */
      maskComposite?: ConditionalValue<CssProperties["maskComposite"] | AnyString>
       /**
         * The **\`mask-image\`** CSS property sets the image that is used as mask layer for an element. By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. This can be controlled with the \`mask-mode\` property.
         *
         * **Syntax**: \`<mask-reference>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 16-79 | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-image
         */
      maskImage?: ConditionalValue<CssProperties["maskImage"] | AnyString>
       /**
         * The **\`mask-mode\`** CSS property sets whether the mask reference defined by \`mask-image\` is treated as a luminance or alpha mask.
         *
         * **Syntax**: \`<masking-mode>#\`
         *
         * **Initial value**: \`match-source\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-mode
         */
      maskMode?: ConditionalValue<CssProperties["maskMode"] | AnyString>
       /**
         * The **\`mask-origin\`** CSS property sets the origin of a mask.
         *
         * **Syntax**: \`<geometry-box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-origin
         */
      maskOrigin?: ConditionalValue<CssProperties["maskOrigin"] | AnyString>
       /**
         * The **\`mask-position\`** CSS property sets the initial position, relative to the mask position layer set by \`mask-origin\`, for each defined mask image.
         *
         * **Syntax**: \`<position>#\`
         *
         * **Initial value**: \`center\`
         *
         * | Chrome  | Firefox |  Safari   | Edge  | IE  |
         * | :-----: | :-----: | :-------: | :---: | :-: |
         * | **120** | **53**  | **15.4**  | 18-79 | No  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-position
         */
      maskPosition?: ConditionalValue<CssProperties["maskPosition"] | AnyString>
       /**
         * The **\`mask-repeat\`** CSS property sets how mask images are repeated. A mask image can be repeated along the horizontal axis, the vertical axis, both axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome  | Firefox |  Safari   | Edge  | IE  |
         * | :-----: | :-----: | :-------: | :---: | :-: |
         * | **120** | **53**  | **15.4**  | 18-79 | No  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-repeat
         */
      maskRepeat?: ConditionalValue<CssProperties["maskRepeat"] | AnyString>
       /**
         * The **\`mask-size\`** CSS property specifies the sizes of the mask images. The size of the image can be fully or partially constrained in order to preserve its intrinsic ratio.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 18-79 | No  |
         * | 4 _-x-_ |         | 4 _-x-_  |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-size
         */
      maskSize?: ConditionalValue<CssProperties["maskSize"] | AnyString>
       /**
         * The **\`mask-type\`** CSS property sets whether an SVG \`<mask>\` element is used as a _luminance_ or an _alpha_ mask. It applies to the \`<mask>\` element itself.
         *
         * **Syntax**: \`luminance | alpha\`
         *
         * **Initial value**: \`luminance\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **24** | **35**  | **7**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-type
         */
      maskType?: ConditionalValue<CssProperties["maskType"] | AnyString>
       /**
         * This feature is not Baseline because it does not work in some of the most widely-used browsers.
         *
         * **Syntax**: \`[ pack | next ] || [ definite-first | ordered ]\`
         *
         * **Initial value**: \`pack\`
         *
         * | Chrome | Firefox |   Safari    | Edge | IE  |
         * | :----: | :-----: | :---------: | :--: | :-: |
         * |   No   |   No    | **preview** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/masonry-auto-flow
         */
      masonryAutoFlow?: ConditionalValue<CssProperties["masonryAutoFlow"] | AnyString>
       /**
         * The **\`math-depth\`** property describes a notion of _depth_ for each element of a mathematical formula, with respect to the top-level container of that formula. Concretely, this is used to determine the computed value of the font-size property when its specified value is \`math\`.
         *
         * **Syntax**: \`auto-add | add(<integer>) | <integer>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** | **117** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-depth
         */
      mathDepth?: ConditionalValue<CssProperties["mathDepth"] | AnyString>
       /**
         * The \`math-shift\` property indicates whether superscripts inside MathML formulas should be raised by a normal or compact shift.
         *
         * **Syntax**: \`normal | compact\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-shift
         */
      mathShift?: ConditionalValue<CssProperties["mathShift"] | AnyString>
       /**
         * The \`math-style\` property indicates whether MathML equations should render with normal or compact height.
         *
         * **Syntax**: \`normal | compact\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **109** | **117** | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-style
         */
      mathStyle?: ConditionalValue<CssProperties["mathStyle"] | AnyString>
       /**
         * The **\`max-block-size\`** CSS property specifies the maximum size of an element in the direction opposite that of the writing direction as specified by \`writing-mode\`. That is, if the writing direction is horizontal, then \`max-block-size\` is equivalent to \`max-height\`; if the writing direction is vertical, \`max-block-size\` is the same as \`max-width\`.
         *
         * **Syntax**: \`<'max-width'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-block-size
         */
      maxBlockSize?: ConditionalValue<UtilityValues["maxBlockSize"] | CssProperties["maxBlockSize"] | AnyString>
       /**
         * The **\`max-height\`** CSS property sets the maximum height of an element. It prevents the used value of the \`height\` property from becoming larger than the value specified for \`max-height\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **18** |  **1**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-height
         */
      maxHeight?: ConditionalValue<UtilityValues["maxHeight"] | CssProperties["maxHeight"] | AnyString>
       /**
         * The **\`max-inline-size\`** CSS property defines the horizontal or vertical maximum size of an element's block, depending on its writing mode. It corresponds to either the \`max-width\` or the \`max-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'max-width'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |   Safari   | Edge | IE  |
         * | :----: | :-----: | :--------: | :--: | :-: |
         * | **57** | **41**  |  **12.1**  | n/a  | No  |
         * |        |         | 10.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-inline-size
         */
      maxInlineSize?: ConditionalValue<UtilityValues["maxInlineSize"] | CssProperties["maxInlineSize"] | AnyString>
       /**
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      maxLines?: ConditionalValue<CssProperties["maxLines"] | AnyString>
       /**
         * The **\`max-width\`** CSS property sets the maximum width of an element. It prevents the used value of the \`width\` property from becoming larger than the value specified by \`max-width\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-width
         */
      maxWidth?: ConditionalValue<UtilityValues["maxWidth"] | CssProperties["maxWidth"] | AnyString>
       /**
         * The **\`min-block-size\`** CSS property defines the minimum horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`min-width\` or the \`min-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'min-width'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-block-size
         */
      minBlockSize?: ConditionalValue<UtilityValues["minBlockSize"] | CssProperties["minBlockSize"] | AnyString>
       /**
         * The **\`min-height\`** CSS property sets the minimum height of an element. It prevents the used value of the \`height\` property from becoming smaller than the value specified for \`min-height\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **3**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-height
         */
      minHeight?: ConditionalValue<UtilityValues["minHeight"] | CssProperties["minHeight"] | AnyString>
       /**
         * The **\`min-inline-size\`** CSS property defines the horizontal or vertical minimal size of an element's block, depending on its writing mode. It corresponds to either the \`min-width\` or the \`min-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'min-width'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-inline-size
         */
      minInlineSize?: ConditionalValue<UtilityValues["minInlineSize"] | CssProperties["minInlineSize"] | AnyString>
       /**
         * The **\`min-width\`** CSS property sets the minimum width of an element. It prevents the used value of the \`width\` property from becoming smaller than the value specified for \`min-width\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-width
         */
      minWidth?: ConditionalValue<UtilityValues["minWidth"] | CssProperties["minWidth"] | AnyString>
       /**
         * The **\`mix-blend-mode\`** CSS property sets how an element's content should blend with the content of the element's parent and the element's background.
         *
         * **Syntax**: \`<blend-mode> | plus-lighter\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **41** | **32**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mix-blend-mode
         */
      mixBlendMode?: ConditionalValue<CssVars | CssProperties["mixBlendMode"] | AnyString>
       /**
         * The **\`object-fit\`** CSS property sets how the content of a replaced element, such as an \`<img>\` or \`<video>\`, should be resized to fit its container.
         *
         * **Syntax**: \`fill | contain | cover | none | scale-down\`
         *
         * **Initial value**: \`fill\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **32** | **36**  | **10** | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/object-fit
         */
      objectFit?: ConditionalValue<CssVars | CssProperties["objectFit"] | AnyString>
       /**
         * The **\`object-position\`** CSS property specifies the alignment of the selected replaced element's contents within the element's box. Areas of the box which aren't covered by the replaced element's object will show the element's background.
         *
         * **Syntax**: \`<position>\`
         *
         * **Initial value**: \`50% 50%\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **32** | **36**  | **10** | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/object-position
         */
      objectPosition?: ConditionalValue<CssProperties["objectPosition"] | AnyString>
       /**
         * The **\`offset\`** CSS shorthand property sets all the properties required for animating an element along a defined path.
         *
         * **Syntax**: \`[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?\`
         *
         * |    Chrome     | Firefox | Safari | Edge | IE  |
         * | :-----------: | :-----: | :----: | :--: | :-: |
         * |    **55**     | **72**  | **16** | n/a  | No  |
         * | 46 _(motion)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset
         */
      offset?: ConditionalValue<CssProperties["offset"] | AnyString>
       /**
         * **Syntax**: \`auto | <position>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** | **72**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-anchor
         */
      offsetAnchor?: ConditionalValue<CssProperties["offsetAnchor"] | AnyString>
       /**
         * The **\`offset-distance\`** CSS property specifies a position along an \`offset-path\` for an element to be placed.
         *
         * **Syntax**: \`<length-percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * |         Chrome         | Firefox | Safari | Edge | IE  |
         * | :--------------------: | :-----: | :----: | :--: | :-: |
         * |         **55**         | **72**  | **16** | n/a  | No  |
         * | 46 _(motion-distance)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-distance
         */
      offsetDistance?: ConditionalValue<CssProperties["offsetDistance"] | AnyString>
       /**
         * The **\`offset-path\`** CSS property specifies a motion path for an element to follow and defines the element's positioning within the parent container or SVG coordinate system.
         *
         * **Syntax**: \`none | <offset-path> || <coord-box>\`
         *
         * **Initial value**: \`none\`
         *
         * |       Chrome       | Firefox |  Safari  | Edge | IE  |
         * | :----------------: | :-----: | :------: | :--: | :-: |
         * |       **55**       | **72**  | **15.4** | n/a  | No  |
         * | 46 _(motion-path)_ |         |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-path
         */
      offsetPath?: ConditionalValue<CssProperties["offsetPath"] | AnyString>
       /**
         * **Syntax**: \`normal | auto | <position>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** |   n/a   | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-position
         */
      offsetPosition?: ConditionalValue<CssProperties["offsetPosition"] | AnyString>
       /**
         * The **\`offset-rotate\`** CSS property defines the orientation/direction of the element as it is positioned along the \`offset-path\`.
         *
         * **Syntax**: \`[ auto | reverse ] || <angle>\`
         *
         * **Initial value**: \`auto\`
         *
         * |         Chrome         | Firefox | Safari | Edge | IE  |
         * | :--------------------: | :-----: | :----: | :--: | :-: |
         * |         **56**         | **72**  | **16** | n/a  | No  |
         * | 46 _(motion-rotation)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-rotate
         */
      offsetRotate?: ConditionalValue<CssProperties["offsetRotate"] | AnyString>
       /**
         * The **\`opacity\`** CSS property sets the opacity of an element. Opacity is the degree to which content behind an element is hidden, and is the opposite of transparency.
         *
         * **Syntax**: \`<alpha-value>\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **2**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/opacity
         */
      opacity?: ConditionalValue<CssProperties["opacity"] | AnyString>
       /**
         * The **\`order\`** CSS property sets the order to lay out an item in a flex or grid container. Items in a container are sorted by ascending \`order\` value and then by their source code order.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`0\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |    IE    |
         * | :------: | :-----: | :-----: | :----: | :------: |
         * |  **29**  | **20**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ |         | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/order
         */
      order?: ConditionalValue<CssProperties["order"] | AnyString>
       /**
         * The **\`orphans\`** CSS property sets the minimum number of lines in a block container that must be shown at the _bottom_ of a page, region, or column.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`2\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **25** |   No    | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/orphans
         */
      orphans?: ConditionalValue<CssProperties["orphans"] | AnyString>
       /**
         * The **\`outline\`** CSS shorthand property sets most of the outline properties in a single declaration.
         *
         * **Syntax**: \`[ <'outline-color'> || <'outline-style'> || <'outline-width'> ]\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **94** | **88**  | **16.4** | **94** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline
         */
      outline?: ConditionalValue<UtilityValues["outline"] | CssProperties["outline"] | AnyString>
       /**
         * The **\`outline-color\`** CSS property sets the color of an element's outline.
         *
         * **Syntax**: \`<color> | invert\`
         *
         * **Initial value**: \`invert\`, for browsers supporting it, \`currentColor\` for the other
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-color
         */
      outlineColor?: ConditionalValue<UtilityValues["outlineColor"] | CssProperties["outlineColor"] | AnyString>
       /**
         * The **\`outline-offset\`** CSS property sets the amount of space between an outline and the edge or border of an element.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari  |  Edge  | IE  |
         * | :----: | :-----: | :-----: | :----: | :-: |
         * | **1**  | **1.5** | **1.2** | **15** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-offset
         */
      outlineOffset?: ConditionalValue<UtilityValues["outlineOffset"] | CssProperties["outlineOffset"] | AnyString>
       /**
         * The **\`outline-style\`** CSS property sets the style of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`auto | <'border-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-style
         */
      outlineStyle?: ConditionalValue<CssVars | CssProperties["outlineStyle"] | AnyString>
       /**
         * The CSS **\`outline-width\`** property sets the thickness of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-width
         */
      outlineWidth?: ConditionalValue<CssProperties["outlineWidth"] | AnyString>
       /**
         * The **\`overflow\`** CSS shorthand property sets the desired behavior for an element's overflow — i.e. when an element's content is too big to fit in its block formatting context — in both directions.
         *
         * **Syntax**: \`[ visible | hidden | clip | scroll | auto ]{1,2}\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow
         */
      overflow?: ConditionalValue<CssVars | CssProperties["overflow"] | AnyString>
       /**
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **56** | **66**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-anchor
         */
      overflowAnchor?: ConditionalValue<CssProperties["overflowAnchor"] | AnyString>
       /**
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **69**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-block
         */
      overflowBlock?: ConditionalValue<CssVars | CssProperties["overflowBlock"] | AnyString>
       /**
         * The **\`overflow-clip-box\`** CSS property specifies relative to which box the clipping happens when there is an overflow. It is short hand for the \`overflow-clip-box-inline\` and \`overflow-clip-box-block\` properties.
         *
         * **Syntax**: \`padding-box | content-box\`
         *
         * **Initial value**: \`padding-box\`
         */
      overflowClipBox?: ConditionalValue<CssProperties["overflowClipBox"] | AnyString>
       /**
         * **Syntax**: \`<visual-box> || <length [0,∞]>\`
         *
         * **Initial value**: \`0px\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **90** | **102** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-clip-margin
         */
      overflowClipMargin?: ConditionalValue<CssProperties["overflowClipMargin"] | AnyString>
       /**
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **69**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-inline
         */
      overflowInline?: ConditionalValue<CssVars | CssProperties["overflowInline"] | AnyString>
       /**
         * The **\`overflow-wrap\`** CSS property applies to inline elements, setting whether the browser should insert line breaks within an otherwise unbreakable string to prevent text from overflowing its line box.
         *
         * **Syntax**: \`normal | break-word | anywhere\`
         *
         * **Initial value**: \`normal\`
         *
         * |     Chrome      |      Firefox      |     Safari      |       Edge       |          IE           |
         * | :-------------: | :---------------: | :-------------: | :--------------: | :-------------------: |
         * |     **23**      |      **49**       |      **7**      |      **18**      | **5.5** _(word-wrap)_ |
         * | 1 _(word-wrap)_ | 3.5 _(word-wrap)_ | 1 _(word-wrap)_ | 12 _(word-wrap)_ |                       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-wrap
         */
      overflowWrap?: ConditionalValue<CssVars | CssProperties["overflowWrap"] | AnyString>
       /**
         * The **\`overflow-x\`** CSS property sets what shows when content overflows a block-level element's left and right edges. This may be nothing, a scroll bar, or the overflow content.
         *
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **3.5** | **3**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-x
         */
      overflowX?: ConditionalValue<CssVars | CssProperties["overflowX"] | AnyString>
       /**
         * The **\`overflow-y\`** CSS property sets what shows when content overflows a block-level element's top and bottom edges. This may be nothing, a scroll bar, or the overflow content.
         *
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **3.5** | **3**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-y
         */
      overflowY?: ConditionalValue<CssVars | CssProperties["overflowY"] | AnyString>
       /**
         * The **\`overlay\`** CSS property specifies whether an element appearing in the top layer (for example, a shown popover or modal \`<dialog>\` element) is actually rendered in the top layer. This property is only relevant within a list of \`transition-property\` values, and only if \`allow-discrete\` is set as the \`transition-behavior\`.
         *
         * **Syntax**: \`none | auto\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **117** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overlay
         */
      overlay?: ConditionalValue<CssProperties["overlay"] | AnyString>
       /**
         * The **\`overscroll-behavior\`** CSS property sets what a browser does when reaching the boundary of a scrolling area. It's a shorthand for \`overscroll-behavior-x\` and \`overscroll-behavior-y\`.
         *
         * **Syntax**: \`[ contain | none | auto ]{1,2}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior
         */
      overscrollBehavior?: ConditionalValue<CssProperties["overscrollBehavior"] | AnyString>
       /**
         * The **\`overscroll-behavior-block\`** CSS property sets the browser's behavior when the block direction boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **77** | **73**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-block
         */
      overscrollBehaviorBlock?: ConditionalValue<CssProperties["overscrollBehaviorBlock"] | AnyString>
       /**
         * The **\`overscroll-behavior-inline\`** CSS property sets the browser's behavior when the inline direction boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **77** | **73**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-inline
         */
      overscrollBehaviorInline?: ConditionalValue<CssProperties["overscrollBehaviorInline"] | AnyString>
       /**
         * The **\`overscroll-behavior-x\`** CSS property sets the browser's behavior when the horizontal boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-x
         */
      overscrollBehaviorX?: ConditionalValue<CssProperties["overscrollBehaviorX"] | AnyString>
       /**
         * The **\`overscroll-behavior-y\`** CSS property sets the browser's behavior when the vertical boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-y
         */
      overscrollBehaviorY?: ConditionalValue<CssProperties["overscrollBehaviorY"] | AnyString>
       /**
         * The **\`padding\`** CSS shorthand property sets the padding area on all four sides of an element at once.
         *
         * **Syntax**: \`[ <length> | <percentage> ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding
         */
      padding?: ConditionalValue<UtilityValues["padding"] | CssProperties["padding"] | AnyString>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      paddingBlock?: ConditionalValue<UtilityValues["paddingBlock"] | CssProperties["paddingBlock"] | AnyString>
       /**
         * The **\`padding-block-end\`** CSS property defines the logical block end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block-end
         */
      paddingBlockEnd?: ConditionalValue<UtilityValues["paddingBlockEnd"] | CssProperties["paddingBlockEnd"] | AnyString>
       /**
         * The **\`padding-block-start\`** CSS property defines the logical block start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block-start
         */
      paddingBlockStart?: ConditionalValue<UtilityValues["paddingBlockStart"] | CssProperties["paddingBlockStart"] | AnyString>
       /**
         * The **\`padding-bottom\`** CSS property sets the height of the padding area on the bottom of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-bottom
         */
      paddingBottom?: ConditionalValue<UtilityValues["paddingBottom"] | CssProperties["paddingBottom"] | AnyString>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      paddingInline?: ConditionalValue<UtilityValues["paddingInline"] | CssProperties["paddingInline"] | AnyString>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      paddingInlineEnd?: ConditionalValue<UtilityValues["paddingInlineEnd"] | CssProperties["paddingInlineEnd"] | AnyString>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      paddingInlineStart?: ConditionalValue<UtilityValues["paddingInlineStart"] | CssProperties["paddingInlineStart"] | AnyString>
       /**
         * The **\`padding-left\`** CSS property sets the width of the padding area to the left of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-left
         */
      paddingLeft?: ConditionalValue<UtilityValues["paddingLeft"] | CssProperties["paddingLeft"] | AnyString>
       /**
         * The **\`padding-right\`** CSS property sets the width of the padding area on the right of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-right
         */
      paddingRight?: ConditionalValue<UtilityValues["paddingRight"] | CssProperties["paddingRight"] | AnyString>
       /**
         * The **\`padding-top\`** CSS property sets the height of the padding area on the top of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-top
         */
      paddingTop?: ConditionalValue<UtilityValues["paddingTop"] | CssProperties["paddingTop"] | AnyString>
       /**
         * The **\`page\`** CSS property is used to specify the named page, a specific type of page defined by the \`@page\` at-rule.
         *
         * **Syntax**: \`auto | <custom-ident>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari   | Edge | IE  |
         * | :----: | :-----: | :-------: | :--: | :-: |
         * | **85** | **110** | **≤13.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page
         */
      page?: ConditionalValue<CssProperties["page"] | AnyString>
       /**
         * The **\`page-break-after\`** CSS property adjusts page breaks _after_ the current element.
         *
         * **Syntax**: \`auto | always | avoid | left | right | recto | verso\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-after
         */
      pageBreakAfter?: ConditionalValue<CssProperties["pageBreakAfter"] | AnyString>
       /**
         * The **\`page-break-before\`** CSS property adjusts page breaks _before_ the current element.
         *
         * **Syntax**: \`auto | always | avoid | left | right | recto | verso\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-before
         */
      pageBreakBefore?: ConditionalValue<CssProperties["pageBreakBefore"] | AnyString>
       /**
         * The **\`page-break-inside\`** CSS property adjusts page breaks _inside_ the current element.
         *
         * **Syntax**: \`auto | avoid\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **19**  | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-inside
         */
      pageBreakInside?: ConditionalValue<CssProperties["pageBreakInside"] | AnyString>
       /**
         * The **\`paint-order\`** CSS property lets you control the order in which the fill and stroke (and painting markers) of text content and shapes are drawn.
         *
         * **Syntax**: \`normal | [ fill || stroke || markers ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **35** | **60**  | **8**  | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/paint-order
         */
      paintOrder?: ConditionalValue<CssProperties["paintOrder"] | AnyString>
       /**
         * The **\`perspective\`** CSS property determines the distance between the z=0 plane and the user in order to give a 3D-positioned element some perspective.
         *
         * **Syntax**: \`none | <length>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **36**  | **16**  |  **9**  | **12** | **10** |
         * | 12 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/perspective
         */
      perspective?: ConditionalValue<CssProperties["perspective"] | AnyString>
       /**
         * The **\`perspective-origin\`** CSS property determines the position at which the viewer is looking. It is used as the _vanishing point_ by the \`perspective\` property.
         *
         * **Syntax**: \`<position>\`
         *
         * **Initial value**: \`50% 50%\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **36**  | **16**  |  **9**  | **12** | **10** |
         * | 12 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/perspective-origin
         */
      perspectiveOrigin?: ConditionalValue<CssProperties["perspectiveOrigin"] | AnyString>
       /**
         * The **\`place-content\`** CSS shorthand property allows you to align content along both the block and inline directions at once (i.e. the \`align-content\` and \`justify-content\` properties) in a relevant layout system such as Grid or Flexbox.
         *
         * **Syntax**: \`<'align-content'> <'justify-content'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **9**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-content
         */
      placeContent?: ConditionalValue<CssProperties["placeContent"] | AnyString>
       /**
         * The CSS **\`place-items\`** shorthand property allows you to align items along both the block and inline directions at once (i.e. the \`align-items\` and \`justify-items\` properties) in a relevant layout system such as Grid or Flexbox. If the second value is not set, the first value is also used for it.
         *
         * **Syntax**: \`<'align-items'> <'justify-items'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-items
         */
      placeItems?: ConditionalValue<CssProperties["placeItems"] | AnyString>
       /**
         * The **\`place-self\`** CSS shorthand property allows you to align an individual item in both the block and inline directions at once (i.e. the \`align-self\` and \`justify-self\` properties) in a relevant layout system such as Grid or Flexbox. If the second value is not present, the first value is also used for it.
         *
         * **Syntax**: \`<'align-self'> <'justify-self'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-self
         */
      placeSelf?: ConditionalValue<CssProperties["placeSelf"] | AnyString>
       /**
         * The **\`pointer-events\`** CSS property sets under what circumstances (if any) a particular graphic element can become the target of pointer events.
         *
         * **Syntax**: \`auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **1**  | **1.5** | **4**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/pointer-events
         */
      pointerEvents?: ConditionalValue<CssVars | CssProperties["pointerEvents"] | AnyString>
       /**
         * The **\`position\`** CSS property sets how an element is positioned in a document. The \`top\`, \`right\`, \`bottom\`, and \`left\` properties determine the final location of positioned elements.
         *
         * **Syntax**: \`static | relative | absolute | sticky | fixed\`
         *
         * **Initial value**: \`static\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/position
         */
      position?: ConditionalValue<CssVars | CssProperties["position"] | AnyString>
       /**
         * The **\`print-color-adjust\`** CSS property sets what, if anything, the user agent may do to optimize the appearance of the element on the output device. By default, the browser is allowed to make any adjustments to the element's appearance it determines to be necessary and prudent given the type and capabilities of the output device.
         *
         * **Syntax**: \`economy | exact\`
         *
         * **Initial value**: \`economy\`
         *
         * |    Chrome    |       Firefox       |  Safari  |     Edge     | IE  |
         * | :----------: | :-----------------: | :------: | :----------: | :-: |
         * | **17** _-x-_ |       **97**        | **15.4** | **79** _-x-_ | No  |
         * |              | 48 _(color-adjust)_ | 6 _-x-_  |              |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/print-color-adjust
         */
      printColorAdjust?: ConditionalValue<CssProperties["printColorAdjust"] | AnyString>
       /**
         * The **\`quotes\`** CSS property sets how the browser should render quotation marks that are added using the \`open-quotes\` or \`close-quotes\` values of the CSS \`content\` property.
         *
         * **Syntax**: \`none | auto | [ <string> <string> ]+\`
         *
         * **Initial value**: depends on user agent
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **11** | **1.5** | **9**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/quotes
         */
      quotes?: ConditionalValue<CssProperties["quotes"] | AnyString>
       /**
         * The **\`resize\`** CSS property sets whether an element is resizable, and if so, in which directions.
         *
         * **Syntax**: \`none | both | horizontal | vertical | block | inline\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **1**  |  **4**  | **3**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/resize
         */
      resize?: ConditionalValue<CssVars | CssProperties["resize"] | AnyString>
       /**
         * The **\`right\`** CSS property participates in specifying the horizontal position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/right
         */
      right?: ConditionalValue<UtilityValues["right"] | CssProperties["right"] | AnyString>
       /**
         * The **\`rotate\`** CSS property allows you to specify rotation transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` property.
         *
         * **Syntax**: \`none | <angle> | [ x | y | z | <number>{3} ] && <angle>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/rotate
         */
      rotate?: ConditionalValue<CssProperties["rotate"] | AnyString>
       /**
         * The **\`row-gap\`** CSS property sets the size of the gap (gutter) between an element's rows.
         *
         * **Syntax**: \`normal | <length-percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **47** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/row-gap
         */
      rowGap?: ConditionalValue<UtilityValues["rowGap"] | CssProperties["rowGap"] | AnyString>
       /**
         * The **\`ruby-align\`** CSS property defines the distribution of the different ruby elements over the base.
         *
         * **Syntax**: \`start | center | space-between | space-around\`
         *
         * **Initial value**: \`space-around\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **38**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/ruby-align
         */
      rubyAlign?: ConditionalValue<CssProperties["rubyAlign"] | AnyString>
       /**
         * **Syntax**: \`separate | collapse | auto\`
         *
         * **Initial value**: \`separate\`
         */
      rubyMerge?: ConditionalValue<CssProperties["rubyMerge"] | AnyString>
       /**
         * The **\`ruby-position\`** CSS property defines the position of a ruby element relatives to its base element. It can be positioned over the element (\`over\`), under it (\`under\`), or between the characters on their right side (\`inter-character\`).
         *
         * **Syntax**: \`[ alternate || [ over | under ] ] | inter-character\`
         *
         * **Initial value**: \`alternate\`
         *
         * | Chrome  | Firefox |   Safari    | Edge  | IE  |
         * | :-----: | :-----: | :---------: | :---: | :-: |
         * | **84**  | **38**  | **7** _-x-_ | 12-79 | No  |
         * | 1 _-x-_ |         |             |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/ruby-position
         */
      rubyPosition?: ConditionalValue<CssProperties["rubyPosition"] | AnyString>
       /**
         * The **\`scale\`** CSS property allows you to specify scale transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` value.
         *
         * **Syntax**: \`none | <number>{1,3}\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scale
         */
      scale?: ConditionalValue<UtilityValues["scale"] | CssProperties["scale"] | AnyString>
       /**
         * The **\`scrollbar-color\`** CSS property sets the color of the scrollbar track and thumb.
         *
         * **Syntax**: \`auto | <color>{2}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **121** | **64**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-color
         */
      scrollbarColor?: ConditionalValue<CssProperties["scrollbarColor"] | AnyString>
       /**
         * The **\`scrollbar-gutter\`** CSS property allows authors to reserve space for the scrollbar, preventing unwanted layout changes as the content grows while also avoiding unnecessary visuals when scrolling isn't needed.
         *
         * **Syntax**: \`auto | stable && both-edges?\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **94** | **97**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-gutter
         */
      scrollbarGutter?: ConditionalValue<CssProperties["scrollbarGutter"] | AnyString>
       /**
         * The **\`scrollbar-width\`** property allows the author to set the maximum thickness of an element's scrollbars when they are shown.
         *
         * **Syntax**: \`auto | thin | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **121** | **64**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-width
         */
      scrollbarWidth?: ConditionalValue<CssProperties["scrollbarWidth"] | AnyString>
       /**
         * The **\`scroll-behavior\`** CSS property sets the behavior for a scrolling box when scrolling is triggered by the navigation or CSSOM scrolling APIs.
         *
         * **Syntax**: \`auto | smooth\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **61** | **36**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-behavior
         */
      scrollBehavior?: ConditionalValue<CssVars | CssProperties["scrollBehavior"] | AnyString>
       /**
         * The **\`scroll-margin\`** shorthand property sets all of the scroll margins of an element at once, assigning values much like the \`margin\` property does for margins of an element.
         *
         * **Syntax**: \`<length>{1,4}\`
         *
         * | Chrome | Firefox |          Safari           | Edge | IE  |
         * | :----: | :-----: | :-----------------------: | :--: | :-: |
         * | **69** | **90**  |         **14.1**          | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin
         */
      scrollMargin?: ConditionalValue<UtilityValues["scrollMargin"] | CssProperties["scrollMargin"] | AnyString>
       /**
         * The \`scroll-margin-block\` shorthand property sets the scroll margins of an element in the block dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block
         */
      scrollMarginBlock?: ConditionalValue<UtilityValues["scrollMarginBlock"] | CssProperties["scrollMarginBlock"] | AnyString>
       /**
         * The \`scroll-margin-block-start\` property defines the margin of the scroll snap area at the start of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-start
         */
      scrollMarginBlockStart?: ConditionalValue<UtilityValues["scrollMarginBlockStart"] | CssProperties["scrollMarginBlockStart"] | AnyString>
       /**
         * The \`scroll-margin-block-end\` property defines the margin of the scroll snap area at the end of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-end
         */
      scrollMarginBlockEnd?: ConditionalValue<UtilityValues["scrollMarginBlockEnd"] | CssProperties["scrollMarginBlockEnd"] | AnyString>
       /**
         * The \`scroll-margin-bottom\` property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |              Safari              | Edge | IE  |
         * | :----: | :-----: | :------------------------------: | :--: | :-: |
         * | **69** | **68**  |             **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-bottom)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom
         */
      scrollMarginBottom?: ConditionalValue<UtilityValues["scrollMarginBottom"] | CssProperties["scrollMarginBottom"] | AnyString>
       /**
         * The \`scroll-margin-inline\` shorthand property sets the scroll margins of an element in the inline dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline
         */
      scrollMarginInline?: ConditionalValue<UtilityValues["scrollMarginInline"] | CssProperties["scrollMarginInline"] | AnyString>
       /**
         * The \`scroll-margin-inline-start\` property defines the margin of the scroll snap area at the start of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-start
         */
      scrollMarginInlineStart?: ConditionalValue<UtilityValues["scrollMarginInlineStart"] | CssProperties["scrollMarginInlineStart"] | AnyString>
       /**
         * The \`scroll-margin-inline-end\` property defines the margin of the scroll snap area at the end of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-end
         */
      scrollMarginInlineEnd?: ConditionalValue<UtilityValues["scrollMarginInlineEnd"] | CssProperties["scrollMarginInlineEnd"] | AnyString>
       /**
         * The \`scroll-margin-left\` property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari             | Edge | IE  |
         * | :----: | :-----: | :----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-left)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left
         */
      scrollMarginLeft?: ConditionalValue<UtilityValues["scrollMarginLeft"] | CssProperties["scrollMarginLeft"] | AnyString>
       /**
         * The \`scroll-margin-right\` property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari              | Edge | IE  |
         * | :----: | :-----: | :-----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-right)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right
         */
      scrollMarginRight?: ConditionalValue<UtilityValues["scrollMarginRight"] | CssProperties["scrollMarginRight"] | AnyString>
       /**
         * The \`scroll-margin-top\` property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |            Safari             | Edge | IE  |
         * | :----: | :-----: | :---------------------------: | :--: | :-: |
         * | **69** | **68**  |           **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-top)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top
         */
      scrollMarginTop?: ConditionalValue<UtilityValues["scrollMarginTop"] | CssProperties["scrollMarginTop"] | AnyString>
       /**
         * The **\`scroll-padding\`** shorthand property sets scroll padding on all sides of an element at once, much like the \`padding\` property does for padding on an element.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,4}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding
         */
      scrollPadding?: ConditionalValue<UtilityValues["scrollPadding"] | CssProperties["scrollPadding"] | AnyString>
       /**
         * The \`scroll-padding-block\` shorthand property sets the scroll padding of an element in the block dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block
         */
      scrollPaddingBlock?: ConditionalValue<UtilityValues["scrollPaddingBlock"] | CssProperties["scrollPaddingBlock"] | AnyString>
       /**
         * The \`scroll-padding-block-start\` property defines offsets for the start edge in the block dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-start
         */
      scrollPaddingBlockStart?: ConditionalValue<UtilityValues["scrollPaddingBlockStart"] | CssProperties["scrollPaddingBlockStart"] | AnyString>
       /**
         * The \`scroll-padding-block-end\` property defines offsets for the end edge in the block dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-end
         */
      scrollPaddingBlockEnd?: ConditionalValue<UtilityValues["scrollPaddingBlockEnd"] | CssProperties["scrollPaddingBlockEnd"] | AnyString>
       /**
         * The \`scroll-padding-bottom\` property defines offsets for the bottom of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-bottom
         */
      scrollPaddingBottom?: ConditionalValue<UtilityValues["scrollPaddingBottom"] | CssProperties["scrollPaddingBottom"] | AnyString>
       /**
         * The \`scroll-padding-inline\` shorthand property sets the scroll padding of an element in the inline dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline
         */
      scrollPaddingInline?: ConditionalValue<UtilityValues["scrollPaddingInline"] | CssProperties["scrollPaddingInline"] | AnyString>
       /**
         * The \`scroll-padding-inline-start\` property defines offsets for the start edge in the inline dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-start
         */
      scrollPaddingInlineStart?: ConditionalValue<UtilityValues["scrollPaddingInlineStart"] | CssProperties["scrollPaddingInlineStart"] | AnyString>
       /**
         * The \`scroll-padding-inline-end\` property defines offsets for the end edge in the inline dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-end
         */
      scrollPaddingInlineEnd?: ConditionalValue<UtilityValues["scrollPaddingInlineEnd"] | CssProperties["scrollPaddingInlineEnd"] | AnyString>
       /**
         * The \`scroll-padding-left\` property defines offsets for the left of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-left
         */
      scrollPaddingLeft?: ConditionalValue<UtilityValues["scrollPaddingLeft"] | CssProperties["scrollPaddingLeft"] | AnyString>
       /**
         * The \`scroll-padding-right\` property defines offsets for the right of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-right
         */
      scrollPaddingRight?: ConditionalValue<UtilityValues["scrollPaddingRight"] | CssProperties["scrollPaddingRight"] | AnyString>
       /**
         * The **\`scroll-padding-top\`** property defines offsets for the top of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-top
         */
      scrollPaddingTop?: ConditionalValue<UtilityValues["scrollPaddingTop"] | CssProperties["scrollPaddingTop"] | AnyString>
       /**
         * The \`scroll-snap-align\` property specifies the box's snap position as an alignment of its snap area (as the alignment subject) within its snap container's snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value.
         *
         * **Syntax**: \`[ none | start | end | center ]{1,2}\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-align
         */
      scrollSnapAlign?: ConditionalValue<CssProperties["scrollSnapAlign"] | AnyString>
       scrollSnapCoordinate?: ConditionalValue<CssProperties["scrollSnapCoordinate"] | AnyString>
       scrollSnapDestination?: ConditionalValue<CssProperties["scrollSnapDestination"] | AnyString>
       scrollSnapPointsX?: ConditionalValue<CssProperties["scrollSnapPointsX"] | AnyString>
       scrollSnapPointsY?: ConditionalValue<CssProperties["scrollSnapPointsY"] | AnyString>
       /**
         * The **\`scroll-snap-stop\`** CSS property defines whether or not the scroll container is allowed to "pass over" possible snap positions.
         *
         * **Syntax**: \`normal | always\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **75** | **103** | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-stop
         */
      scrollSnapStop?: ConditionalValue<CssProperties["scrollSnapStop"] | AnyString>
       /**
         * The **\`scroll-snap-type\`** CSS property sets how strictly snap points are enforced on the scroll container in case there is one.
         *
         * **Syntax**: \`none | [ x | y | block | inline | both ] [ mandatory | proximity ]?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |      IE      |
         * | :----: | :-----: | :-----: | :----: | :----------: |
         * | **69** |  39-68  | **11**  | **79** | **10** _-x-_ |
         * |        |         | 9 _-x-_ |        |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type
         */
      scrollSnapType?: ConditionalValue<UtilityValues["scrollSnapType"] | CssProperties["scrollSnapType"] | AnyString>
       scrollSnapTypeX?: ConditionalValue<CssProperties["scrollSnapTypeX"] | AnyString>
       scrollSnapTypeY?: ConditionalValue<CssProperties["scrollSnapTypeY"] | AnyString>
       /**
         * The **\`scroll-timeline\`** CSS shorthand property defines a name that can be used to identify the source element of a scroll timeline, along with the scrollbar axis that should provide the timeline.
         *
         * **Syntax**: \`[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline
         */
      scrollTimeline?: ConditionalValue<CssProperties["scrollTimeline"] | AnyString>
       /**
         * The **\`scroll-timeline-axis\`** CSS property can be used to specify the scrollbar that will be used to provide the timeline for a scroll-timeline animation.
         *
         * **Syntax**: \`[ block | inline | x | y ]#\`
         *
         * **Initial value**: \`block\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-axis
         */
      scrollTimelineAxis?: ConditionalValue<CssProperties["scrollTimelineAxis"] | AnyString>
       /**
         * The **\`scroll-timeline-name\`** CSS property defines a name that can be used to identify an element as the source of a scroll timeline for an animation.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-name
         */
      scrollTimelineName?: ConditionalValue<CssProperties["scrollTimelineName"] | AnyString>
       /**
         * The **\`shape-image-threshold\`** CSS property sets the alpha channel threshold used to extract the shape using an image as the value for \`shape-outside\`.
         *
         * **Syntax**: \`<alpha-value>\`
         *
         * **Initial value**: \`0.0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-image-threshold
         */
      shapeImageThreshold?: ConditionalValue<CssProperties["shapeImageThreshold"] | AnyString>
       /**
         * The **\`shape-margin\`** CSS property sets a margin for a CSS shape created using \`shape-outside\`.
         *
         * **Syntax**: \`<length-percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-margin
         */
      shapeMargin?: ConditionalValue<CssProperties["shapeMargin"] | AnyString>
       /**
         * The **\`shape-outside\`** CSS property defines a shape—which may be non-rectangular—around which adjacent inline content should wrap. By default, inline content wraps around its margin box; \`shape-outside\` provides a way to customize this wrapping, making it possible to wrap text around complex objects rather than simple boxes.
         *
         * **Syntax**: \`none | [ <shape-box> || <basic-shape> ] | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-outside
         */
      shapeOutside?: ConditionalValue<CssProperties["shapeOutside"] | AnyString>
       /**
         * The **\`tab-size\`** CSS property is used to customize the width of tab characters (U+0009).
         *
         * **Syntax**: \`<integer> | <length>\`
         *
         * **Initial value**: \`8\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **21** | **91**  | **7**  | n/a  | No  |
         * |        | 4 _-x-_ |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/tab-size
         */
      tabSize?: ConditionalValue<CssProperties["tabSize"] | AnyString>
       /**
         * The **\`table-layout\`** CSS property sets the algorithm used to lay out \`<table>\` cells, rows, and columns.
         *
         * **Syntax**: \`auto | fixed\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **14** |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/table-layout
         */
      tableLayout?: ConditionalValue<CssProperties["tableLayout"] | AnyString>
       /**
         * The **\`text-align\`** CSS property sets the horizontal alignment of the inline-level content inside a block element or table-cell box. This means it works like \`vertical-align\` but in the horizontal direction.
         *
         * **Syntax**: \`start | end | left | right | center | justify | match-parent\`
         *
         * **Initial value**: \`start\`, or a nameless value that acts as \`left\` if _direction_ is \`ltr\`, \`right\` if _direction_ is \`rtl\` if \`start\` is not supported by the browser.
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-align
         */
      textAlign?: ConditionalValue<CssProperties["textAlign"] | AnyString>
       /**
         * The **\`text-align-last\`** CSS property sets how the last line of a block or a line, right before a forced line break, is aligned.
         *
         * **Syntax**: \`auto | start | end | left | right | center | justify\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **47** | **49**  | **16** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-align-last
         */
      textAlignLast?: ConditionalValue<CssProperties["textAlignLast"] | AnyString>
       /**
         * The **\`text-combine-upright\`** CSS property sets the combination of characters into the space of a single character. If the combined text is wider than 1em, the user agent must fit the contents within 1em. The resulting composition is treated as a single upright glyph for layout and decoration. This property only has an effect in vertical writing modes.
         *
         * **Syntax**: \`none | all | [ digits <integer>? ]\`
         *
         * **Initial value**: \`none\`
         *
         * |           Chrome           | Firefox |            Safari            |  Edge  |                   IE                   |
         * | :------------------------: | :-----: | :--------------------------: | :----: | :------------------------------------: |
         * |           **48**           | **48**  |           **15.4**           | **79** | **11** _(-ms-text-combine-horizontal)_ |
         * | 9 _(-webkit-text-combine)_ |         | 5.1 _(-webkit-text-combine)_ |        |                                        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-combine-upright
         */
      textCombineUpright?: ConditionalValue<CssProperties["textCombineUpright"] | AnyString>
       /**
         * The **\`text-decoration\`** shorthand CSS property sets the appearance of decorative lines on text. It is a shorthand for \`text-decoration-line\`, \`text-decoration-color\`, \`text-decoration-style\`, and the newer \`text-decoration-thickness\` property.
         *
         * **Syntax**: \`<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration
         */
      textDecoration?: ConditionalValue<CssProperties["textDecoration"] | AnyString>
       /**
         * The **\`text-decoration-color\`** CSS property sets the color of decorations added to text by \`text-decoration-line\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-color
         */
      textDecorationColor?: ConditionalValue<UtilityValues["textDecorationColor"] | CssProperties["textDecorationColor"] | AnyString>
       /**
         * The **\`text-decoration-line\`** CSS property sets the kind of decoration that is used on text in an element, such as an underline or overline.
         *
         * **Syntax**: \`none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-line
         */
      textDecorationLine?: ConditionalValue<CssProperties["textDecorationLine"] | AnyString>
       /**
         * The **\`text-decoration-skip\`** CSS property sets what parts of an element's content any text decoration affecting the element must skip over. It controls all text decoration lines drawn by the element and also any text decoration lines drawn by its ancestors.
         *
         * **Syntax**: \`none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]\`
         *
         * **Initial value**: \`objects\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | 57-64  |   No    | **12.1** | n/a  | No  |
         * |        |         | 7 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip
         */
      textDecorationSkip?: ConditionalValue<CssProperties["textDecorationSkip"] | AnyString>
       /**
         * The **\`text-decoration-skip-ink\`** CSS property specifies how overlines and underlines are drawn when they pass over glyph ascenders and descenders.
         *
         * **Syntax**: \`auto | all | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **64** | **70**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip-ink
         */
      textDecorationSkipInk?: ConditionalValue<CssProperties["textDecorationSkipInk"] | AnyString>
       /**
         * The **\`text-decoration-style\`** CSS property sets the style of the lines specified by \`text-decoration-line\`. The style applies to all lines that are set with \`text-decoration-line\`.
         *
         * **Syntax**: \`solid | double | dotted | dashed | wavy\`
         *
         * **Initial value**: \`solid\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-style
         */
      textDecorationStyle?: ConditionalValue<CssProperties["textDecorationStyle"] | AnyString>
       /**
         * The **\`text-decoration-thickness\`** CSS property sets the stroke thickness of the decoration line that is used on text in an element, such as a line-through, underline, or overline.
         *
         * **Syntax**: \`auto | from-font | <length> | <percentage> \`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **89** | **70**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-thickness
         */
      textDecorationThickness?: ConditionalValue<CssProperties["textDecorationThickness"] | AnyString>
       /**
         * The **\`text-emphasis\`** CSS property applies emphasis marks to text (except spaces and control characters). It is a shorthand for \`text-emphasis-style\` and \`text-emphasis-color\`.
         *
         * **Syntax**: \`<'text-emphasis-style'> || <'text-emphasis-color'>\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis
         */
      textEmphasis?: ConditionalValue<CssProperties["textEmphasis"] | AnyString>
       /**
         * The **\`text-emphasis-color\`** CSS property sets the color of emphasis marks. This value can also be set using the \`text-emphasis\` shorthand.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-color
         */
      textEmphasisColor?: ConditionalValue<UtilityValues["textEmphasisColor"] | CssProperties["textEmphasisColor"] | AnyString>
       /**
         * The **\`text-emphasis-position\`** CSS property sets where emphasis marks are drawn. Like ruby text, if there isn't enough room for emphasis marks, the line height is increased.
         *
         * **Syntax**: \`[ over | under ] && [ right | left ]\`
         *
         * **Initial value**: \`over right\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-position
         */
      textEmphasisPosition?: ConditionalValue<CssProperties["textEmphasisPosition"] | AnyString>
       /**
         * The **\`text-emphasis-style\`** CSS property sets the appearance of emphasis marks. It can also be set, and reset, using the \`text-emphasis\` shorthand.
         *
         * **Syntax**: \`none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-style
         */
      textEmphasisStyle?: ConditionalValue<CssProperties["textEmphasisStyle"] | AnyString>
       /**
         * The **\`text-indent\`** CSS property sets the length of empty space (indentation) that is put before lines of text in a block.
         *
         * **Syntax**: \`<length-percentage> && hanging? && each-line?\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-indent
         */
      textIndent?: ConditionalValue<UtilityValues["textIndent"] | CssProperties["textIndent"] | AnyString>
       /**
         * The **\`text-justify\`** CSS property sets what type of justification should be applied to text when \`text-align\`\`: justify;\` is set on an element.
         *
         * **Syntax**: \`auto | inter-character | inter-word | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge  |   IE   |
         * | :----: | :-----: | :----: | :---: | :----: |
         * |  n/a   | **55**  |   No   | 12-79 | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-justify
         */
      textJustify?: ConditionalValue<CssProperties["textJustify"] | AnyString>
       /**
         * The **\`text-orientation\`** CSS property sets the orientation of the text characters in a line. It only affects text in vertical mode (when \`writing-mode\` is not \`horizontal-tb\`). It is useful for controlling the display of languages that use vertical script, and also for making vertical table headers.
         *
         * **Syntax**: \`mixed | upright | sideways\`
         *
         * **Initial value**: \`mixed\`
         *
         * |  Chrome  | Firefox |  Safari   | Edge | IE  |
         * | :------: | :-----: | :-------: | :--: | :-: |
         * |  **48**  | **41**  |  **14**   | n/a  | No  |
         * | 11 _-x-_ |         | 5.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-orientation
         */
      textOrientation?: ConditionalValue<CssProperties["textOrientation"] | AnyString>
       /**
         * The **\`text-overflow\`** CSS property sets how hidden overflow content is signaled to users. It can be clipped, display an ellipsis ('\`…\`'), or display a custom string.
         *
         * **Syntax**: \`[ clip | ellipsis | <string> ]{1,2}\`
         *
         * **Initial value**: \`clip\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **7**  | **1.3** | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-overflow
         */
      textOverflow?: ConditionalValue<CssProperties["textOverflow"] | AnyString>
       /**
         * The **\`text-rendering\`** CSS property provides information to the rendering engine about what to optimize for when rendering text.
         *
         * **Syntax**: \`auto | optimizeSpeed | optimizeLegibility | geometricPrecision\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **4**  |  **1**  | **5**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-rendering
         */
      textRendering?: ConditionalValue<CssProperties["textRendering"] | AnyString>
       /**
         * The **\`text-shadow\`** CSS property adds shadows to text. It accepts a comma-separated list of shadows to be applied to the text and any of its \`decorations\`. Each shadow is described by some combination of X and Y offsets from the element, blur radius, and color.
         *
         * **Syntax**: \`none | <shadow-t>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **2**  | **3.5** | **1.1** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-shadow
         */
      textShadow?: ConditionalValue<UtilityValues["textShadow"] | CssProperties["textShadow"] | AnyString>
       /**
         * The **\`text-size-adjust\`** CSS property controls the text inflation algorithm used on some smartphones and tablets. Other browsers will ignore this property.
         *
         * **Syntax**: \`none | auto | <percentage>\`
         *
         * **Initial value**: \`auto\` for smartphone browsers supporting inflation, \`none\` in other cases (and then not modifiable).
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **54** |   No    |   No   | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-size-adjust
         */
      textSizeAdjust?: ConditionalValue<CssProperties["textSizeAdjust"] | AnyString>
       /**
         * The **\`text-transform\`** CSS property specifies how to capitalize an element's text. It can be used to make text appear in all-uppercase or all-lowercase, or with each word capitalized. It also can help improve legibility for ruby.
         *
         * **Syntax**: \`none | capitalize | uppercase | lowercase | full-width | full-size-kana\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-transform
         */
      textTransform?: ConditionalValue<CssProperties["textTransform"] | AnyString>
       /**
         * The **\`text-underline-offset\`** CSS property sets the offset distance of an underline text decoration line (applied using \`text-decoration\`) from its original position.
         *
         * **Syntax**: \`auto | <length> | <percentage> \`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **70**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-underline-offset
         */
      textUnderlineOffset?: ConditionalValue<CssProperties["textUnderlineOffset"] | AnyString>
       /**
         * The **\`text-underline-position\`** CSS property specifies the position of the underline which is set using the \`text-decoration\` property's \`underline\` value.
         *
         * **Syntax**: \`auto | from-font | [ under || [ left | right ] ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **33** | **74**  | **12.1** | **12** | **6** |
         * |        |         | 9 _-x-_  |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-underline-position
         */
      textUnderlinePosition?: ConditionalValue<CssProperties["textUnderlinePosition"] | AnyString>
       /**
         * The **\`text-wrap\`** CSS property controls how text inside an element is wrapped. The different values provide:
         *
         * **Syntax**: \`wrap | nowrap | balance | stable | pretty\`
         *
         * **Initial value**: \`wrap\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **114** | **121** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-wrap
         */
      textWrap?: ConditionalValue<UtilityValues["textWrap"] | CssProperties["textWrap"] | AnyString>
       /**
         * The **\`timeline-scope\`** CSS property modifies the scope of a named animation timeline.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/timeline-scope
         */
      timelineScope?: ConditionalValue<CssProperties["timelineScope"] | AnyString>
       /**
         * The **\`top\`** CSS property participates in specifying the vertical position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/top
         */
      top?: ConditionalValue<UtilityValues["top"] | CssProperties["top"] | AnyString>
       /**
         * The **\`touch-action\`** CSS property sets how an element's region can be manipulated by a touchscreen user (for example, by zooming features built into the browser).
         *
         * **Syntax**: \`auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |    IE    |
         * | :----: | :-----: | :----: | :----: | :------: |
         * | **36** | **52**  | **13** | **12** |  **11**  |
         * |        |         |        |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/touch-action
         */
      touchAction?: ConditionalValue<CssVars | CssProperties["touchAction"] | AnyString>
       /**
         * The **\`transform\`** CSS property lets you rotate, scale, skew, or translate an element. It modifies the coordinate space of the CSS visual formatting model.
         *
         * **Syntax**: \`none | <transform-list>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE    |
         * | :-----: | :-----: | :-------: | :----: | :-----: |
         * | **36**  | **16**  |   **9**   | **12** | **10**  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        | 9 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform
         */
      transform?: ConditionalValue<CssProperties["transform"] | AnyString>
       /**
         * The **\`transform-box\`** CSS property defines the layout box to which the \`transform\`, individual transform properties \`translate\`,\`scale\`, and \`rotate\`, and \`transform-origin\` properties relate.
         *
         * **Syntax**: \`content-box | border-box | fill-box | stroke-box | view-box\`
         *
         * **Initial value**: \`view-box\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **64** | **55**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-box
         */
      transformBox?: ConditionalValue<CssVars | CssProperties["transformBox"] | AnyString>
       /**
         * The **\`transform-origin\`** CSS property sets the origin for an element's transformations.
         *
         * **Syntax**: \`[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?\`
         *
         * **Initial value**: \`50% 50% 0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE    |
         * | :-----: | :-----: | :-----: | :----: | :-----: |
         * | **36**  | **16**  |  **9**  | **12** | **10**  |
         * | 1 _-x-_ |         | 2 _-x-_ |        | 9 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-origin
         */
      transformOrigin?: ConditionalValue<CssProperties["transformOrigin"] | AnyString>
       /**
         * The **\`transform-style\`** CSS property sets whether children of an element are positioned in the 3D space or are flattened in the plane of the element.
         *
         * **Syntax**: \`flat | preserve-3d\`
         *
         * **Initial value**: \`flat\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  | IE  |
         * | :------: | :-----: | :-----: | :----: | :-: |
         * |  **36**  | **16**  |  **9**  | **12** | No  |
         * | 12 _-x-_ |         | 4 _-x-_ |        |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-style
         */
      transformStyle?: ConditionalValue<CssVars | CssProperties["transformStyle"] | AnyString>
       /**
         * The **\`transition\`** CSS property is a shorthand property for \`transition-property\`, \`transition-duration\`, \`transition-timing-function\`, and \`transition-delay\`.
         *
         * **Syntax**: \`<single-transition>#\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition
         */
      transition?: ConditionalValue<UtilityValues["transition"] | CssProperties["transition"] | AnyString>
       /**
         * The **\`transition-behavior\`** CSS property specifies whether transitions will be started for properties whose animation behavior is discrete.
         *
         * **Syntax**: \`<transition-behavior-value>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **117** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-behavior
         */
      transitionBehavior?: ConditionalValue<CssProperties["transitionBehavior"] | AnyString>
       /**
         * The **\`transition-delay\`** CSS property specifies the duration to wait before starting a property's transition effect when its value changes.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **26**  | **16**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-delay
         */
      transitionDelay?: ConditionalValue<UtilityValues["transitionDelay"] | CssProperties["transitionDelay"] | AnyString>
       /**
         * The **\`transition-duration\`** CSS property sets the length of time a transition animation should take to complete. By default, the value is \`0s\`, meaning that no animation will occur.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-duration
         */
      transitionDuration?: ConditionalValue<UtilityValues["transitionDuration"] | CssProperties["transitionDuration"] | AnyString>
       /**
         * The **\`transition-property\`** CSS property sets the CSS properties to which a transition effect should be applied.
         *
         * **Syntax**: \`none | <single-transition-property>#\`
         *
         * **Initial value**: all
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-property
         */
      transitionProperty?: ConditionalValue<CssProperties["transitionProperty"] | AnyString>
       /**
         * The **\`transition-timing-function\`** CSS property sets how intermediate values are calculated for CSS properties being affected by a transition effect.
         *
         * **Syntax**: \`<easing-function>#\`
         *
         * **Initial value**: \`ease\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-timing-function
         */
      transitionTimingFunction?: ConditionalValue<UtilityValues["transitionTimingFunction"] | CssProperties["transitionTimingFunction"] | AnyString>
       /**
         * The **\`translate\`** CSS property allows you to specify translation transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` value.
         *
         * **Syntax**: \`none | <length-percentage> [ <length-percentage> <length>? ]?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/translate
         */
      translate?: ConditionalValue<UtilityValues["translate"] | CssProperties["translate"] | AnyString>
       /**
         * The **\`unicode-bidi\`** CSS property, together with the \`direction\` property, determines how bidirectional text in a document is handled. For example, if a block of content contains both left-to-right and right-to-left text, the user-agent uses a complex Unicode algorithm to decide how to display the text. The \`unicode-bidi\` property overrides this algorithm and allows the developer to control the text embedding.
         *
         * **Syntax**: \`normal | embed | isolate | bidi-override | isolate-override | plaintext\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE    |
         * | :----: | :-----: | :-----: | :----: | :-----: |
         * | **2**  |  **1**  | **1.3** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/unicode-bidi
         */
      unicodeBidi?: ConditionalValue<CssProperties["unicodeBidi"] | AnyString>
       /**
         * The **\`user-select\`** CSS property controls whether the user can select text. This doesn't have any effect on content loaded as part of a browser's user interface (its chrome), except in textboxes.
         *
         * **Syntax**: \`auto | text | none | contain | all\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |   Safari    |   Edge   |      IE      |
         * | :-----: | :-----: | :---------: | :------: | :----------: |
         * | **54**  | **69**  | **3** _-x-_ |  **79**  | **10** _-x-_ |
         * | 1 _-x-_ | 1 _-x-_ |             | 12 _-x-_ |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/user-select
         */
      userSelect?: ConditionalValue<CssVars | CssProperties["userSelect"] | AnyString>
       /**
         * The **\`vertical-align\`** CSS property sets vertical alignment of an inline, inline-block or table-cell box.
         *
         * **Syntax**: \`baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>\`
         *
         * **Initial value**: \`baseline\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/vertical-align
         */
      verticalAlign?: ConditionalValue<CssProperties["verticalAlign"] | AnyString>
       /**
         * The **\`view-timeline\`** CSS shorthand property is used to define a _named view progress timeline_, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline\` is set on the subject.
         *
         * **Syntax**: \`[ <'view-timeline-name'> <'view-timeline-axis'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline
         */
      viewTimeline?: ConditionalValue<CssProperties["viewTimeline"] | AnyString>
       /**
         * The **\`view-timeline-axis\`** CSS property is used to specify the scrollbar direction that will be used to provide the timeline for a _named view progress timeline_ animation, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline-axis\` is set on the subject. See CSS scroll-driven animations for more details.
         *
         * **Syntax**: \`[ block | inline | x | y ]#\`
         *
         * **Initial value**: \`block\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-axis
         */
      viewTimelineAxis?: ConditionalValue<CssProperties["viewTimelineAxis"] | AnyString>
       /**
         * The **\`view-timeline-inset\`** CSS property is used to specify one or two values representing an adjustment to the position of the scrollport (see Scroll container for more details) in which the subject element of a _named view progress timeline_ animation is deemed to be visible. Put another way, this allows you to specify start and/or end inset (or outset) values that offset the position of the timeline.
         *
         * **Syntax**: \`[ [ auto | <length-percentage> ]{1,2} ]#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-inset
         */
      viewTimelineInset?: ConditionalValue<CssProperties["viewTimelineInset"] | AnyString>
       /**
         * The **\`view-timeline-name\`** CSS property is used to define the name of a _named view progress timeline_, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline\` is set on the subject.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-name
         */
      viewTimelineName?: ConditionalValue<CssProperties["viewTimelineName"] | AnyString>
       /**
         * The **\`view-transition-name\`** CSS property provides the selected element with a distinct identifying name (a \`<custom-ident>\`) and causes it to participate in a separate view transition from the root view transition — or no view transition if the \`none\` value is specified.
         *
         * **Syntax**: \`none | <custom-ident>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **111** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-transition-name
         */
      viewTransitionName?: ConditionalValue<CssProperties["viewTransitionName"] | AnyString>
       /**
         * The **\`visibility\`** CSS property shows or hides an element without changing the layout of a document. The property can also hide rows or columns in a \`<table>\`.
         *
         * **Syntax**: \`visible | hidden | collapse\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/visibility
         */
      visibility?: ConditionalValue<CssVars | CssProperties["visibility"] | AnyString>
       /**
         * The **\`white-space\`** CSS property sets how white space inside an element is handled.
         *
         * **Syntax**: \`normal | pre | nowrap | pre-wrap | pre-line | break-spaces | [ <'white-space-collapse'> || <'text-wrap'> || <'white-space-trim'> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/white-space
         */
      whiteSpace?: ConditionalValue<CssProperties["whiteSpace"] | AnyString>
       /**
         * The **\`white-space-collapse\`** CSS property controls how white space inside an element is collapsed.
         *
         * **Syntax**: \`collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces\`
         *
         * **Initial value**: \`collapse\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **114** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/white-space-collapse
         */
      whiteSpaceCollapse?: ConditionalValue<CssProperties["whiteSpaceCollapse"] | AnyString>
       /**
         * The **\`widows\`** CSS property sets the minimum number of lines in a block container that must be shown at the _top_ of a page, region, or column.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`2\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **25** |   No    | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/widows
         */
      widows?: ConditionalValue<CssProperties["widows"] | AnyString>
       /**
         * The **\`width\`** CSS property sets an element's width. By default, it sets the width of the content area, but if \`box-sizing\` is set to \`border-box\`, it sets the width of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/width
         */
      width?: ConditionalValue<UtilityValues["width"] | CssProperties["width"] | AnyString>
       /**
         * The **\`will-change\`** CSS property hints to browsers how an element is expected to change. Browsers may set up optimizations before an element is actually changed. These kinds of optimizations can increase the responsiveness of a page by doing potentially expensive work before they are actually required.
         *
         * **Syntax**: \`auto | <animateable-feature>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **36** | **36**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/will-change
         */
      willChange?: ConditionalValue<CssProperties["willChange"] | AnyString>
       /**
         * The **\`word-break\`** CSS property sets whether line breaks appear wherever the text would otherwise overflow its content box.
         *
         * **Syntax**: \`normal | break-all | keep-all | break-word\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  | **15**  | **3**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/word-break
         */
      wordBreak?: ConditionalValue<CssVars | CssProperties["wordBreak"] | AnyString>
       /**
         * The **\`word-spacing\`** CSS property sets the length of space between words and between tags.
         *
         * **Syntax**: \`normal | <length>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/word-spacing
         */
      wordSpacing?: ConditionalValue<CssProperties["wordSpacing"] | AnyString>
       /**
         * The **\`overflow-wrap\`** CSS property applies to inline elements, setting whether the browser should insert line breaks within an otherwise unbreakable string to prevent text from overflowing its line box.
         *
         * **Syntax**: \`normal | break-word\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge   | IE  |
         * | :-----: | :-----: | :-------: | :-----: | :-: |
         * | **≤80** | **≤72** | **≤13.1** | **≤80** | No  |
         */
      wordWrap?: ConditionalValue<CssProperties["wordWrap"] | AnyString>
       /**
         * The **\`writing-mode\`** CSS property sets whether lines of text are laid out horizontally or vertically, as well as the direction in which blocks progress. When set for an entire document, it should be set on the root element (\`html\` element for HTML documents).
         *
         * **Syntax**: \`horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr\`
         *
         * **Initial value**: \`horizontal-tb\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |  IE   |
         * | :-----: | :-----: | :-------: | :----: | :---: |
         * | **48**  | **41**  | **10.1**  | **12** | **9** |
         * | 8 _-x-_ |         | 5.1 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/writing-mode
         */
      writingMode?: ConditionalValue<CssVars | CssProperties["writingMode"] | AnyString>
       /**
         * The **\`z-index\`** CSS property sets the z-order of a positioned element and its descendants or flex items. Overlapping elements with a larger z-index cover those with a smaller one.
         *
         * **Syntax**: \`auto | <integer>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/z-index
         */
      zIndex?: ConditionalValue<CssProperties["zIndex"] | AnyString>
       /**
         * The non-standard **\`zoom\`** CSS property can be used to control the magnification level of an element. \`transform: scale()\` should be used instead of this property, if possible. However, unlike CSS Transforms, \`zoom\` affects the layout size of the element.
         *
         * **Syntax**: \`normal | reset | <number> | <percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE    |
         * | :----: | :-----: | :-----: | :----: | :-----: |
         * | **1**  |   n/a   | **3.1** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/zoom
         */
      zoom?: ConditionalValue<CssProperties["zoom"] | AnyString>
       alignmentBaseline?: ConditionalValue<CssProperties["alignmentBaseline"] | AnyString>
       baselineShift?: ConditionalValue<CssProperties["baselineShift"] | AnyString>
       clipRule?: ConditionalValue<CssProperties["clipRule"] | AnyString>
       colorInterpolation?: ConditionalValue<CssProperties["colorInterpolation"] | AnyString>
       colorRendering?: ConditionalValue<CssProperties["colorRendering"] | AnyString>
       dominantBaseline?: ConditionalValue<CssProperties["dominantBaseline"] | AnyString>
       fill?: ConditionalValue<UtilityValues["fill"] | CssProperties["fill"] | AnyString>
       fillOpacity?: ConditionalValue<CssProperties["fillOpacity"] | AnyString>
       fillRule?: ConditionalValue<CssProperties["fillRule"] | AnyString>
       floodColor?: ConditionalValue<CssProperties["floodColor"] | AnyString>
       floodOpacity?: ConditionalValue<CssProperties["floodOpacity"] | AnyString>
       glyphOrientationVertical?: ConditionalValue<CssProperties["glyphOrientationVertical"] | AnyString>
       lightingColor?: ConditionalValue<CssProperties["lightingColor"] | AnyString>
       marker?: ConditionalValue<CssProperties["marker"] | AnyString>
       markerEnd?: ConditionalValue<CssProperties["markerEnd"] | AnyString>
       markerMid?: ConditionalValue<CssProperties["markerMid"] | AnyString>
       markerStart?: ConditionalValue<CssProperties["markerStart"] | AnyString>
       shapeRendering?: ConditionalValue<CssProperties["shapeRendering"] | AnyString>
       stopColor?: ConditionalValue<CssProperties["stopColor"] | AnyString>
       stopOpacity?: ConditionalValue<CssProperties["stopOpacity"] | AnyString>
       stroke?: ConditionalValue<UtilityValues["stroke"] | CssProperties["stroke"] | AnyString>
       strokeDasharray?: ConditionalValue<CssProperties["strokeDasharray"] | AnyString>
       strokeDashoffset?: ConditionalValue<CssProperties["strokeDashoffset"] | AnyString>
       strokeLinecap?: ConditionalValue<CssProperties["strokeLinecap"] | AnyString>
       strokeLinejoin?: ConditionalValue<CssProperties["strokeLinejoin"] | AnyString>
       strokeMiterlimit?: ConditionalValue<CssProperties["strokeMiterlimit"] | AnyString>
       strokeOpacity?: ConditionalValue<CssProperties["strokeOpacity"] | AnyString>
       strokeWidth?: ConditionalValue<CssProperties["strokeWidth"] | AnyString>
       textAnchor?: ConditionalValue<CssProperties["textAnchor"] | AnyString>
       vectorEffect?: ConditionalValue<CssProperties["vectorEffect"] | AnyString>
       /**
         * The **\`position\`** CSS property sets how an element is positioned in a document. The \`top\`, \`right\`, \`bottom\`, and \`left\` properties determine the final location of positioned elements.
         *
         * **Syntax**: \`static | relative | absolute | sticky | fixed\`
         *
         * **Initial value**: \`static\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/position
         */
      pos?: ConditionalValue<CssProperties["position"] | AnyString>
       /**
         * The **\`inset-inline\`** CSS property defines the logical start and end offsets of an element in the inline direction, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline
         */
      insetX?: ConditionalValue<UtilityValues["insetInline"] | CssProperties["insetInline"] | AnyString>
       /**
         * The **\`inset-block\`** CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block
         */
      insetY?: ConditionalValue<UtilityValues["insetBlock"] | CssProperties["insetBlock"] | AnyString>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      insetEnd?: ConditionalValue<UtilityValues["insetInlineEnd"] | CssProperties["insetInlineEnd"] | AnyString>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      end?: ConditionalValue<UtilityValues["insetInlineEnd"] | CssProperties["insetInlineEnd"] | AnyString>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      insetStart?: ConditionalValue<UtilityValues["insetInlineStart"] | CssProperties["insetInlineStart"] | AnyString>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      start?: ConditionalValue<UtilityValues["insetInlineStart"] | CssProperties["insetInlineStart"] | AnyString>
       /**
         * The **\`flex-direction\`** CSS property sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).
         *
         * **Syntax**: \`row | row-reverse | column | column-reverse\`
         *
         * **Initial value**: \`row\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |    IE    |
         * | :------: | :------: | :-----: | :----: | :------: |
         * |  **29**  |  **81**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ | 49 _-x-_ | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-direction
         */
      flexDir?: ConditionalValue<CssProperties["flexDirection"] | AnyString>
       /**
         * The **\`padding\`** CSS shorthand property sets the padding area on all four sides of an element at once.
         *
         * **Syntax**: \`[ <length> | <percentage> ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding
         */
      p?: ConditionalValue<UtilityValues["padding"] | CssProperties["padding"] | AnyString>
       /**
         * The **\`padding-left\`** CSS property sets the width of the padding area to the left of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-left
         */
      pl?: ConditionalValue<UtilityValues["paddingLeft"] | CssProperties["paddingLeft"] | AnyString>
       /**
         * The **\`padding-right\`** CSS property sets the width of the padding area on the right of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-right
         */
      pr?: ConditionalValue<UtilityValues["paddingRight"] | CssProperties["paddingRight"] | AnyString>
       /**
         * The **\`padding-top\`** CSS property sets the height of the padding area on the top of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-top
         */
      pt?: ConditionalValue<UtilityValues["paddingTop"] | CssProperties["paddingTop"] | AnyString>
       /**
         * The **\`padding-bottom\`** CSS property sets the height of the padding area on the bottom of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-bottom
         */
      pb?: ConditionalValue<UtilityValues["paddingBottom"] | CssProperties["paddingBottom"] | AnyString>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      py?: ConditionalValue<UtilityValues["paddingBlock"] | CssProperties["paddingBlock"] | AnyString>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      paddingY?: ConditionalValue<UtilityValues["paddingBlock"] | CssProperties["paddingBlock"] | AnyString>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      paddingX?: ConditionalValue<UtilityValues["paddingInline"] | CssProperties["paddingInline"] | AnyString>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      px?: ConditionalValue<UtilityValues["paddingInline"] | CssProperties["paddingInline"] | AnyString>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      pe?: ConditionalValue<UtilityValues["paddingInlineEnd"] | CssProperties["paddingInlineEnd"] | AnyString>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      paddingEnd?: ConditionalValue<UtilityValues["paddingInlineEnd"] | CssProperties["paddingInlineEnd"] | AnyString>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      ps?: ConditionalValue<UtilityValues["paddingInlineStart"] | CssProperties["paddingInlineStart"] | AnyString>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      paddingStart?: ConditionalValue<UtilityValues["paddingInlineStart"] | CssProperties["paddingInlineStart"] | AnyString>
       /**
         * The **\`margin-left\`** CSS property sets the margin area on the left side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-left
         */
      ml?: ConditionalValue<UtilityValues["marginLeft"] | CssProperties["marginLeft"] | AnyString>
       /**
         * The **\`margin-right\`** CSS property sets the margin area on the right side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-right
         */
      mr?: ConditionalValue<UtilityValues["marginRight"] | CssProperties["marginRight"] | AnyString>
       /**
         * The **\`margin-top\`** CSS property sets the margin area on the top of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-top
         */
      mt?: ConditionalValue<UtilityValues["marginTop"] | CssProperties["marginTop"] | AnyString>
       /**
         * The **\`margin-bottom\`** CSS property sets the margin area on the bottom of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-bottom
         */
      mb?: ConditionalValue<UtilityValues["marginBottom"] | CssProperties["marginBottom"] | AnyString>
       /**
         * The **\`margin\`** CSS shorthand property sets the margin area on all four sides of an element.
         *
         * **Syntax**: \`[ <length> | <percentage> | auto ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin
         */
      m?: ConditionalValue<UtilityValues["margin"] | CssProperties["margin"] | AnyString>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      my?: ConditionalValue<UtilityValues["marginBlock"] | CssProperties["marginBlock"] | AnyString>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      marginY?: ConditionalValue<UtilityValues["marginBlock"] | CssProperties["marginBlock"] | AnyString>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      mx?: ConditionalValue<UtilityValues["marginInline"] | CssProperties["marginInline"] | AnyString>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      marginX?: ConditionalValue<UtilityValues["marginInline"] | CssProperties["marginInline"] | AnyString>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      me?: ConditionalValue<UtilityValues["marginInlineEnd"] | CssProperties["marginInlineEnd"] | AnyString>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      marginEnd?: ConditionalValue<UtilityValues["marginInlineEnd"] | CssProperties["marginInlineEnd"] | AnyString>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      ms?: ConditionalValue<UtilityValues["marginInlineStart"] | CssProperties["marginInlineStart"] | AnyString>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      marginStart?: ConditionalValue<UtilityValues["marginInlineStart"] | CssProperties["marginInlineStart"] | AnyString>
       /**
         * The CSS **\`outline-width\`** property sets the thickness of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-width
         */
      ringWidth?: ConditionalValue<CssProperties["outlineWidth"] | AnyString>
       /**
         * The **\`outline-color\`** CSS property sets the color of an element's outline.
         *
         * **Syntax**: \`<color> | invert\`
         *
         * **Initial value**: \`invert\`, for browsers supporting it, \`currentColor\` for the other
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-color
         */
      ringColor?: ConditionalValue<UtilityValues["outlineColor"] | CssProperties["outlineColor"] | AnyString>
       /**
         * The **\`outline\`** CSS shorthand property sets most of the outline properties in a single declaration.
         *
         * **Syntax**: \`[ <'outline-color'> || <'outline-style'> || <'outline-width'> ]\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **94** | **88**  | **16.4** | **94** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline
         */
      ring?: ConditionalValue<UtilityValues["outline"] | CssProperties["outline"] | AnyString>
       /**
         * The **\`outline-offset\`** CSS property sets the amount of space between an outline and the edge or border of an element.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari  |  Edge  | IE  |
         * | :----: | :-----: | :-----: | :----: | :-: |
         * | **1**  | **1.5** | **1.2** | **15** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-offset
         */
      ringOffset?: ConditionalValue<UtilityValues["outlineOffset"] | CssProperties["outlineOffset"] | AnyString>
       /**
         * The **\`width\`** CSS property sets an element's width. By default, it sets the width of the content area, but if \`box-sizing\` is set to \`border-box\`, it sets the width of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/width
         */
      w?: ConditionalValue<UtilityValues["width"] | CssProperties["width"] | AnyString>
       /**
         * The **\`min-width\`** CSS property sets the minimum width of an element. It prevents the used value of the \`width\` property from becoming smaller than the value specified for \`min-width\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-width
         */
      minW?: ConditionalValue<UtilityValues["minWidth"] | CssProperties["minWidth"] | AnyString>
       /**
         * The **\`max-width\`** CSS property sets the maximum width of an element. It prevents the used value of the \`width\` property from becoming larger than the value specified by \`max-width\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-width
         */
      maxW?: ConditionalValue<UtilityValues["maxWidth"] | CssProperties["maxWidth"] | AnyString>
       /**
         * The **\`height\`** CSS property specifies the height of an element. By default, the property defines the height of the content area. If \`box-sizing\` is set to \`border-box\`, however, it instead determines the height of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/height
         */
      h?: ConditionalValue<UtilityValues["height"] | CssProperties["height"] | AnyString>
       /**
         * The **\`min-height\`** CSS property sets the minimum height of an element. It prevents the used value of the \`height\` property from becoming smaller than the value specified for \`min-height\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **3**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-height
         */
      minH?: ConditionalValue<UtilityValues["minHeight"] | CssProperties["minHeight"] | AnyString>
       /**
         * The **\`max-height\`** CSS property sets the maximum height of an element. It prevents the used value of the \`height\` property from becoming larger than the value specified for \`max-height\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **18** |  **1**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-height
         */
      maxH?: ConditionalValue<UtilityValues["maxHeight"] | CssProperties["maxHeight"] | AnyString>
       textShadowColor?: ConditionalValue<UtilityValues["textShadowColor"] | AnyString>
       /**
         * The **\`background-position\`** CSS property sets the initial position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`<bg-position>#\`
         *
         * **Initial value**: \`0% 0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position
         */
      bgPosition?: ConditionalValue<CssProperties["backgroundPosition"] | AnyString>
       /**
         * The **\`background-position-x\`** CSS property sets the initial horizontal position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-x
         */
      bgPositionX?: ConditionalValue<CssProperties["backgroundPositionX"] | AnyString>
       /**
         * The **\`background-position-y\`** CSS property sets the initial vertical position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-y
         */
      bgPositionY?: ConditionalValue<CssProperties["backgroundPositionY"] | AnyString>
       /**
         * The **\`background-attachment\`** CSS property sets whether a background image's position is fixed within the viewport, or scrolls with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-attachment
         */
      bgAttachment?: ConditionalValue<CssProperties["backgroundAttachment"] | AnyString>
       /**
         * The **\`background-clip\`** CSS property sets whether an element's background extends underneath its border box, padding box, or content box.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **4**  |  **5**  | **12** | **9** |
         * |        |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-clip
         */
      bgClip?: ConditionalValue<CssProperties["backgroundClip"] | AnyString>
       /**
         * The **\`background\`** shorthand CSS property sets all background style properties at once, such as color, image, origin and size, or repeat method.
         *
         * **Syntax**: \`[ <bg-layer> , ]* <final-bg-layer>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background
         */
      bg?: ConditionalValue<UtilityValues["background"] | CssProperties["background"] | AnyString>
       /**
         * The **\`background-color\`** CSS property sets the background color of an element.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`transparent\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-color
         */
      bgColor?: ConditionalValue<UtilityValues["backgroundColor"] | CssProperties["backgroundColor"] | AnyString>
       /**
         * The **\`background-origin\`** CSS property sets the background's origin: from the border start, inside the border, or inside the padding.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`padding-box\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **4**  | **3**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-origin
         */
      bgOrigin?: ConditionalValue<CssProperties["backgroundOrigin"] | AnyString>
       /**
         * The **\`background-image\`** CSS property sets one or more background images on an element.
         *
         * **Syntax**: \`<bg-image>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-image
         */
      bgImage?: ConditionalValue<CssProperties["backgroundImage"] | AnyString>
       /**
         * The **\`background-repeat\`** CSS property sets how background images are repeated. A background image can be repeated along the horizontal and vertical axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-repeat
         */
      bgRepeat?: ConditionalValue<CssProperties["backgroundRepeat"] | AnyString>
       /**
         * The **\`background-blend-mode\`** CSS property sets how an element's background images should blend with each other and with the element's background color.
         *
         * **Syntax**: \`<blend-mode>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **35** | **30**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-blend-mode
         */
      bgBlendMode?: ConditionalValue<CssProperties["backgroundBlendMode"] | AnyString>
       /**
         * The **\`background-size\`** CSS property sets the size of the element's background image. The image can be left to its natural size, stretched, or constrained to fit the available space.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **3**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-size
         */
      bgSize?: ConditionalValue<CssProperties["backgroundSize"] | AnyString>
       bgGradient?: ConditionalValue<UtilityValues["backgroundGradient"] | AnyString>
       /**
         * The **\`border-radius\`** CSS property rounds the corners of an element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.
         *
         * **Syntax**: \`<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-radius
         */
      rounded?: ConditionalValue<UtilityValues["borderRadius"] | CssProperties["borderRadius"] | AnyString>
       /**
         * The **\`border-top-left-radius\`** CSS property rounds the top-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius
         */
      roundedTopLeft?: ConditionalValue<UtilityValues["borderTopLeftRadius"] | CssProperties["borderTopLeftRadius"] | AnyString>
       /**
         * The **\`border-top-right-radius\`** CSS property rounds the top-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius
         */
      roundedTopRight?: ConditionalValue<UtilityValues["borderTopRightRadius"] | CssProperties["borderTopRightRadius"] | AnyString>
       /**
         * The **\`border-bottom-right-radius\`** CSS property rounds the bottom-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius
         */
      roundedBottomRight?: ConditionalValue<UtilityValues["borderBottomRightRadius"] | CssProperties["borderBottomRightRadius"] | AnyString>
       /**
         * The **\`border-bottom-left-radius\`** CSS property rounds the bottom-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius
         */
      roundedBottomLeft?: ConditionalValue<UtilityValues["borderBottomLeftRadius"] | CssProperties["borderBottomLeftRadius"] | AnyString>
       roundedTop?: ConditionalValue<UtilityValues["borderTopRadius"] | AnyString>
       roundedRight?: ConditionalValue<UtilityValues["borderRightRadius"] | AnyString>
       roundedBottom?: ConditionalValue<UtilityValues["borderBottomRadius"] | AnyString>
       roundedLeft?: ConditionalValue<UtilityValues["borderLeftRadius"] | AnyString>
       /**
         * The **\`border-start-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius
         */
      roundedStartStart?: ConditionalValue<UtilityValues["borderStartStartRadius"] | CssProperties["borderStartStartRadius"] | AnyString>
       /**
         * The **\`border-start-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius
         */
      roundedStartEnd?: ConditionalValue<UtilityValues["borderStartEndRadius"] | CssProperties["borderStartEndRadius"] | AnyString>
       roundedStart?: ConditionalValue<UtilityValues["borderStartRadius"] | AnyString>
       /**
         * The **\`border-end-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius
         */
      roundedEndStart?: ConditionalValue<UtilityValues["borderEndStartRadius"] | CssProperties["borderEndStartRadius"] | AnyString>
       /**
         * The **\`border-end-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius
         */
      roundedEndEnd?: ConditionalValue<UtilityValues["borderEndEndRadius"] | CssProperties["borderEndEndRadius"] | AnyString>
       roundedEnd?: ConditionalValue<UtilityValues["borderEndRadius"] | AnyString>
       /**
         * The **\`border-inline\`** CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline
         */
      borderX?: ConditionalValue<UtilityValues["borderInline"] | CssProperties["borderInline"] | AnyString>
       /**
         * The **\`border-inline-width\`** CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-width
         */
      borderXWidth?: ConditionalValue<CssProperties["borderInlineWidth"] | AnyString>
       /**
         * The **\`border-inline-color\`** CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-color
         */
      borderXColor?: ConditionalValue<UtilityValues["borderInlineColor"] | CssProperties["borderInlineColor"] | AnyString>
       /**
         * The **\`border-block\`** CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block
         */
      borderY?: ConditionalValue<UtilityValues["borderBlock"] | CssProperties["borderBlock"] | AnyString>
       /**
         * The **\`border-block-width\`** CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-width
         */
      borderYWidth?: ConditionalValue<CssProperties["borderBlockWidth"] | AnyString>
       /**
         * The **\`border-block-color\`** CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-color
         */
      borderYColor?: ConditionalValue<UtilityValues["borderBlockColor"] | CssProperties["borderBlockColor"] | AnyString>
       /**
         * The **\`border-inline-start\`** CSS property is a shorthand property for setting the individual logical inline-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start
         */
      borderStart?: ConditionalValue<UtilityValues["borderInlineStart"] | CssProperties["borderInlineStart"] | AnyString>
       /**
         * The **\`border-inline-start-width\`** CSS property defines the width of the logical inline-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width
         */
      borderStartWidth?: ConditionalValue<CssProperties["borderInlineStartWidth"] | AnyString>
       /**
         * The **\`border-inline-start-color\`** CSS property defines the color of the logical inline start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color
         */
      borderStartColor?: ConditionalValue<UtilityValues["borderInlineStartColor"] | CssProperties["borderInlineStartColor"] | AnyString>
       /**
         * The **\`border-inline-end\`** CSS property is a shorthand property for setting the individual logical inline-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end
         */
      borderEnd?: ConditionalValue<UtilityValues["borderInlineEnd"] | CssProperties["borderInlineEnd"] | AnyString>
       /**
         * The **\`border-inline-end-width\`** CSS property defines the width of the logical inline-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-width)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width
         */
      borderEndWidth?: ConditionalValue<CssProperties["borderInlineEndWidth"] | AnyString>
       /**
         * The **\`border-inline-end-color\`** CSS property defines the color of the logical inline-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color
         */
      borderEndColor?: ConditionalValue<UtilityValues["borderInlineEndColor"] | CssProperties["borderInlineEndColor"] | AnyString>
       /**
         * The **\`box-shadow\`** CSS property adds shadow effects around an element's frame. You can set multiple effects separated by commas. A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
         *
         * **Syntax**: \`none | <shadow>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  |  **4**  | **5.1** | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-shadow
         */
      shadow?: ConditionalValue<UtilityValues["boxShadow"] | CssProperties["boxShadow"] | AnyString>
       shadowColor?: ConditionalValue<UtilityValues["boxShadowColor"] | AnyString>
       x?: ConditionalValue<UtilityValues["translateX"] | AnyString>
       y?: ConditionalValue<UtilityValues["translateY"] | AnyString>
       /**
         * The \`scroll-margin-block\` shorthand property sets the scroll margins of an element in the block dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block
         */
      scrollMarginY?: ConditionalValue<UtilityValues["scrollMarginBlock"] | CssProperties["scrollMarginBlock"] | AnyString>
       /**
         * The \`scroll-margin-inline\` shorthand property sets the scroll margins of an element in the inline dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline
         */
      scrollMarginX?: ConditionalValue<UtilityValues["scrollMarginInline"] | CssProperties["scrollMarginInline"] | AnyString>
       /**
         * The \`scroll-padding-block\` shorthand property sets the scroll padding of an element in the block dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block
         */
      scrollPaddingY?: ConditionalValue<UtilityValues["scrollPaddingBlock"] | CssProperties["scrollPaddingBlock"] | AnyString>
       /**
         * The \`scroll-padding-inline\` shorthand property sets the scroll padding of an element in the inline dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline
         */
      scrollPaddingX?: ConditionalValue<UtilityValues["scrollPaddingInline"] | CssProperties["scrollPaddingInline"] | AnyString>
       hideFrom?: ConditionalValue<UtilityValues["hideFrom"] | AnyString>
       hideBelow?: ConditionalValue<UtilityValues["hideBelow"] | AnyString>
       divideX?: ConditionalValue<UtilityValues["divideX"] | AnyString>
       divideY?: ConditionalValue<UtilityValues["divideY"] | AnyString>
       divideColor?: ConditionalValue<UtilityValues["divideColor"] | AnyString>
       divideStyle?: ConditionalValue<UtilityValues["divideStyle"] | AnyString>
       fontSmoothing?: ConditionalValue<UtilityValues["fontSmoothing"] | AnyString>
       truncate?: ConditionalValue<UtilityValues["truncate"] | AnyString>
       backgroundGradient?: ConditionalValue<UtilityValues["backgroundGradient"] | AnyString>
       textGradient?: ConditionalValue<UtilityValues["textGradient"] | AnyString>
       gradientFrom?: ConditionalValue<UtilityValues["gradientFrom"] | AnyString>
       gradientTo?: ConditionalValue<UtilityValues["gradientTo"] | AnyString>
       gradientVia?: ConditionalValue<UtilityValues["gradientVia"] | AnyString>
       borderTopRadius?: ConditionalValue<UtilityValues["borderTopRadius"] | AnyString>
       borderRightRadius?: ConditionalValue<UtilityValues["borderRightRadius"] | AnyString>
       borderBottomRadius?: ConditionalValue<UtilityValues["borderBottomRadius"] | AnyString>
       borderLeftRadius?: ConditionalValue<UtilityValues["borderLeftRadius"] | AnyString>
       borderStartRadius?: ConditionalValue<UtilityValues["borderStartRadius"] | AnyString>
       borderEndRadius?: ConditionalValue<UtilityValues["borderEndRadius"] | AnyString>
       boxShadowColor?: ConditionalValue<UtilityValues["boxShadowColor"] | AnyString>
       brightness?: ConditionalValue<string | number | AnyString>
       contrast?: ConditionalValue<string | number | AnyString>
       grayscale?: ConditionalValue<string | number | AnyString>
       hueRotate?: ConditionalValue<string | number | AnyString>
       invert?: ConditionalValue<string | number | AnyString>
       saturate?: ConditionalValue<string | number | AnyString>
       sepia?: ConditionalValue<string | number | AnyString>
       dropShadow?: ConditionalValue<string | number | AnyString>
       blur?: ConditionalValue<UtilityValues["blur"] | AnyString>
       backdropBlur?: ConditionalValue<UtilityValues["backdropBlur"] | AnyString>
       backdropBrightness?: ConditionalValue<string | number | AnyString>
       backdropContrast?: ConditionalValue<string | number | AnyString>
       backdropGrayscale?: ConditionalValue<string | number | AnyString>
       backdropHueRotate?: ConditionalValue<string | number | AnyString>
       backdropInvert?: ConditionalValue<string | number | AnyString>
       backdropOpacity?: ConditionalValue<string | number | AnyString>
       backdropSaturate?: ConditionalValue<string | number | AnyString>
       backdropSepia?: ConditionalValue<string | number | AnyString>
       borderSpacingX?: ConditionalValue<UtilityValues["borderSpacingX"] | AnyString>
       borderSpacingY?: ConditionalValue<UtilityValues["borderSpacingY"] | AnyString>
       scaleX?: ConditionalValue<string | number | AnyString>
       scaleY?: ConditionalValue<string | number | AnyString>
       translateX?: ConditionalValue<UtilityValues["translateX"] | AnyString>
       translateY?: ConditionalValue<UtilityValues["translateY"] | AnyString>
       scrollbar?: ConditionalValue<UtilityValues["scrollbar"] | AnyString>
       scrollSnapStrictness?: ConditionalValue<UtilityValues["scrollSnapStrictness"] | AnyString>
       /**
         * The **\`scroll-margin\`** shorthand property sets all of the scroll margins of an element at once, assigning values much like the \`margin\` property does for margins of an element.
         *
         * **Syntax**: \`<length>{1,4}\`
         *
         * | Chrome | Firefox |          Safari           | Edge | IE  |
         * | :----: | :-----: | :-----------------------: | :--: | :-: |
         * | **69** |  68-90  |         **14.1**          | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin
         */
      scrollSnapMargin?: ConditionalValue<UtilityValues["scrollSnapMargin"] | AnyString>
       /**
         * The \`scroll-margin-top\` property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |            Safari             | Edge | IE  |
         * | :----: | :-----: | :---------------------------: | :--: | :-: |
         * | **69** | **68**  |           **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-top)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top
         */
      scrollSnapMarginTop?: ConditionalValue<UtilityValues["scrollSnapMarginTop"] | AnyString>
       /**
         * The \`scroll-margin-bottom\` property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |              Safari              | Edge | IE  |
         * | :----: | :-----: | :------------------------------: | :--: | :-: |
         * | **69** | **68**  |             **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-bottom)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom
         */
      scrollSnapMarginBottom?: ConditionalValue<UtilityValues["scrollSnapMarginBottom"] | AnyString>
       /**
         * The \`scroll-margin-left\` property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari             | Edge | IE  |
         * | :----: | :-----: | :----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-left)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left
         */
      scrollSnapMarginLeft?: ConditionalValue<UtilityValues["scrollSnapMarginLeft"] | AnyString>
       /**
         * The \`scroll-margin-right\` property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari              | Edge | IE  |
         * | :----: | :-----: | :-----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-right)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right
         */
      scrollSnapMarginRight?: ConditionalValue<UtilityValues["scrollSnapMarginRight"] | AnyString>
       srOnly?: ConditionalValue<UtilityValues["srOnly"] | AnyString>
       debug?: ConditionalValue<UtilityValues["debug"] | AnyString>
       colorPalette?: ConditionalValue<UtilityValues["colorPalette"] | AnyString>
       textStyle?: ConditionalValue<UtilityValues["textStyle"] | AnyString>
      }"
    `)
  })

  test('with stricTokens true', () => {
    expect(generateStyleProps(createContext({ strictTokens: true }))).toMatchInlineSnapshot(`
      "import type { ConditionalValue } from './conditions';
      import type { OnlyKnown, UtilityValues, WithEscapeHatch } from './prop-type';
      import type { CssProperties } from './system-types';
      import type { Token } from '../tokens/index';

      type AnyString = (string & {})
      type CssVars = \`var(--\${string})\`
      type CssVarValue = ConditionalValue<Token | AnyString | (number & {})>

      type CssVarName =  | AnyString
      type CssVarKeys = \`--\${CssVarName}\`

      export type CssVarProperties = {
        [key in CssVarKeys]?: CssVarValue
      }

      export interface SystemProperties {
         /**
         * The **\`appearance\`** CSS property is used to control native appearance of UI controls, that are based on operating system's theme.
         *
         * **Syntax**: \`none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button\`
         *
         * **Initial value**: \`none\` (but this value is overridden in the user agent CSS)
         */
      WebkitAppearance?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitAppearance"]>>
       /**
         * The **\`-webkit-border-before\`** CSS property is a shorthand property for setting the individual logical block start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-width'> || <'border-style'> || <color>\`
         */
      WebkitBorderBefore?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitBorderBefore"]>>
       /**
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitBorderBeforeColor?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitBorderBeforeColor"]>>
       /**
         * **Syntax**: \`<'border-style'>\`
         *
         * **Initial value**: \`none\`
         */
      WebkitBorderBeforeStyle?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitBorderBeforeStyle"]>>
       /**
         * **Syntax**: \`<'border-width'>\`
         *
         * **Initial value**: \`medium\`
         */
      WebkitBorderBeforeWidth?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitBorderBeforeWidth"]>>
       /**
         * The **\`-webkit-box-reflect\`** CSS property lets you reflect the content of an element in one specific direction.
         *
         * **Syntax**: \`[ above | below | right | left ]? <length>? <image>?\`
         *
         * **Initial value**: \`none\`
         */
      WebkitBoxReflect?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitBoxReflect"]>>
       /**
         * The **\`-webkit-line-clamp\`** CSS property allows limiting of the contents of a block to the specified number of lines.
         *
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      WebkitLineClamp?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitLineClamp"]>>
       /**
         * The **\`mask\`** CSS shorthand property hides an element (partially or fully) by masking or clipping the image at specific points.
         *
         * **Syntax**: \`[ <mask-reference> || <position> [ / <bg-size> ]? || <repeat-style> || [ <box> | border | padding | content | text ] || [ <box> | border | padding | content ] ]#\`
         */
      WebkitMask?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMask"]>>
       /**
         * If a \`mask-image\` is specified, \`-webkit-mask-attachment\` determines whether the mask image's position is fixed within the viewport, or scrolls along with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         */
      WebkitMaskAttachment?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskAttachment"]>>
       /**
         * The **\`mask-clip\`** CSS property determines the area which is affected by a mask. The painted content of an element must be restricted to this area.
         *
         * **Syntax**: \`[ <box> | border | padding | content | text ]#\`
         *
         * **Initial value**: \`border\`
         */
      WebkitMaskClip?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskClip"]>>
       /**
         * The **\`-webkit-mask-composite\`** property specifies the manner in which multiple mask images applied to the same element are composited with one another. Mask images are composited in the opposite order that they are declared with the \`-webkit-mask-image\` property.
         *
         * **Syntax**: \`<composite-style>#\`
         *
         * **Initial value**: \`source-over\`
         */
      WebkitMaskComposite?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskComposite"]>>
       /**
         * The **\`mask-image\`** CSS property sets the image that is used as mask layer for an element. By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. This can be controlled with the \`mask-mode\` property.
         *
         * **Syntax**: \`<mask-reference>#\`
         *
         * **Initial value**: \`none\`
         */
      WebkitMaskImage?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskImage"]>>
       /**
         * The **\`mask-origin\`** CSS property sets the origin of a mask.
         *
         * **Syntax**: \`[ <box> | border | padding | content ]#\`
         *
         * **Initial value**: \`padding\`
         */
      WebkitMaskOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskOrigin"]>>
       /**
         * The **\`mask-position\`** CSS property sets the initial position, relative to the mask position layer set by \`mask-origin\`, for each defined mask image.
         *
         * **Syntax**: \`<position>#\`
         *
         * **Initial value**: \`0% 0%\`
         */
      WebkitMaskPosition?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskPosition"]>>
       /**
         * The \`-webkit-mask-position-x\` CSS property sets the initial horizontal position of a mask image.
         *
         * **Syntax**: \`[ <length-percentage> | left | center | right ]#\`
         *
         * **Initial value**: \`0%\`
         */
      WebkitMaskPositionX?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskPositionX"]>>
       /**
         * The \`-webkit-mask-position-y\` CSS property sets the initial vertical position of a mask image.
         *
         * **Syntax**: \`[ <length-percentage> | top | center | bottom ]#\`
         *
         * **Initial value**: \`0%\`
         */
      WebkitMaskPositionY?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskPositionY"]>>
       /**
         * The **\`mask-repeat\`** CSS property sets how mask images are repeated. A mask image can be repeated along the horizontal axis, the vertical axis, both axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskRepeat"]>>
       /**
         * The \`-webkit-mask-repeat-x\` property specifies whether and how a mask image is repeated (tiled) horizontally.
         *
         * **Syntax**: \`repeat | no-repeat | space | round\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeatX?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskRepeatX"]>>
       /**
         * The \`-webkit-mask-repeat-y\` property sets whether and how a mask image is repeated (tiled) vertically.
         *
         * **Syntax**: \`repeat | no-repeat | space | round\`
         *
         * **Initial value**: \`repeat\`
         */
      WebkitMaskRepeatY?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskRepeatY"]>>
       /**
         * The **\`mask-size\`** CSS property specifies the sizes of the mask images. The size of the image can be fully or partially constrained in order to preserve its intrinsic ratio.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         */
      WebkitMaskSize?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitMaskSize"]>>
       /**
         * The \`-webkit-overflow-scrolling\` CSS property controls whether or not touch devices use momentum-based scrolling for a given element.
         *
         * **Syntax**: \`auto | touch\`
         *
         * **Initial value**: \`auto\`
         */
      WebkitOverflowScrolling?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitOverflowScrolling"]>>
       /**
         * **\`-webkit-tap-highlight-color\`** is a non-standard CSS property that sets the color of the highlight that appears over a link while it's being tapped. The highlighting indicates to the user that their tap is being successfully recognized, and indicates which element they're tapping on.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`black\`
         */
      WebkitTapHighlightColor?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTapHighlightColor"]>>
       /**
         * The **\`-webkit-text-fill-color\`** CSS property specifies the fill color of characters of text. If this property is not set, the value of the \`color\` property is used.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitTextFillColor?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTextFillColor"]>>
       /**
         * The **\`-webkit-text-stroke\`** CSS property specifies the width and color of strokes for text characters. This is a shorthand property for the longhand properties \`-webkit-text-stroke-width\` and \`-webkit-text-stroke-color\`.
         *
         * **Syntax**: \`<length> || <color>\`
         */
      WebkitTextStroke?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTextStroke"]>>
       /**
         * The **\`-webkit-text-stroke-color\`** CSS property specifies the stroke color of characters of text. If this property is not set, the value of the \`color\` property is used.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         */
      WebkitTextStrokeColor?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTextStrokeColor"]>>
       /**
         * The **\`-webkit-text-stroke-width\`** CSS property specifies the width of the stroke for text.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         */
      WebkitTextStrokeWidth?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTextStrokeWidth"]>>
       /**
         * The \`-webkit-touch-callout\` CSS property controls the display of the default callout shown when you touch and hold a touch target.
         *
         * **Syntax**: \`default | none\`
         *
         * **Initial value**: \`default\`
         */
      WebkitTouchCallout?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitTouchCallout"]>>
       /**
         * **Syntax**: \`read-only | read-write | read-write-plaintext-only\`
         *
         * **Initial value**: \`read-only\`
         */
      WebkitUserModify?: ConditionalValue<WithEscapeHatch<CssProperties["WebkitUserModify"]>>
       /**
         * The **\`accent-color\`** CSS property sets the accent color for user-interface controls generated by some elements.
         *
         * **Syntax**: \`auto | <color>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **93** | **92**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/accent-color
         */
      accentColor?: ConditionalValue<WithEscapeHatch<UtilityValues["accentColor"]>>
       /**
         * The CSS **\`align-content\`** property sets the distribution of space between and around content items along a flexbox's cross-axis or a grid's block axis.
         *
         * **Syntax**: \`normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position>\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-content
         */
      alignContent?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["alignContent"]>>
       /**
         * The CSS **\`align-items\`** property sets the \`align-self\` value on all direct children as a group. In Flexbox, it controls the alignment of items on the Cross Axis. In Grid Layout, it controls the alignment of items on the Block Axis within their grid area.
         *
         * **Syntax**: \`normal | stretch | <baseline-position> | [ <overflow-position>? <self-position> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-items
         */
      alignItems?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["alignItems"]>>
       /**
         * The **\`align-self\`** CSS property overrides a grid or flex item's \`align-items\` value. In Grid, it aligns the item inside the grid area. In Flexbox, it aligns the item on the cross axis.
         *
         * **Syntax**: \`auto | normal | stretch | <baseline-position> | <overflow-position>? <self-position>\`
         *
         * **Initial value**: \`auto\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **10** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-self
         */
      alignSelf?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["alignSelf"]>>
       /**
         * The **\`align-tracks\`** CSS property sets the alignment in the masonry axis for grid containers that have masonry in their block axis.
         *
         * **Syntax**: \`[ normal | <baseline-position> | <content-distribution> | <overflow-position>? <content-position> ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/align-tracks
         */
      alignTracks?: ConditionalValue<WithEscapeHatch<CssProperties["alignTracks"]>>
       /**
         * The **\`all\`** shorthand CSS property resets all of an element's properties except \`unicode-bidi\`, \`direction\`, and CSS Custom Properties. It can set properties to their initial or inherited values, or to the values specified in another cascade layer or stylesheet origin.
         *
         * **Syntax**: \`initial | inherit | unset | revert | revert-layer\`
         *
         * **Initial value**: There is no practical initial value for it.
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **37** | **27**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/all
         */
      all?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["all"]>>
       /**
         * The **\`animation\`** shorthand CSS property applies an animation between styles. It is a shorthand for \`animation-name\`, \`animation-duration\`, \`animation-timing-function\`, \`animation-delay\`, \`animation-iteration-count\`, \`animation-direction\`, \`animation-fill-mode\`, and \`animation-play-state\`.
         *
         * **Syntax**: \`<single-animation>#\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation
         */
      animation?: ConditionalValue<WithEscapeHatch<UtilityValues["animation"]>>
       /**
         * The **\`animation-composition\`** CSS property specifies the composite operation to use when multiple animations affect the same property simultaneously.
         *
         * **Syntax**: \`<single-animation-composition>#\`
         *
         * **Initial value**: \`replace\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **112** | **115** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-composition
         */
      animationComposition?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["animationComposition"]>>
       /**
         * The **\`animation-delay\`** CSS property specifies the amount of time to wait from applying the animation to an element before beginning to perform the animation. The animation can start later, immediately from its beginning, or immediately and partway through the animation.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-delay
         */
      animationDelay?: ConditionalValue<WithEscapeHatch<UtilityValues["animationDelay"]>>
       /**
         * The **\`animation-direction\`** CSS property sets whether an animation should play forward, backward, or alternate back and forth between playing the sequence forward and backward.
         *
         * **Syntax**: \`<single-animation-direction>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-direction
         */
      animationDirection?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["animationDirection"]>>
       /**
         * The **\`animation-duration\`** CSS property sets the length of time that an animation takes to complete one cycle.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-duration
         */
      animationDuration?: ConditionalValue<WithEscapeHatch<CssProperties["animationDuration"]>>
       /**
         * The **\`animation-fill-mode\`** CSS property sets how a CSS animation applies styles to its target before and after its execution.
         *
         * **Syntax**: \`<single-animation-fill-mode>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 5 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-fill-mode
         */
      animationFillMode?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["animationFillMode"]>>
       /**
         * The **\`animation-iteration-count\`** CSS property sets the number of times an animation sequence should be played before stopping.
         *
         * **Syntax**: \`<single-animation-iteration-count>#\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-iteration-count
         */
      animationIterationCount?: ConditionalValue<WithEscapeHatch<CssProperties["animationIterationCount"]>>
       /**
         * The **\`animation-name\`** CSS property specifies the names of one or more \`@keyframes\` at-rules that describe the animation to apply to an element. Multiple \`@keyframe\` at-rules are specified as a comma-separated list of names. If the specified name does not match any \`@keyframe\` at-rule, no properties are animated.
         *
         * **Syntax**: \`[ none | <keyframes-name> ]#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-name
         */
      animationName?: ConditionalValue<WithEscapeHatch<CssProperties["animationName"]>>
       /**
         * The **\`animation-play-state\`** CSS property sets whether an animation is running or paused.
         *
         * **Syntax**: \`<single-animation-play-state>#\`
         *
         * **Initial value**: \`running\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-play-state
         */
      animationPlayState?: ConditionalValue<WithEscapeHatch<CssProperties["animationPlayState"]>>
       /**
         * The **\`animation-range\`** CSS shorthand property is used to set the start and end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start and end.
         *
         * **Syntax**: \`[ <'animation-range-start'> <'animation-range-end'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range
         */
      animationRange?: ConditionalValue<WithEscapeHatch<CssProperties["animationRange"]>>
       /**
         * The **\`animation-range-end\`** CSS property is used to set the end of an animation's attachment range along its timeline, i.e. where along the timeline an animation will end.
         *
         * **Syntax**: \`[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range-end
         */
      animationRangeEnd?: ConditionalValue<WithEscapeHatch<CssProperties["animationRangeEnd"]>>
       /**
         * The **\`animation-range-start\`** CSS property is used to set the start of an animation's attachment range along its timeline, i.e. where along the timeline an animation will start.
         *
         * **Syntax**: \`[ normal | <length-percentage> | <timeline-range-name> <length-percentage>? ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-range-start
         */
      animationRangeStart?: ConditionalValue<WithEscapeHatch<CssProperties["animationRangeStart"]>>
       /**
         * The **\`animation-timing-function\`** CSS property sets how an animation progresses through the duration of each cycle.
         *
         * **Syntax**: \`<easing-function>#\`
         *
         * **Initial value**: \`ease\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **43**  | **16**  |  **9**  | **12** | **10** |
         * | 3 _-x-_ | 5 _-x-_ | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-timing-function
         */
      animationTimingFunction?: ConditionalValue<WithEscapeHatch<CssProperties["animationTimingFunction"]>>
       /**
         * The **\`animation-timeline\`** CSS property specifies the timeline that is used to control the progress of an animation.
         *
         * **Syntax**: \`<single-animation-timeline>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/animation-timeline
         */
      animationTimeline?: ConditionalValue<WithEscapeHatch<CssProperties["animationTimeline"]>>
       /**
         * The **\`appearance\`** CSS property is used to control native appearance of UI controls, that are based on operating system's theme.
         *
         * **Syntax**: \`none | auto | textfield | menulist-button | <compat-auto>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  |   Edge   | IE  |
         * | :-----: | :-----: | :------: | :------: | :-: |
         * | **84**  | **80**  | **15.4** |  **84**  | No  |
         * | 1 _-x-_ | 1 _-x-_ | 3 _-x-_  | 12 _-x-_ |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/appearance
         */
      appearance?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["appearance"]>>
       /**
         * The **\`aspect-ratio\`** CSS property sets a **preferred aspect ratio** for the box, which will be used in the calculation of auto sizes and some other layout functions.
         *
         * **Syntax**: \`auto | <ratio>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **88** | **89**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/aspect-ratio
         */
      aspectRatio?: ConditionalValue<WithEscapeHatch<UtilityValues["aspectRatio"]>>
       azimuth?: ConditionalValue<WithEscapeHatch<CssProperties["azimuth"]>>
       /**
         * The **\`backdrop-filter\`** CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element. Because it applies to everything _behind_ the element, to see the effect you must make the element or its background at least partially transparent.
         *
         * **Syntax**: \`none | <filter-function-list>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |   Safari    |  Edge  | IE  |
         * | :----: | :-----: | :---------: | :----: | :-: |
         * | **76** | **103** | **9** _-x-_ | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/backdrop-filter
         */
      backdropFilter?: ConditionalValue<WithEscapeHatch<UtilityValues["backdropFilter"]>>
       /**
         * The **\`backface-visibility\`** CSS property sets whether the back face of an element is visible when turned towards the user.
         *
         * **Syntax**: \`visible | hidden\`
         *
         * **Initial value**: \`visible\`
         *
         * |  Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :------: | :-----: | :-------: | :----: | :----: |
         * |  **36**  | **16**  | **15.4**  | **12** | **10** |
         * | 12 _-x-_ |         | 5.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/backface-visibility
         */
      backfaceVisibility?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["backfaceVisibility"]>>
       /**
         * The **\`background\`** shorthand CSS property sets all background style properties at once, such as color, image, origin and size, or repeat method.
         *
         * **Syntax**: \`[ <bg-layer> , ]* <final-bg-layer>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background
         */
      background?: ConditionalValue<WithEscapeHatch<UtilityValues["background"]>>
       /**
         * The **\`background-attachment\`** CSS property sets whether a background image's position is fixed within the viewport, or scrolls with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-attachment
         */
      backgroundAttachment?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["backgroundAttachment"]>>
       /**
         * The **\`background-blend-mode\`** CSS property sets how an element's background images should blend with each other and with the element's background color.
         *
         * **Syntax**: \`<blend-mode>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **35** | **30**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-blend-mode
         */
      backgroundBlendMode?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundBlendMode"]>>
       /**
         * The **\`background-clip\`** CSS property sets whether an element's background extends underneath its border box, padding box, or content box.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **4**  |  **5**  | **12** | **9** |
         * |        |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-clip
         */
      backgroundClip?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["backgroundClip"]>>
       /**
         * The **\`background-color\`** CSS property sets the background color of an element.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`transparent\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-color
         */
      backgroundColor?: ConditionalValue<WithEscapeHatch<UtilityValues["backgroundColor"]>>
       /**
         * The **\`background-image\`** CSS property sets one or more background images on an element.
         *
         * **Syntax**: \`<bg-image>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-image
         */
      backgroundImage?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundImage"]>>
       /**
         * The **\`background-origin\`** CSS property sets the background's origin: from the border start, inside the border, or inside the padding.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`padding-box\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **4**  | **3**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-origin
         */
      backgroundOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundOrigin"]>>
       /**
         * The **\`background-position\`** CSS property sets the initial position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`<bg-position>#\`
         *
         * **Initial value**: \`0% 0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position
         */
      backgroundPosition?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPosition"]>>
       /**
         * The **\`background-position-x\`** CSS property sets the initial horizontal position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-x
         */
      backgroundPositionX?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPositionX"]>>
       /**
         * The **\`background-position-y\`** CSS property sets the initial vertical position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-y
         */
      backgroundPositionY?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPositionY"]>>
       /**
         * The **\`background-repeat\`** CSS property sets how background images are repeated. A background image can be repeated along the horizontal and vertical axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-repeat
         */
      backgroundRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundRepeat"]>>
       /**
         * The **\`background-size\`** CSS property sets the size of the element's background image. The image can be left to its natural size, stretched, or constrained to fit the available space.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **3**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-size
         */
      backgroundSize?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundSize"]>>
       /**
         * The **\`block-size\`** CSS property defines the horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`width\` or the \`height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/block-size
         */
      blockSize?: ConditionalValue<WithEscapeHatch<UtilityValues["blockSize"]>>
       /**
         * The **\`border\`** shorthand CSS property sets an element's border. It sets the values of \`border-width\`, \`border-style\`, and \`border-color\`.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border
         */
      border?: ConditionalValue<WithEscapeHatch<UtilityValues["border"]>>
       /**
         * The **\`border-block\`** CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block
         */
      borderBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlock"]>>
       /**
         * The **\`border-block-color\`** CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-color
         */
      borderBlockColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockColor"]>>
       /**
         * The **\`border-block-style\`** CSS property defines the style of the logical block borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\` and \`border-bottom-style\`, or \`border-left-style\` and \`border-right-style\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-style
         */
      borderBlockStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderBlockStyle"]>>
       /**
         * The **\`border-block-width\`** CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-width
         */
      borderBlockWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderBlockWidth"]>>
       /**
         * The **\`border-block-end\`** CSS property is a shorthand property for setting the individual logical block-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end
         */
      borderBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockEnd"]>>
       /**
         * The **\`border-block-end-color\`** CSS property defines the color of the logical block-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-color
         */
      borderBlockEndColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockEndColor"]>>
       /**
         * The **\`border-block-end-style\`** CSS property defines the style of the logical block-end border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-style
         */
      borderBlockEndStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderBlockEndStyle"]>>
       /**
         * The **\`border-block-end-width\`** CSS property defines the width of the logical block-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-end-width
         */
      borderBlockEndWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderBlockEndWidth"]>>
       /**
         * The **\`border-block-start\`** CSS property is a shorthand property for setting the individual logical block-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start
         */
      borderBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockStart"]>>
       /**
         * The **\`border-block-start-color\`** CSS property defines the color of the logical block-start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-color
         */
      borderBlockStartColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockStartColor"]>>
       /**
         * The **\`border-block-start-style\`** CSS property defines the style of the logical block start border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-style
         */
      borderBlockStartStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderBlockStartStyle"]>>
       /**
         * The **\`border-block-start-width\`** CSS property defines the width of the logical block-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-start-width
         */
      borderBlockStartWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderBlockStartWidth"]>>
       /**
         * The **\`border-bottom\`** shorthand CSS property sets an element's bottom border. It sets the values of \`border-bottom-width\`, \`border-bottom-style\` and \`border-bottom-color\`.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom
         */
      borderBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottom"]>>
       /**
         * The **\`border-bottom-color\`** CSS property sets the color of an element's bottom border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-bottom\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-color
         */
      borderBottomColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomColor"]>>
       /**
         * The **\`border-bottom-left-radius\`** CSS property rounds the bottom-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius
         */
      borderBottomLeftRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomLeftRadius"]>>
       /**
         * The **\`border-bottom-right-radius\`** CSS property rounds the bottom-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius
         */
      borderBottomRightRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomRightRadius"]>>
       /**
         * The **\`border-bottom-style\`** CSS property sets the line style of an element's bottom \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-style
         */
      borderBottomStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderBottomStyle"]>>
       /**
         * The **\`border-bottom-width\`** CSS property sets the width of the bottom border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-width
         */
      borderBottomWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderBottomWidth"]>>
       /**
         * The **\`border-collapse\`** CSS property sets whether cells inside a \`<table>\` have shared or separate borders.
         *
         * **Syntax**: \`collapse | separate\`
         *
         * **Initial value**: \`separate\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-collapse
         */
      borderCollapse?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderCollapse"]>>
       /**
         * The **\`border-color\`** shorthand CSS property sets the color of an element's border.
         *
         * **Syntax**: \`<color>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-color
         */
      borderColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderColor"]>>
       /**
         * The **\`border-end-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius
         */
      borderEndEndRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndEndRadius"]>>
       /**
         * The **\`border-end-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius
         */
      borderEndStartRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndStartRadius"]>>
       /**
         * The **\`border-image\`** CSS property draws an image around a given element. It replaces the element's regular border.
         *
         * **Syntax**: \`<'border-image-source'> || <'border-image-slice'> [ / <'border-image-width'> | / <'border-image-width'>? / <'border-image-outset'> ]? || <'border-image-repeat'>\`
         *
         * | Chrome  |  Firefox  | Safari  |  Edge  |   IE   |
         * | :-----: | :-------: | :-----: | :----: | :----: |
         * | **16**  |  **15**   |  **6**  | **12** | **11** |
         * | 7 _-x-_ | 3.5 _-x-_ | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image
         */
      borderImage?: ConditionalValue<WithEscapeHatch<CssProperties["borderImage"]>>
       /**
         * The **\`border-image-outset\`** CSS property sets the distance by which an element's border image is set out from its border box.
         *
         * **Syntax**: \`[ <length> | <number> ]{1,4}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-outset
         */
      borderImageOutset?: ConditionalValue<WithEscapeHatch<CssProperties["borderImageOutset"]>>
       /**
         * The **\`border-image-repeat\`** CSS property defines how the edge regions and middle region of a source image are adjusted to fit the dimensions of an element's border image. The middle region can be displayed by using the keyword "fill" in the border-image-slice property.
         *
         * **Syntax**: \`[ stretch | repeat | round | space ]{1,2}\`
         *
         * **Initial value**: \`stretch\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-repeat
         */
      borderImageRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["borderImageRepeat"]>>
       /**
         * The **\`border-image-slice\`** CSS property divides the image specified by \`border-image-source\` into regions. These regions form the components of an element's border image.
         *
         * **Syntax**: \`<number-percentage>{1,4} && fill?\`
         *
         * **Initial value**: \`100%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-slice
         */
      borderImageSlice?: ConditionalValue<WithEscapeHatch<CssProperties["borderImageSlice"]>>
       /**
         * The **\`border-image-source\`** CSS property sets the source image used to create an element's border image.
         *
         * **Syntax**: \`none | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **15**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-source
         */
      borderImageSource?: ConditionalValue<WithEscapeHatch<CssProperties["borderImageSource"]>>
       /**
         * The **\`border-image-width\`** CSS property sets the width of an element's border image.
         *
         * **Syntax**: \`[ <length-percentage> | <number> | auto ]{1,4}\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **15** | **13**  | **6**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-image-width
         */
      borderImageWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderImageWidth"]>>
       /**
         * The **\`border-inline\`** CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline
         */
      borderInline?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInline"]>>
       /**
         * The **\`border-inline-end\`** CSS property is a shorthand property for setting the individual logical inline-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end
         */
      borderInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineEnd"]>>
       /**
         * The **\`border-inline-color\`** CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-color
         */
      borderInlineColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineColor"]>>
       /**
         * The **\`border-inline-style\`** CSS property defines the style of the logical inline borders of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\` and \`border-bottom-style\`, or \`border-left-style\` and \`border-right-style\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-style
         */
      borderInlineStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderInlineStyle"]>>
       /**
         * The **\`border-inline-width\`** CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-width
         */
      borderInlineWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineWidth"]>>
       /**
         * The **\`border-inline-end-color\`** CSS property defines the color of the logical inline-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color
         */
      borderInlineEndColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineEndColor"]>>
       /**
         * The **\`border-inline-end-style\`** CSS property defines the style of the logical inline end border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-style)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-style
         */
      borderInlineEndStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderInlineEndStyle"]>>
       /**
         * The **\`border-inline-end-width\`** CSS property defines the width of the logical inline-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-width)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width
         */
      borderInlineEndWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineEndWidth"]>>
       /**
         * The **\`border-inline-start\`** CSS property is a shorthand property for setting the individual logical inline-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start
         */
      borderInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineStart"]>>
       /**
         * The **\`border-inline-start-color\`** CSS property defines the color of the logical inline start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color
         */
      borderInlineStartColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineStartColor"]>>
       /**
         * The **\`border-inline-start-style\`** CSS property defines the style of the logical inline start border of an element, which maps to a physical border style depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-style\`, \`border-right-style\`, \`border-bottom-style\`, or \`border-left-style\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-style)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-style
         */
      borderInlineStartStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderInlineStartStyle"]>>
       /**
         * The **\`border-inline-start-width\`** CSS property defines the width of the logical inline-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width
         */
      borderInlineStartWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineStartWidth"]>>
       /**
         * The **\`border-left\`** shorthand CSS property sets all the properties of an element's left border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left
         */
      borderLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["borderLeft"]>>
       /**
         * The **\`border-left-color\`** CSS property sets the color of an element's left border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-left\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-color
         */
      borderLeftColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderLeftColor"]>>
       /**
         * The **\`border-left-style\`** CSS property sets the line style of an element's left \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-style
         */
      borderLeftStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderLeftStyle"]>>
       /**
         * The **\`border-left-width\`** CSS property sets the width of the left border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-left-width
         */
      borderLeftWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderLeftWidth"]>>
       /**
         * The **\`border-radius\`** CSS property rounds the corners of an element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.
         *
         * **Syntax**: \`<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-radius
         */
      borderRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRadius"]>>
       /**
         * The **\`border-right\`** shorthand CSS property sets all the properties of an element's right border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right
         */
      borderRight?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRight"]>>
       /**
         * The **\`border-right-color\`** CSS property sets the color of an element's right border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-right\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-color
         */
      borderRightColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRightColor"]>>
       /**
         * The **\`border-right-style\`** CSS property sets the line style of an element's right \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-style
         */
      borderRightStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderRightStyle"]>>
       /**
         * The **\`border-right-width\`** CSS property sets the width of the right border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-right-width
         */
      borderRightWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderRightWidth"]>>
       /**
         * The **\`border-spacing\`** CSS property sets the distance between the borders of adjacent cells in a \`<table>\`. This property applies only when \`border-collapse\` is \`separate\`.
         *
         * **Syntax**: \`<length> <length>?\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-spacing
         */
      borderSpacing?: ConditionalValue<WithEscapeHatch<UtilityValues["borderSpacing"]>>
       /**
         * The **\`border-start-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius
         */
      borderStartEndRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartEndRadius"]>>
       /**
         * The **\`border-start-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius
         */
      borderStartStartRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartStartRadius"]>>
       /**
         * The **\`border-style\`** shorthand CSS property sets the line style for all four sides of an element's border.
         *
         * **Syntax**: \`<line-style>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-style
         */
      borderStyle?: ConditionalValue<WithEscapeHatch<CssProperties["borderStyle"]>>
       /**
         * The **\`border-top\`** shorthand CSS property sets all the properties of an element's top border.
         *
         * **Syntax**: \`<line-width> || <line-style> || <color>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top
         */
      borderTop?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTop"]>>
       /**
         * The **\`border-top-color\`** CSS property sets the color of an element's top border. It can also be set with the shorthand CSS properties \`border-color\` or \`border-top\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-color
         */
      borderTopColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopColor"]>>
       /**
         * The **\`border-top-left-radius\`** CSS property rounds the top-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius
         */
      borderTopLeftRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopLeftRadius"]>>
       /**
         * The **\`border-top-right-radius\`** CSS property rounds the top-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius
         */
      borderTopRightRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopRightRadius"]>>
       /**
         * The **\`border-top-style\`** CSS property sets the line style of an element's top \`border\`.
         *
         * **Syntax**: \`<line-style>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-style
         */
      borderTopStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["borderTopStyle"]>>
       /**
         * The **\`border-top-width\`** CSS property sets the width of the top border of an element.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-width
         */
      borderTopWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderTopWidth"]>>
       /**
         * The **\`border-width\`** shorthand CSS property sets the width of an element's border.
         *
         * **Syntax**: \`<line-width>{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-width
         */
      borderWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderWidth"]>>
       /**
         * The **\`bottom\`** CSS property participates in setting the vertical position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/bottom
         */
      bottom?: ConditionalValue<WithEscapeHatch<UtilityValues["bottom"]>>
       boxAlign?: ConditionalValue<WithEscapeHatch<CssProperties["boxAlign"]>>
       /**
         * The **\`box-decoration-break\`** CSS property specifies how an element's fragments should be rendered when broken across multiple lines, columns, or pages.
         *
         * **Syntax**: \`slice | clone\`
         *
         * **Initial value**: \`slice\`
         *
         * |    Chrome    | Firefox |   Safari    | Edge | IE  |
         * | :----------: | :-----: | :---------: | :--: | :-: |
         * | **22** _-x-_ | **32**  | **7** _-x-_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-decoration-break
         */
      boxDecorationBreak?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["boxDecorationBreak"]>>
       boxDirection?: ConditionalValue<WithEscapeHatch<CssProperties["boxDirection"]>>
       boxFlex?: ConditionalValue<WithEscapeHatch<CssProperties["boxFlex"]>>
       boxFlexGroup?: ConditionalValue<WithEscapeHatch<CssProperties["boxFlexGroup"]>>
       boxLines?: ConditionalValue<WithEscapeHatch<CssProperties["boxLines"]>>
       boxOrdinalGroup?: ConditionalValue<WithEscapeHatch<CssProperties["boxOrdinalGroup"]>>
       boxOrient?: ConditionalValue<WithEscapeHatch<CssProperties["boxOrient"]>>
       boxPack?: ConditionalValue<WithEscapeHatch<CssProperties["boxPack"]>>
       /**
         * The **\`box-shadow\`** CSS property adds shadow effects around an element's frame. You can set multiple effects separated by commas. A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
         *
         * **Syntax**: \`none | <shadow>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  |  **4**  | **5.1** | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-shadow
         */
      boxShadow?: ConditionalValue<WithEscapeHatch<UtilityValues["boxShadow"]>>
       /**
         * The **\`box-sizing\`** CSS property sets how the total width and height of an element is calculated.
         *
         * **Syntax**: \`content-box | border-box\`
         *
         * **Initial value**: \`content-box\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  | **29**  | **5.1** | **12** | **8** |
         * | 1 _-x-_ | 1 _-x-_ | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-sizing
         */
      boxSizing?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["boxSizing"]>>
       /**
         * The **\`break-after\`** CSS property sets how page, column, or region breaks should behave after a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-after
         */
      breakAfter?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["breakAfter"]>>
       /**
         * The **\`break-before\`** CSS property sets how page, column, or region breaks should behave before a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | always | all | avoid-page | page | left | right | recto | verso | avoid-column | column | avoid-region | region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-before
         */
      breakBefore?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["breakBefore"]>>
       /**
         * The **\`break-inside\`** CSS property sets how page, column, or region breaks should behave inside a generated box. If there is no generated box, the property is ignored.
         *
         * **Syntax**: \`auto | avoid | avoid-page | avoid-column | avoid-region\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **50** | **65**  | **10** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/break-inside
         */
      breakInside?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["breakInside"]>>
       /**
         * The **\`caption-side\`** CSS property puts the content of a table's \`<caption>\` on the specified side. The values are relative to the \`writing-mode\` of the table.
         *
         * **Syntax**: \`top | bottom | block-start | block-end | inline-start | inline-end\`
         *
         * **Initial value**: \`top\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/caption-side
         */
      captionSide?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["captionSide"]>>
       /** **Syntax**: \`<'caret-color'> || <'caret-shape'>\` */
      caret?: ConditionalValue<WithEscapeHatch<CssProperties["caret"]>>
       /**
         * The **\`caret-color\`** CSS property sets the color of the **insertion caret**, the visible marker where the next character typed will be inserted. This is sometimes referred to as the **text input cursor**. The caret appears in elements such as \`<input>\` or those with the \`contenteditable\` attribute. The caret is typically a thin vertical line that flashes to help make it more noticeable. By default, it is black, but its color can be altered with this property.
         *
         * **Syntax**: \`auto | <color>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **53**  | **11.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/caret-color
         */
      caretColor?: ConditionalValue<WithEscapeHatch<UtilityValues["caretColor"]>>
       /**
         * **Syntax**: \`auto | bar | block | underscore\`
         *
         * **Initial value**: \`auto\`
         */
      caretShape?: ConditionalValue<WithEscapeHatch<CssProperties["caretShape"]>>
       /**
         * The **\`clear\`** CSS property sets whether an element must be moved below (cleared) floating elements that precede it. The \`clear\` property applies to floating and non-floating elements.
         *
         * **Syntax**: \`none | left | right | both | inline-start | inline-end\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/clear
         */
      clear?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["clear"]>>
       clip?: ConditionalValue<WithEscapeHatch<CssProperties["clip"]>>
       /**
         * The **\`clip-path\`** CSS property creates a clipping region that sets what part of an element should be shown. Parts that are inside the region are shown, while those outside are hidden.
         *
         * **Syntax**: \`<clip-source> | [ <basic-shape> || <geometry-box> ] | none\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **55**  | **3.5** | **9.1** | **79** | **10** |
         * | 23 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/clip-path
         */
      clipPath?: ConditionalValue<WithEscapeHatch<CssProperties["clipPath"]>>
       /**
         * The **\`color\`** CSS property sets the foreground color value of an element's text and text decorations, and sets the \`currentcolor\` value. \`currentcolor\` may be used as an indirect value on _other_ properties and is the default for other color properties, such as \`border-color\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`canvastext\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/color
         */
      color?: ConditionalValue<WithEscapeHatch<UtilityValues["color"]>>
       /**
         * The **\`color-scheme\`** CSS property allows an element to indicate which color schemes it can comfortably be rendered in.
         *
         * **Syntax**: \`normal | [ light | dark | <custom-ident> ]+ && only?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **81** | **96**  | **13** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/color-scheme
         */
      colorScheme?: ConditionalValue<WithEscapeHatch<CssProperties["colorScheme"]>>
       /**
         * The **\`column-count\`** CSS property breaks an element's content into the specified number of columns.
         *
         * **Syntax**: \`<integer> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-count
         */
      columnCount?: ConditionalValue<WithEscapeHatch<CssProperties["columnCount"]>>
       /**
         * The **\`column-fill\`** CSS property controls how an element's contents are balanced when broken into columns.
         *
         * **Syntax**: \`auto | balance | balance-all\`
         *
         * **Initial value**: \`balance\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **50** | **52**  |  **9**  | **12** | **10** |
         * |        |         | 8 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-fill
         */
      columnFill?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["columnFill"]>>
       /**
         * The **\`column-gap\`** CSS property sets the size of the gap (gutter) between an element's columns.
         *
         * **Syntax**: \`normal | <length-percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **1**  | **1.5** | **3**  | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-gap
         */
      columnGap?: ConditionalValue<WithEscapeHatch<UtilityValues["columnGap"]>>
       /**
         * The **\`column-rule\`** shorthand CSS property sets the width, style, and color of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'column-rule-width'> || <'column-rule-style'> || <'column-rule-color'>\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule
         */
      columnRule?: ConditionalValue<WithEscapeHatch<CssProperties["columnRule"]>>
       /**
         * The **\`column-rule-color\`** CSS property sets the color of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-color
         */
      columnRuleColor?: ConditionalValue<WithEscapeHatch<CssProperties["columnRuleColor"]>>
       /**
         * The **\`column-rule-style\`** CSS property sets the style of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'border-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-style
         */
      columnRuleStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["columnRuleStyle"]>>
       /**
         * The **\`column-rule-width\`** CSS property sets the width of the line drawn between columns in a multi-column layout.
         *
         * **Syntax**: \`<'border-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **52**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-rule-width
         */
      columnRuleWidth?: ConditionalValue<WithEscapeHatch<CssProperties["columnRuleWidth"]>>
       /**
         * The **\`column-span\`** CSS property makes it possible for an element to span across all columns when its value is set to \`all\`.
         *
         * **Syntax**: \`none | all\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **50**  | **71**  |   **9**   | **12** | **10** |
         * | 6 _-x-_ |         | 5.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-span
         */
      columnSpan?: ConditionalValue<WithEscapeHatch<CssProperties["columnSpan"]>>
       /**
         * The **\`column-width\`** CSS property sets the ideal column width in a multi-column layout. The container will have as many columns as can fit without any of them having a width less than the \`column-width\` value. If the width of the container is narrower than the specified value, the single column's width will be smaller than the declared column width.
         *
         * **Syntax**: \`<length> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **50**  | **50**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/column-width
         */
      columnWidth?: ConditionalValue<WithEscapeHatch<CssProperties["columnWidth"]>>
       /**
         * The **\`columns\`** CSS shorthand property sets the number of columns to use when drawing an element's contents, as well as those columns' widths.
         *
         * **Syntax**: \`<'column-width'> || <'column-count'>\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **50** | **52**  |  **9**  | **12** | **10** |
         * |        |         | 3 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/columns
         */
      columns?: ConditionalValue<WithEscapeHatch<CssProperties["columns"]>>
       /**
         * The **\`contain\`** CSS property indicates that an element and its contents are, as much as possible, independent from the rest of the document tree. Containment enables isolating a subsection of the DOM, providing performance benefits by limiting calculations of layout, style, paint, size, or any combination to a DOM subtree rather than the entire page. Containment can also be used to scope CSS counters and quotes.
         *
         * **Syntax**: \`none | strict | content | [ [ size || inline-size ] || layout || style || paint ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **52** | **69**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain
         */
      contain?: ConditionalValue<WithEscapeHatch<CssProperties["contain"]>>
       /**
         * The **\`contain-intrinsic-size\`** CSS shorthand property sets the size of an element that a browser will use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`[ auto? [ none | <length> ] ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **83** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-size
         */
      containIntrinsicSize?: ConditionalValue<WithEscapeHatch<CssProperties["containIntrinsicSize"]>>
       /**
         * The **\`contain-intrinsic-block-size\`** CSS logical property defines the block size of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-contain-intrinsic-block-size
         */
      containIntrinsicBlockSize?: ConditionalValue<WithEscapeHatch<CssProperties["containIntrinsicBlockSize"]>>
       /**
         * The **\`contain-intrinsic-length\`** CSS property sets the height of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-height
         */
      containIntrinsicHeight?: ConditionalValue<WithEscapeHatch<CssProperties["containIntrinsicHeight"]>>
       /**
         * The **\`contain-intrinsic-inline-size\`** CSS logical property defines the inline-size of an element that a browser can use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-contain-intrinsic-inline-size
         */
      containIntrinsicInlineSize?: ConditionalValue<WithEscapeHatch<CssProperties["containIntrinsicInlineSize"]>>
       /**
         * The **\`contain-intrinsic-width\`** CSS property sets the width of an element that a browser will use for layout when the element is subject to size containment.
         *
         * **Syntax**: \`auto? [ none | <length> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **95** | **107** | **17** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/contain-intrinsic-width
         */
      containIntrinsicWidth?: ConditionalValue<WithEscapeHatch<CssProperties["containIntrinsicWidth"]>>
       /**
         * The **container** shorthand CSS property establishes the element as a query container and specifies the name or name for the containment context used in a container query.
         *
         * **Syntax**: \`<'container-name'> [ / <'container-type'> ]?\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container
         */
      container?: ConditionalValue<WithEscapeHatch<CssProperties["container"]>>
       /**
         * The **container-name** CSS property specifies a list of query container names used by the @container at-rule in a container query. A container query will apply styles to elements based on the size of the nearest ancestor with a containment context. When a containment context is given a name, it can be specifically targeted using the \`@container\` at-rule instead of the nearest ancestor with containment.
         *
         * **Syntax**: \`none | <custom-ident>+\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container-name
         */
      containerName?: ConditionalValue<WithEscapeHatch<CssProperties["containerName"]>>
       /**
         * The **container-type** CSS property is used to define the type of containment used in a container query.
         *
         * **Syntax**: \`normal | size | inline-size\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **105** | **110** | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/container-type
         */
      containerType?: ConditionalValue<WithEscapeHatch<CssProperties["containerType"]>>
       /**
         * The **\`content\`** CSS property replaces an element with a generated value. Objects inserted using the \`content\` property are **anonymous replaced elements**.
         *
         * **Syntax**: \`normal | none | [ <content-replacement> | <content-list> ] [/ [ <string> | <counter> ]+ ]?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/content
         */
      content?: ConditionalValue<WithEscapeHatch<CssProperties["content"]>>
       /**
         * The **\`content-visibility\`** CSS property controls whether or not an element renders its contents at all, along with forcing a strong set of containments, allowing user agents to potentially omit large swathes of layout and rendering work until it becomes needed. It enables the user agent to skip an element's rendering work (including layout and painting) until it is needed — which makes the initial page load much faster.
         *
         * **Syntax**: \`visible | auto | hidden\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome |   Firefox   | Safari | Edge | IE  |
         * | :----: | :---------: | :----: | :--: | :-: |
         * | **85** | **preview** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/content-visibility
         */
      contentVisibility?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["contentVisibility"]>>
       /**
         * The **\`counter-increment\`** CSS property increases or decreases the value of a CSS counter by a given value.
         *
         * **Syntax**: \`[ <counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **3**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-increment
         */
      counterIncrement?: ConditionalValue<WithEscapeHatch<CssProperties["counterIncrement"]>>
       /**
         * The **\`counter-reset\`** CSS property resets a CSS counter to a given value. This property will create a new counter or reversed counter with the given name on the specified element.
         *
         * **Syntax**: \`[ <counter-name> <integer>? | <reversed-counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **3**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-reset
         */
      counterReset?: ConditionalValue<WithEscapeHatch<CssProperties["counterReset"]>>
       /**
         * The **\`counter-set\`** CSS property sets a CSS counter to a given value. It manipulates the value of existing counters, and will only create new counters if there isn't already a counter of the given name on the element.
         *
         * **Syntax**: \`[ <counter-name> <integer>? ]+ | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **85** | **68**  | **17.2** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/counter-set
         */
      counterSet?: ConditionalValue<WithEscapeHatch<CssProperties["counterSet"]>>
       /**
         * The **\`cursor\`** CSS property sets the mouse cursor, if any, to show when the mouse pointer is over an element.
         *
         * **Syntax**: \`[ [ <url> [ <x> <y> ]? , ]* [ auto | default | none | context-menu | help | pointer | progress | wait | cell | crosshair | text | vertical-text | alias | copy | move | no-drop | not-allowed | e-resize | n-resize | ne-resize | nw-resize | s-resize | se-resize | sw-resize | w-resize | ew-resize | ns-resize | nesw-resize | nwse-resize | col-resize | row-resize | all-scroll | zoom-in | zoom-out | grab | grabbing ] ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/cursor
         */
      cursor?: ConditionalValue<WithEscapeHatch<CssProperties["cursor"]>>
       /**
         * The **\`direction\`** CSS property sets the direction of text, table columns, and horizontal overflow. Use \`rtl\` for languages written from right to left (like Hebrew or Arabic), and \`ltr\` for those written from left to right (like English and most other languages).
         *
         * **Syntax**: \`ltr | rtl\`
         *
         * **Initial value**: \`ltr\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **2**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/direction
         */
      direction?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["direction"]>>
       /**
         * The **\`display\`** CSS property sets whether an element is treated as a block or inline element and the layout used for its children, such as flow layout, grid or flex.
         *
         * **Syntax**: \`[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>\`
         *
         * **Initial value**: \`inline\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/display
         */
      display?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["display"]>>
       /**
         * The **\`empty-cells\`** CSS property sets whether borders and backgrounds appear around \`<table>\` cells that have no visible content.
         *
         * **Syntax**: \`show | hide\`
         *
         * **Initial value**: \`show\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/empty-cells
         */
      emptyCells?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["emptyCells"]>>
       /**
         * The **\`filter\`** CSS property applies graphical effects like blur or color shift to an element. Filters are commonly used to adjust the rendering of images, backgrounds, and borders.
         *
         * **Syntax**: \`none | <filter-function-list>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  | IE  |
         * | :------: | :-----: | :-----: | :----: | :-: |
         * |  **53**  | **35**  | **9.1** | **12** | No  |
         * | 18 _-x-_ |         | 6 _-x-_ |        |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/filter
         */
      filter?: ConditionalValue<WithEscapeHatch<UtilityValues["filter"]>>
       /**
         * The **\`flex\`** CSS shorthand property sets how a flex _item_ will grow or shrink to fit the space available in its flex container.
         *
         * **Syntax**: \`none | [ <'flex-grow'> <'flex-shrink'>? || <'flex-basis'> ]\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |    IE    |
         * | :------: | :-----: | :-----: | :----: | :------: |
         * |  **29**  | **20**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ |         | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex
         */
      flex?: ConditionalValue<WithEscapeHatch<UtilityValues["flex"]>>
       /**
         * The **\`flex-basis\`** CSS property sets the initial main size of a flex item. It sets the size of the content box unless otherwise set with \`box-sizing\`.
         *
         * **Syntax**: \`content | <'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **22**  |  **9**  | **12** | **11** |
         * | 22 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-basis
         */
      flexBasis?: ConditionalValue<WithEscapeHatch<UtilityValues["flexBasis"]>>
       /**
         * The **\`flex-direction\`** CSS property sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).
         *
         * **Syntax**: \`row | row-reverse | column | column-reverse\`
         *
         * **Initial value**: \`row\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |    IE    |
         * | :------: | :------: | :-----: | :----: | :------: |
         * |  **29**  |  **81**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ | 49 _-x-_ | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-direction
         */
      flexDirection?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["flexDirection"]>>
       /**
         * The **\`flex-flow\`** CSS shorthand property specifies the direction of a flex container, as well as its wrapping behavior.
         *
         * **Syntax**: \`<'flex-direction'> || <'flex-wrap'>\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-flow
         */
      flexFlow?: ConditionalValue<WithEscapeHatch<CssProperties["flexFlow"]>>
       /**
         * The **\`flex-grow\`** CSS property sets the flex grow factor of a flex item's main size.
         *
         * **Syntax**: \`<number>\`
         *
         * **Initial value**: \`0\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |            IE            |
         * | :------: | :-----: | :-----: | :----: | :----------------------: |
         * |  **29**  | **20**  |  **9**  | **12** |          **11**          |
         * | 22 _-x-_ |         | 7 _-x-_ |        | 10 _(-ms-flex-positive)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-grow
         */
      flexGrow?: ConditionalValue<WithEscapeHatch<CssProperties["flexGrow"]>>
       /**
         * The **\`flex-shrink\`** CSS property sets the flex shrink factor of a flex item. If the size of all flex items is larger than the flex container, items shrink to fit according to \`flex-shrink\`.
         *
         * **Syntax**: \`<number>\`
         *
         * **Initial value**: \`1\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **10** |
         * | 22 _-x-_ |         | 8 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-shrink
         */
      flexShrink?: ConditionalValue<WithEscapeHatch<CssProperties["flexShrink"]>>
       /**
         * The **\`flex-wrap\`** CSS property sets whether flex items are forced onto one line or can wrap onto multiple lines. If wrapping is allowed, it sets the direction that lines are stacked.
         *
         * **Syntax**: \`nowrap | wrap | wrap-reverse\`
         *
         * **Initial value**: \`nowrap\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **28**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-wrap
         */
      flexWrap?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["flexWrap"]>>
       /**
         * The **\`float\`** CSS property places an element on the left or right side of its container, allowing text and inline elements to wrap around it. The element is removed from the normal flow of the page, though still remaining a part of the flow (in contrast to absolute positioning).
         *
         * **Syntax**: \`left | right | none | inline-start | inline-end\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/float
         */
      float?: ConditionalValue<WithEscapeHatch<UtilityValues["float"] | CssVars>>
       /**
         * The **\`font\`** CSS shorthand property sets all the different properties of an element's font. Alternatively, it sets an element's font to a system font.
         *
         * **Syntax**: \`[ [ <'font-style'> || <font-variant-css21> || <'font-weight'> || <'font-stretch'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] | caption | icon | menu | message-box | small-caption | status-bar\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font
         */
      font?: ConditionalValue<WithEscapeHatch<CssProperties["font"]>>
       /**
         * The **\`font-family\`** CSS property specifies a prioritized list of one or more font family names and/or generic family names for the selected element.
         *
         * **Syntax**: \`[ <family-name> | <generic-family> ]#\`
         *
         * **Initial value**: depends on user agent
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-family
         */
      fontFamily?: ConditionalValue<WithEscapeHatch<UtilityValues["fontFamily"]>>
       /**
         * The **\`font-feature-settings\`** CSS property controls advanced typographic features in OpenType fonts.
         *
         * **Syntax**: \`normal | <feature-tag-value>#\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |   IE   |
         * | :------: | :------: | :-----: | :----: | :----: |
         * |  **48**  |  **34**  | **9.1** | **15** | **10** |
         * | 16 _-x-_ | 15 _-x-_ |         |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-feature-settings
         */
      fontFeatureSettings?: ConditionalValue<WithEscapeHatch<CssProperties["fontFeatureSettings"]>>
       /**
         * The **\`font-kerning\`** CSS property sets the use of the kerning information stored in a font.
         *
         * **Syntax**: \`auto | normal | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **33** | **32**  |  **9**  | n/a  | No  |
         * |        |         | 6 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-kerning
         */
      fontKerning?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["fontKerning"]>>
       /**
         * The **\`font-language-override\`** CSS property controls the use of language-specific glyphs in a typeface.
         *
         * **Syntax**: \`normal | <string>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **34**  |   No   | n/a  | No  |
         * |        | 4 _-x-_ |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-language-override
         */
      fontLanguageOverride?: ConditionalValue<WithEscapeHatch<CssProperties["fontLanguageOverride"]>>
       /**
         * The **\`font-optical-sizing\`** CSS property sets whether text rendering is optimized for viewing at different sizes.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **79** | **62**  | **11** | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-optical-sizing
         */
      fontOpticalSizing?: ConditionalValue<WithEscapeHatch<CssProperties["fontOpticalSizing"]>>
       /**
         * **Syntax**: \`normal | light | dark | <palette-identifier>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **101** | **107** | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-palette
         */
      fontPalette?: ConditionalValue<WithEscapeHatch<CssProperties["fontPalette"]>>
       /**
         * The **\`font-variation-settings\`** CSS property provides low-level control over variable font characteristics, by specifying the four letter axis names of the characteristics you want to vary, along with their values.
         *
         * **Syntax**: \`normal | [ <string> <number> ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **62** | **62**  | **11** | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variation-settings
         */
      fontVariationSettings?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariationSettings"]>>
       /**
         * The **\`font-size\`** CSS property sets the size of the font. Changing the font size also updates the sizes of the font size-relative \`<length>\` units, such as \`em\`, \`ex\`, and so forth.
         *
         * **Syntax**: \`<absolute-size> | <relative-size> | <length-percentage>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-size
         */
      fontSize?: ConditionalValue<WithEscapeHatch<UtilityValues["fontSize"]>>
       /**
         * The **\`font-size-adjust\`** CSS property sets the size of lower-case letters relative to the current font size (which defines the size of upper-case letters).
         *
         * **Syntax**: \`none | [ ex-height | cap-height | ch-width | ic-width | ic-height ]? [ from-font | <number> ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * |   No   |  **3**  | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-size-adjust
         */
      fontSizeAdjust?: ConditionalValue<WithEscapeHatch<CssProperties["fontSizeAdjust"]>>
       /**
         * The **\`font-smooth\`** CSS property controls the application of anti-aliasing when fonts are rendered.
         *
         * **Syntax**: \`auto | never | always | <absolute-size> | <length>\`
         *
         * **Initial value**: \`auto\`
         *
         * |              Chrome              |              Firefox               |              Safari              | Edge | IE  |
         * | :------------------------------: | :--------------------------------: | :------------------------------: | :--: | :-: |
         * | **5** _(-webkit-font-smoothing)_ | **25** _(-moz-osx-font-smoothing)_ | **4** _(-webkit-font-smoothing)_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-smooth
         */
      fontSmooth?: ConditionalValue<WithEscapeHatch<CssProperties["fontSmooth"]>>
       /**
         * The **\`font-stretch\`** CSS property selects a normal, condensed, or expanded face from a font.
         *
         * **Syntax**: \`<font-stretch-absolute>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **60** |  **9**  | **11** | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-stretch
         */
      fontStretch?: ConditionalValue<WithEscapeHatch<CssProperties["fontStretch"]>>
       /**
         * The **\`font-style\`** CSS property sets whether a font should be styled with a normal, italic, or oblique face from its \`font-family\`.
         *
         * **Syntax**: \`normal | italic | oblique <angle>?\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-style
         */
      fontStyle?: ConditionalValue<WithEscapeHatch<CssProperties["fontStyle"]>>
       /**
         * The **\`font-synthesis\`** CSS property controls which missing typefaces, bold, italic, or small-caps, may be synthesized by the browser.
         *
         * **Syntax**: \`none | [ weight || style || small-caps || position]\`
         *
         * **Initial value**: \`weight style small-caps position \`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **97** | **34**  | **9**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis
         */
      fontSynthesis?: ConditionalValue<WithEscapeHatch<CssProperties["fontSynthesis"]>>
       /**
         * The **\`font-synthesis-position\`** CSS property lets you specify whether or not a browser may synthesize the subscript and superscript "position" typefaces when they are missing in a font family, while using \`font-variant-position\` to set the positions.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **118** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-position
         */
      fontSynthesisPosition?: ConditionalValue<WithEscapeHatch<CssProperties["fontSynthesisPosition"]>>
       /**
         * The **\`font-synthesis-small-caps\`** CSS property lets you specify whether or not the browser may synthesize small-caps typeface when it is missing in a font family. Small-caps glyphs typically use the form of uppercase letters but are reduced to the size of lowercase letters.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-small-caps
         */
      fontSynthesisSmallCaps?: ConditionalValue<WithEscapeHatch<CssProperties["fontSynthesisSmallCaps"]>>
       /**
         * The **\`font-synthesis-style\`** CSS property lets you specify whether or not the browser may synthesize the oblique typeface when it is missing in a font family.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-style
         */
      fontSynthesisStyle?: ConditionalValue<WithEscapeHatch<CssProperties["fontSynthesisStyle"]>>
       /**
         * The **\`font-synthesis-weight\`** CSS property lets you specify whether or not the browser may synthesize the bold typeface when it is missing in a font family.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **97** | **111** | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-synthesis-weight
         */
      fontSynthesisWeight?: ConditionalValue<WithEscapeHatch<CssProperties["fontSynthesisWeight"]>>
       /**
         * The **\`font-variant\`** CSS shorthand property allows you to set all the font variants for a font.
         *
         * **Syntax**: \`normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> || stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) || [ small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps ] || <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero || <east-asian-variant-values> || <east-asian-width-values> || ruby ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant
         */
      fontVariant?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariant"]>>
       /**
         * The **\`font-variant-alternates\`** CSS property controls the usage of alternate glyphs. These alternate glyphs may be referenced by alternative names defined in \`@font-feature-values\`.
         *
         * **Syntax**: \`normal | [ stylistic( <feature-value-name> ) || historical-forms || styleset( <feature-value-name># ) || character-variant( <feature-value-name># ) || swash( <feature-value-name> ) || ornaments( <feature-value-name> ) || annotation( <feature-value-name> ) ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  | Edge | IE  |
         * | :-----: | :-----: | :-----: | :--: | :-: |
         * | **111** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-alternates
         */
      fontVariantAlternates?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantAlternates"]>>
       /**
         * The **\`font-variant-caps\`** CSS property controls the use of alternate glyphs for capital letters.
         *
         * **Syntax**: \`normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **52** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-caps
         */
      fontVariantCaps?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantCaps"]>>
       /**
         * The **\`font-variant-east-asian\`** CSS property controls the use of alternate glyphs for East Asian scripts, like Japanese and Chinese.
         *
         * **Syntax**: \`normal | [ <east-asian-variant-values> || <east-asian-width-values> || ruby ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **63** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-east-asian
         */
      fontVariantEastAsian?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantEastAsian"]>>
       /**
         * **Syntax**: \`normal | text | emoji | unicode\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-emoji
         */
      fontVariantEmoji?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantEmoji"]>>
       /**
         * The **\`font-variant-ligatures\`** CSS property controls which ligatures and contextual forms are used in textual content of the elements it applies to. This leads to more harmonized forms in the resulting text.
         *
         * **Syntax**: \`normal | none | [ <common-lig-values> || <discretionary-lig-values> || <historical-lig-values> || <contextual-alt-values> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  | Edge | IE  |
         * | :------: | :-----: | :-----: | :--: | :-: |
         * |  **34**  | **34**  | **9.1** | n/a  | No  |
         * | 31 _-x-_ |         | 7 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-ligatures
         */
      fontVariantLigatures?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantLigatures"]>>
       /**
         * The **\`font-variant-numeric\`** CSS property controls the usage of alternate glyphs for numbers, fractions, and ordinal markers.
         *
         * **Syntax**: \`normal | [ <numeric-figure-values> || <numeric-spacing-values> || <numeric-fraction-values> || ordinal || slashed-zero ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **52** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-numeric
         */
      fontVariantNumeric?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantNumeric"]>>
       /**
         * The **\`font-variant-position\`** CSS property controls the use of alternate, smaller glyphs that are positioned as superscript or subscript.
         *
         * **Syntax**: \`normal | sub | super\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari  | Edge | IE  |
         * | :-----: | :-----: | :-----: | :--: | :-: |
         * | **117** | **34**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-variant-position
         */
      fontVariantPosition?: ConditionalValue<WithEscapeHatch<CssProperties["fontVariantPosition"]>>
       /**
         * The **\`font-weight\`** CSS property sets the weight (or boldness) of the font. The weights available depend on the \`font-family\` that is currently set.
         *
         * **Syntax**: \`<font-weight-absolute> | bolder | lighter\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **2**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/font-weight
         */
      fontWeight?: ConditionalValue<WithEscapeHatch<UtilityValues["fontWeight"]>>
       /**
         * The **\`forced-color-adjust\`** CSS property allows authors to opt certain elements out of forced colors mode. This then restores the control of those values to CSS.
         *
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |              Edge               |                 IE                  |
         * | :----: | :-----: | :----: | :-----------------------------: | :---------------------------------: |
         * | **89** | **113** |   No   |             **79**              | **10** _(-ms-high-contrast-adjust)_ |
         * |        |         |        | 12 _(-ms-high-contrast-adjust)_ |                                     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/forced-color-adjust
         */
      forcedColorAdjust?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["forcedColorAdjust"]>>
       /**
         * The **\`gap\`** CSS property sets the gaps (gutters) between rows and columns. It is a shorthand for \`row-gap\` and \`column-gap\`.
         *
         * **Syntax**: \`<'row-gap'> <'column-gap'>?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/gap
         */
      gap?: ConditionalValue<WithEscapeHatch<UtilityValues["gap"]>>
       /**
         * The **\`grid\`** CSS property is a shorthand property that sets all of the explicit and implicit grid properties in a single declaration.
         *
         * **Syntax**: \`<'grid-template'> | <'grid-template-rows'> / [ auto-flow && dense? ] <'grid-auto-columns'>? | [ auto-flow && dense? ] <'grid-auto-rows'>? / <'grid-template-columns'>\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid
         */
      grid?: ConditionalValue<WithEscapeHatch<CssProperties["grid"]>>
       /**
         * The **\`grid-area\`** CSS shorthand property specifies a grid item's size and location within a grid by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the edges of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]{0,3}\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-area
         */
      gridArea?: ConditionalValue<WithEscapeHatch<CssProperties["gridArea"]>>
       /**
         * The **\`grid-auto-columns\`** CSS property specifies the size of an implicitly-created grid column track or pattern of tracks.
         *
         * **Syntax**: \`<track-size>+\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |             IE              |
         * | :----: | :-----: | :------: | :----: | :-------------------------: |
         * | **57** | **70**  | **10.1** | **16** | **10** _(-ms-grid-columns)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-columns
         */
      gridAutoColumns?: ConditionalValue<WithEscapeHatch<UtilityValues["gridAutoColumns"]>>
       /**
         * The **\`grid-auto-flow\`** CSS property controls how the auto-placement algorithm works, specifying exactly how auto-placed items get flowed into the grid.
         *
         * **Syntax**: \`[ row | column ] || dense\`
         *
         * **Initial value**: \`row\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-flow
         */
      gridAutoFlow?: ConditionalValue<WithEscapeHatch<CssProperties["gridAutoFlow"]>>
       /**
         * The **\`grid-auto-rows\`** CSS property specifies the size of an implicitly-created grid row track or pattern of tracks.
         *
         * **Syntax**: \`<track-size>+\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |            IE            |
         * | :----: | :-----: | :------: | :----: | :----------------------: |
         * | **57** | **70**  | **10.1** | **16** | **10** _(-ms-grid-rows)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-auto-rows
         */
      gridAutoRows?: ConditionalValue<WithEscapeHatch<UtilityValues["gridAutoRows"]>>
       /**
         * The **\`grid-column\`** CSS shorthand property specifies a grid item's size and location within a grid column by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column
         */
      gridColumn?: ConditionalValue<WithEscapeHatch<UtilityValues["gridColumn"]>>
       /**
         * The **\`grid-column-end\`** CSS property specifies a grid item's end position within the grid column by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the block-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column-end
         */
      gridColumnEnd?: ConditionalValue<WithEscapeHatch<CssProperties["gridColumnEnd"]>>
       gridColumnGap?: ConditionalValue<WithEscapeHatch<UtilityValues["gridColumnGap"]>>
       /**
         * The **\`grid-column-start\`** CSS property specifies a grid item's start position within the grid column by contributing a line, a span, or nothing (automatic) to its grid placement. This start position defines the block-start edge of the grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-column-start
         */
      gridColumnStart?: ConditionalValue<WithEscapeHatch<CssProperties["gridColumnStart"]>>
       gridGap?: ConditionalValue<WithEscapeHatch<UtilityValues["gridGap"]>>
       /**
         * The **\`grid-row\`** CSS shorthand property specifies a grid item's size and location within a grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start and inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line> [ / <grid-line> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row
         */
      gridRow?: ConditionalValue<WithEscapeHatch<UtilityValues["gridRow"]>>
       /**
         * The **\`grid-row-end\`** CSS property specifies a grid item's end position within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-end edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row-end
         */
      gridRowEnd?: ConditionalValue<WithEscapeHatch<CssProperties["gridRowEnd"]>>
       gridRowGap?: ConditionalValue<WithEscapeHatch<UtilityValues["gridRowGap"]>>
       /**
         * The **\`grid-row-start\`** CSS property specifies a grid item's start position within the grid row by contributing a line, a span, or nothing (automatic) to its grid placement, thereby specifying the inline-start edge of its grid area.
         *
         * **Syntax**: \`<grid-line>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-row-start
         */
      gridRowStart?: ConditionalValue<WithEscapeHatch<CssProperties["gridRowStart"]>>
       /**
         * The **\`grid-template\`** CSS property is a shorthand property for defining grid columns, grid rows, and grid areas.
         *
         * **Syntax**: \`none | [ <'grid-template-rows'> / <'grid-template-columns'> ] | [ <line-names>? <string> <track-size>? <line-names>? ]+ [ / <explicit-track-list> ]?\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template
         */
      gridTemplate?: ConditionalValue<WithEscapeHatch<CssProperties["gridTemplate"]>>
       /**
         * The **\`grid-template-areas\`** CSS property specifies named grid areas, establishing the cells in the grid and assigning them names.
         *
         * **Syntax**: \`none | <string>+\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **57** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-areas
         */
      gridTemplateAreas?: ConditionalValue<WithEscapeHatch<CssProperties["gridTemplateAreas"]>>
       /**
         * The **\`grid-template-columns\`** CSS property defines the line names and track sizing functions of the grid columns.
         *
         * **Syntax**: \`none | <track-list> | <auto-track-list> | subgrid <line-name-list>?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |             IE              |
         * | :----: | :-----: | :------: | :----: | :-------------------------: |
         * | **57** | **52**  | **10.1** | **16** | **10** _(-ms-grid-columns)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-columns
         */
      gridTemplateColumns?: ConditionalValue<WithEscapeHatch<UtilityValues["gridTemplateColumns"]>>
       /**
         * The **\`grid-template-rows\`** CSS property defines the line names and track sizing functions of the grid rows.
         *
         * **Syntax**: \`none | <track-list> | <auto-track-list> | subgrid <line-name-list>?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |            IE            |
         * | :----: | :-----: | :------: | :----: | :----------------------: |
         * | **57** | **52**  | **10.1** | **16** | **10** _(-ms-grid-rows)_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/grid-template-rows
         */
      gridTemplateRows?: ConditionalValue<WithEscapeHatch<UtilityValues["gridTemplateRows"]>>
       /**
         * The **\`hanging-punctuation\`** CSS property specifies whether a punctuation mark should hang at the start or end of a line of text. Hanging punctuation may be placed outside the line box.
         *
         * **Syntax**: \`none | [ first || [ force-end | allow-end ] || last ]\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   No    | **10** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hanging-punctuation
         */
      hangingPunctuation?: ConditionalValue<WithEscapeHatch<CssProperties["hangingPunctuation"]>>
       /**
         * The **\`height\`** CSS property specifies the height of an element. By default, the property defines the height of the content area. If \`box-sizing\` is set to \`border-box\`, however, it instead determines the height of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/height
         */
      height?: ConditionalValue<WithEscapeHatch<UtilityValues["height"]>>
       /**
         * The **\`hyphenate-character\`** CSS property sets the character (or string) used at the end of a line before a hyphenation break.
         *
         * **Syntax**: \`auto | <string>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |  Safari   | Edge | IE  |
         * | :-----: | :-----: | :-------: | :--: | :-: |
         * | **106** | **98**  |  **17**   | n/a  | No  |
         * | 6 _-x-_ |         | 5.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hyphenate-character
         */
      hyphenateCharacter?: ConditionalValue<WithEscapeHatch<CssProperties["hyphenateCharacter"]>>
       /**
         * The **\`hyphenate-limit-chars\`** CSS property specifies the minimum word length to allow hyphenation of words as well as the the minimum number of characters before and after the hyphen.
         *
         * **Syntax**: \`[ auto | <integer> ]{1,3}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** |   No    |   No   | n/a  | No  |
         */
      hyphenateLimitChars?: ConditionalValue<WithEscapeHatch<CssProperties["hyphenateLimitChars"]>>
       /**
         * The **\`hyphens\`** CSS property specifies how words should be hyphenated when text wraps across multiple lines. It can prevent hyphenation entirely, hyphenate at manually-specified points within the text, or let the browser automatically insert hyphens where appropriate.
         *
         * **Syntax**: \`none | manual | auto\`
         *
         * **Initial value**: \`manual\`
         *
         * |  Chrome  | Firefox |  Safari   |  Edge  |      IE      |
         * | :------: | :-----: | :-------: | :----: | :----------: |
         * |  **55**  | **43**  |  **17**   | **79** | **10** _-x-_ |
         * | 13 _-x-_ | 6 _-x-_ | 5.1 _-x-_ |        |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/hyphens
         */
      hyphens?: ConditionalValue<WithEscapeHatch<CssProperties["hyphens"]>>
       /**
         * The **\`image-orientation\`** CSS property specifies a layout-independent correction to the orientation of an image.
         *
         * **Syntax**: \`from-image | <angle> | [ <angle>? flip ]\`
         *
         * **Initial value**: \`from-image\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **81** | **26**  | **13.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/image-orientation
         */
      imageOrientation?: ConditionalValue<WithEscapeHatch<CssProperties["imageOrientation"]>>
       /**
         * The **\`image-rendering\`** CSS property sets an image scaling algorithm. The property applies to an element itself, to any images set in its other properties, and to its descendants.
         *
         * **Syntax**: \`auto | crisp-edges | pixelated\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **13** | **3.6** | **6**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/image-rendering
         */
      imageRendering?: ConditionalValue<WithEscapeHatch<CssProperties["imageRendering"]>>
       /**
         * **Syntax**: \`[ from-image || <resolution> ] && snap?\`
         *
         * **Initial value**: \`1dppx\`
         */
      imageResolution?: ConditionalValue<WithEscapeHatch<CssProperties["imageResolution"]>>
       imeMode?: ConditionalValue<WithEscapeHatch<CssProperties["imeMode"]>>
       /**
         * The \`initial-letter\` CSS property sets styling for dropped, raised, and sunken initial letters.
         *
         * **Syntax**: \`normal | [ <number> <integer>? ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |   Safari    | Edge | IE  |
         * | :-----: | :-----: | :---------: | :--: | :-: |
         * | **110** |   No    | **9** _-x-_ | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/initial-letter
         */
      initialLetter?: ConditionalValue<WithEscapeHatch<CssProperties["initialLetter"]>>
       initialLetterAlign?: ConditionalValue<WithEscapeHatch<CssProperties["initialLetterAlign"]>>
       /**
         * The **\`inline-size\`** CSS property defines the horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`width\` or the \`height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'width'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inline-size
         */
      inlineSize?: ConditionalValue<WithEscapeHatch<UtilityValues["inlineSize"]>>
       /**
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         */
      inputSecurity?: ConditionalValue<WithEscapeHatch<CssProperties["inputSecurity"]>>
       /**
         * The **\`inset\`** CSS property is a shorthand that corresponds to the \`top\`, \`right\`, \`bottom\`, and/or \`left\` properties. It has the same multi-value syntax of the \`margin\` shorthand.
         *
         * **Syntax**: \`<'top'>{1,4}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset
         */
      inset?: ConditionalValue<WithEscapeHatch<UtilityValues["inset"]>>
       /**
         * The **\`inset-block\`** CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block
         */
      insetBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["insetBlock"]>>
       /**
         * The **\`inset-block-end\`** CSS property defines the logical block end offset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block-end
         */
      insetBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["insetBlockEnd"]>>
       /**
         * The **\`inset-block-start\`** CSS property defines the logical block start offset of an element, which maps to a physical inset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block-start
         */
      insetBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["insetBlockStart"]>>
       /**
         * The **\`inset-inline\`** CSS property defines the logical start and end offsets of an element in the inline direction, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline
         */
      insetInline?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInline"]>>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      insetInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineEnd"]>>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      insetInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineStart"]>>
       /**
         * The **\`isolation\`** CSS property determines whether an element must create a new stacking context.
         *
         * **Syntax**: \`auto | isolate\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **41** | **36**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/isolation
         */
      isolation?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["isolation"]>>
       /**
         * The CSS **\`justify-content\`** property defines how the browser distributes space between and around content items along the main-axis of a flex container, and the inline axis of a grid container.
         *
         * **Syntax**: \`normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ]\`
         *
         * **Initial value**: \`normal\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **29**  | **20**  |  **9**  | **12** | **11** |
         * | 21 _-x-_ |         | 7 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-content
         */
      justifyContent?: ConditionalValue<WithEscapeHatch<CssProperties["justifyContent"]>>
       /**
         * The CSS **\`justify-items\`** property defines the default \`justify-self\` for all items of the box, giving them all a default way of justifying each box along the appropriate axis.
         *
         * **Syntax**: \`normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ] | legacy | legacy && [ left | right | center ]\`
         *
         * **Initial value**: \`legacy\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **52** | **20**  | **9**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-items
         */
      justifyItems?: ConditionalValue<WithEscapeHatch<CssProperties["justifyItems"]>>
       /**
         * The CSS **\`justify-self\`** property sets the way a box is justified inside its alignment container along the appropriate axis.
         *
         * **Syntax**: \`auto | normal | stretch | <baseline-position> | <overflow-position>? [ <self-position> | left | right ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :------: | :----: | :----: |
         * | **57** | **45**  | **10.1** | **16** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-self
         */
      justifySelf?: ConditionalValue<WithEscapeHatch<CssProperties["justifySelf"]>>
       /**
         * The **\`justify-tracks\`** CSS property sets the alignment in the masonry axis for grid containers that have masonry in their inline axis.
         *
         * **Syntax**: \`[ normal | <content-distribution> | <overflow-position>? [ <content-position> | left | right ] ]#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/justify-tracks
         */
      justifyTracks?: ConditionalValue<WithEscapeHatch<CssProperties["justifyTracks"]>>
       /**
         * The **\`left\`** CSS property participates in specifying the horizontal position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/left
         */
      left?: ConditionalValue<WithEscapeHatch<UtilityValues["left"]>>
       /**
         * The **\`letter-spacing\`** CSS property sets the horizontal spacing behavior between text characters. This value is added to the natural spacing between characters while rendering the text. Positive values of \`letter-spacing\` causes characters to spread farther apart, while negative values of \`letter-spacing\` bring characters closer together.
         *
         * **Syntax**: \`normal | <length>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/letter-spacing
         */
      letterSpacing?: ConditionalValue<WithEscapeHatch<UtilityValues["letterSpacing"]>>
       /**
         * The **\`line-break\`** CSS property sets how to break lines of Chinese, Japanese, or Korean (CJK) text when working with punctuation and symbols.
         *
         * **Syntax**: \`auto | loose | normal | strict | anywhere\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE    |
         * | :-----: | :-----: | :-----: | :----: | :-----: |
         * | **58**  | **69**  | **11**  | **14** | **5.5** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |         |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-break
         */
      lineBreak?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["lineBreak"]>>
       /**
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      lineClamp?: ConditionalValue<WithEscapeHatch<CssProperties["lineClamp"]>>
       /**
         * The **\`line-height\`** CSS property sets the height of a line box. It's commonly used to set the distance between lines of text. On block-level elements, it specifies the minimum height of line boxes within the element. On non-replaced inline elements, it specifies the height that is used to calculate line box height.
         *
         * **Syntax**: \`normal | <number> | <length> | <percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-height
         */
      lineHeight?: ConditionalValue<WithEscapeHatch<UtilityValues["lineHeight"]>>
       /**
         * The **\`line-height-step\`** CSS property sets the step unit for line box heights. When the property is set, line box heights are rounded up to the closest multiple of the unit.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |  n/a   |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/line-height-step
         */
      lineHeightStep?: ConditionalValue<WithEscapeHatch<CssProperties["lineHeightStep"]>>
       /**
         * The **\`list-style\`** CSS shorthand property allows you to set all the list style properties at once.
         *
         * **Syntax**: \`<'list-style-type'> || <'list-style-position'> || <'list-style-image'>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style
         */
      listStyle?: ConditionalValue<WithEscapeHatch<CssProperties["listStyle"]>>
       /**
         * The **\`list-style-image\`** CSS property sets an image to be used as the list item marker.
         *
         * **Syntax**: \`<image> | none\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-image
         */
      listStyleImage?: ConditionalValue<WithEscapeHatch<CssProperties["listStyleImage"]>>
       /**
         * The **\`list-style-position\`** CSS property sets the position of the \`::marker\` relative to a list item.
         *
         * **Syntax**: \`inside | outside\`
         *
         * **Initial value**: \`outside\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-position
         */
      listStylePosition?: ConditionalValue<WithEscapeHatch<CssProperties["listStylePosition"]>>
       /**
         * The **\`list-style-type\`** CSS property sets the marker (such as a disc, character, or custom counter style) of a list item element.
         *
         * **Syntax**: \`<counter-style> | <string> | none\`
         *
         * **Initial value**: \`disc\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/list-style-type
         */
      listStyleType?: ConditionalValue<WithEscapeHatch<CssProperties["listStyleType"]>>
       /**
         * The **\`margin\`** CSS shorthand property sets the margin area on all four sides of an element.
         *
         * **Syntax**: \`[ <length> | <percentage> | auto ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin
         */
      margin?: ConditionalValue<WithEscapeHatch<UtilityValues["margin"]>>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      marginBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBlock"]>>
       /**
         * The **\`margin-block-end\`** CSS property defines the logical block end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block-end
         */
      marginBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBlockEnd"]>>
       /**
         * The **\`margin-block-start\`** CSS property defines the logical block start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block-start
         */
      marginBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBlockStart"]>>
       /**
         * The **\`margin-bottom\`** CSS property sets the margin area on the bottom of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-bottom
         */
      marginBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBottom"]>>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      marginInline?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInline"]>>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      marginInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineEnd"]>>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      marginInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineStart"]>>
       /**
         * The **\`margin-left\`** CSS property sets the margin area on the left side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-left
         */
      marginLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["marginLeft"]>>
       /**
         * The **\`margin-right\`** CSS property sets the margin area on the right side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-right
         */
      marginRight?: ConditionalValue<WithEscapeHatch<UtilityValues["marginRight"]>>
       /**
         * The **\`margin-top\`** CSS property sets the margin area on the top of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-top
         */
      marginTop?: ConditionalValue<WithEscapeHatch<UtilityValues["marginTop"]>>
       /**
         * The \`margin-trim\` property allows the container to trim the margins of its children where they adjoin the container's edges.
         *
         * **Syntax**: \`none | in-flow | all\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * |   No   |   No    | **16.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-trim
         */
      marginTrim?: ConditionalValue<WithEscapeHatch<CssProperties["marginTrim"]>>
       /**
         * The **\`mask\`** CSS shorthand property hides an element (partially or fully) by masking or clipping the image at specific points.
         *
         * **Syntax**: \`<mask-layer>#\`
         *
         * | Chrome | Firefox |  Safari   | Edge  | IE  |
         * | :----: | :-----: | :-------: | :---: | :-: |
         * | **1**  | **53**  | **15.4**  | 12-79 | No  |
         * |        |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask
         */
      mask?: ConditionalValue<WithEscapeHatch<CssProperties["mask"]>>
       /**
         * The **\`mask-border\`** CSS shorthand property lets you create a mask along the edge of an element's border.
         *
         * **Syntax**: \`<'mask-border-source'> || <'mask-border-slice'> [ / <'mask-border-width'>? [ / <'mask-border-outset'> ]? ]? || <'mask-border-repeat'> || <'mask-border-mode'>\`
         *
         * |              Chrome              | Firefox |             Safari             | Edge | IE  |
         * | :------------------------------: | :-----: | :----------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image)_ |   No    |            **17.2**            | n/a  | No  |
         * |                                  |         | 3.1 _(-webkit-mask-box-image)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border
         */
      maskBorder?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorder"]>>
       /**
         * The **\`mask-border-mode\`** CSS property specifies the blending mode used in a mask border.
         *
         * **Syntax**: \`luminance | alpha\`
         *
         * **Initial value**: \`alpha\`
         */
      maskBorderMode?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderMode"]>>
       /**
         * The **\`mask-border-outset\`** CSS property specifies the distance by which an element's mask border is set out from its border box.
         *
         * **Syntax**: \`[ <length> | <number> ]{1,4}\`
         *
         * **Initial value**: \`0\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-outset)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-outset)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-outset
         */
      maskBorderOutset?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderOutset"]>>
       /**
         * The **\`mask-border-repeat\`** CSS property sets how the edge regions of a source image are adjusted to fit the dimensions of an element's mask border.
         *
         * **Syntax**: \`[ stretch | repeat | round | space ]{1,2}\`
         *
         * **Initial value**: \`stretch\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-repeat)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-repeat)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-repeat
         */
      maskBorderRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderRepeat"]>>
       /**
         * The **\`mask-border-slice\`** CSS property divides the image set by \`mask-border-source\` into regions. These regions are used to form the components of an element's mask border.
         *
         * **Syntax**: \`<number-percentage>{1,4} fill?\`
         *
         * **Initial value**: \`0\`
         *
         * |                 Chrome                 | Firefox |                Safari                | Edge | IE  |
         * | :------------------------------------: | :-----: | :----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-slice)_ |   No    |               **17.2**               | n/a  | No  |
         * |                                        |         | 3.1 _(-webkit-mask-box-image-slice)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-slice
         */
      maskBorderSlice?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderSlice"]>>
       /**
         * The **\`mask-border-source\`** CSS property sets the source image used to create an element's mask border.
         *
         * **Syntax**: \`none | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * |                 Chrome                  | Firefox |                Safari                 | Edge | IE  |
         * | :-------------------------------------: | :-----: | :-----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-source)_ |   No    |               **17.2**                | n/a  | No  |
         * |                                         |         | 3.1 _(-webkit-mask-box-image-source)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-source
         */
      maskBorderSource?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderSource"]>>
       /**
         * The **\`mask-border-width\`** CSS property sets the width of an element's mask border.
         *
         * **Syntax**: \`[ <length-percentage> | <number> | auto ]{1,4}\`
         *
         * **Initial value**: \`auto\`
         *
         * |                 Chrome                 | Firefox |                Safari                | Edge | IE  |
         * | :------------------------------------: | :-----: | :----------------------------------: | :--: | :-: |
         * | **1** _(-webkit-mask-box-image-width)_ |   No    |               **17.2**               | n/a  | No  |
         * |                                        |         | 3.1 _(-webkit-mask-box-image-width)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-border-width
         */
      maskBorderWidth?: ConditionalValue<WithEscapeHatch<CssProperties["maskBorderWidth"]>>
       /**
         * The **\`mask-clip\`** CSS property determines the area which is affected by a mask. The painted content of an element must be restricted to this area.
         *
         * **Syntax**: \`[ <geometry-box> | no-clip ]#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-clip
         */
      maskClip?: ConditionalValue<WithEscapeHatch<CssProperties["maskClip"]>>
       /**
         * The **\`mask-composite\`** CSS property represents a compositing operation used on the current mask layer with the mask layers below it.
         *
         * **Syntax**: \`<compositing-operator>#\`
         *
         * **Initial value**: \`add\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 18-79 | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-composite
         */
      maskComposite?: ConditionalValue<WithEscapeHatch<CssProperties["maskComposite"]>>
       /**
         * The **\`mask-image\`** CSS property sets the image that is used as mask layer for an element. By default this means the alpha channel of the mask image will be multiplied with the alpha channel of the element. This can be controlled with the \`mask-mode\` property.
         *
         * **Syntax**: \`<mask-reference>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 16-79 | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-image
         */
      maskImage?: ConditionalValue<WithEscapeHatch<CssProperties["maskImage"]>>
       /**
         * The **\`mask-mode\`** CSS property sets whether the mask reference defined by \`mask-image\` is treated as a luminance or alpha mask.
         *
         * **Syntax**: \`<masking-mode>#\`
         *
         * **Initial value**: \`match-source\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-mode
         */
      maskMode?: ConditionalValue<WithEscapeHatch<CssProperties["maskMode"]>>
       /**
         * The **\`mask-origin\`** CSS property sets the origin of a mask.
         *
         * **Syntax**: \`<geometry-box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **120** | **53**  | **15.4** | n/a  | No  |
         * | 1 _-x-_ |         | 4 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-origin
         */
      maskOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["maskOrigin"]>>
       /**
         * The **\`mask-position\`** CSS property sets the initial position, relative to the mask position layer set by \`mask-origin\`, for each defined mask image.
         *
         * **Syntax**: \`<position>#\`
         *
         * **Initial value**: \`center\`
         *
         * | Chrome  | Firefox |  Safari   | Edge  | IE  |
         * | :-----: | :-----: | :-------: | :---: | :-: |
         * | **120** | **53**  | **15.4**  | 18-79 | No  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-position
         */
      maskPosition?: ConditionalValue<WithEscapeHatch<CssProperties["maskPosition"]>>
       /**
         * The **\`mask-repeat\`** CSS property sets how mask images are repeated. A mask image can be repeated along the horizontal axis, the vertical axis, both axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome  | Firefox |  Safari   | Edge  | IE  |
         * | :-----: | :-----: | :-------: | :---: | :-: |
         * | **120** | **53**  | **15.4**  | 18-79 | No  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-repeat
         */
      maskRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["maskRepeat"]>>
       /**
         * The **\`mask-size\`** CSS property specifies the sizes of the mask images. The size of the image can be fully or partially constrained in order to preserve its intrinsic ratio.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |  Safari  | Edge  | IE  |
         * | :-----: | :-----: | :------: | :---: | :-: |
         * | **120** | **53**  | **15.4** | 18-79 | No  |
         * | 4 _-x-_ |         | 4 _-x-_  |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-size
         */
      maskSize?: ConditionalValue<WithEscapeHatch<CssProperties["maskSize"]>>
       /**
         * The **\`mask-type\`** CSS property sets whether an SVG \`<mask>\` element is used as a _luminance_ or an _alpha_ mask. It applies to the \`<mask>\` element itself.
         *
         * **Syntax**: \`luminance | alpha\`
         *
         * **Initial value**: \`luminance\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **24** | **35**  | **7**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mask-type
         */
      maskType?: ConditionalValue<WithEscapeHatch<CssProperties["maskType"]>>
       /**
         * This feature is not Baseline because it does not work in some of the most widely-used browsers.
         *
         * **Syntax**: \`[ pack | next ] || [ definite-first | ordered ]\`
         *
         * **Initial value**: \`pack\`
         *
         * | Chrome | Firefox |   Safari    | Edge | IE  |
         * | :----: | :-----: | :---------: | :--: | :-: |
         * |   No   |   No    | **preview** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/masonry-auto-flow
         */
      masonryAutoFlow?: ConditionalValue<WithEscapeHatch<CssProperties["masonryAutoFlow"]>>
       /**
         * The **\`math-depth\`** property describes a notion of _depth_ for each element of a mathematical formula, with respect to the top-level container of that formula. Concretely, this is used to determine the computed value of the font-size property when its specified value is \`math\`.
         *
         * **Syntax**: \`auto-add | add(<integer>) | <integer>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** | **117** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-depth
         */
      mathDepth?: ConditionalValue<WithEscapeHatch<CssProperties["mathDepth"]>>
       /**
         * The \`math-shift\` property indicates whether superscripts inside MathML formulas should be raised by a normal or compact shift.
         *
         * **Syntax**: \`normal | compact\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **109** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-shift
         */
      mathShift?: ConditionalValue<WithEscapeHatch<CssProperties["mathShift"]>>
       /**
         * The \`math-style\` property indicates whether MathML equations should render with normal or compact height.
         *
         * **Syntax**: \`normal | compact\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **109** | **117** | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/math-style
         */
      mathStyle?: ConditionalValue<WithEscapeHatch<CssProperties["mathStyle"]>>
       /**
         * The **\`max-block-size\`** CSS property specifies the maximum size of an element in the direction opposite that of the writing direction as specified by \`writing-mode\`. That is, if the writing direction is horizontal, then \`max-block-size\` is equivalent to \`max-height\`; if the writing direction is vertical, \`max-block-size\` is the same as \`max-width\`.
         *
         * **Syntax**: \`<'max-width'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-block-size
         */
      maxBlockSize?: ConditionalValue<WithEscapeHatch<UtilityValues["maxBlockSize"]>>
       /**
         * The **\`max-height\`** CSS property sets the maximum height of an element. It prevents the used value of the \`height\` property from becoming larger than the value specified for \`max-height\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **18** |  **1**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-height
         */
      maxHeight?: ConditionalValue<WithEscapeHatch<UtilityValues["maxHeight"]>>
       /**
         * The **\`max-inline-size\`** CSS property defines the horizontal or vertical maximum size of an element's block, depending on its writing mode. It corresponds to either the \`max-width\` or the \`max-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'max-width'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |   Safari   | Edge | IE  |
         * | :----: | :-----: | :--------: | :--: | :-: |
         * | **57** | **41**  |  **12.1**  | n/a  | No  |
         * |        |         | 10.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-inline-size
         */
      maxInlineSize?: ConditionalValue<WithEscapeHatch<UtilityValues["maxInlineSize"]>>
       /**
         * **Syntax**: \`none | <integer>\`
         *
         * **Initial value**: \`none\`
         */
      maxLines?: ConditionalValue<WithEscapeHatch<CssProperties["maxLines"]>>
       /**
         * The **\`max-width\`** CSS property sets the maximum width of an element. It prevents the used value of the \`width\` property from becoming larger than the value specified by \`max-width\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-width
         */
      maxWidth?: ConditionalValue<WithEscapeHatch<UtilityValues["maxWidth"]>>
       /**
         * The **\`min-block-size\`** CSS property defines the minimum horizontal or vertical size of an element's block, depending on its writing mode. It corresponds to either the \`min-width\` or the \`min-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'min-width'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-block-size
         */
      minBlockSize?: ConditionalValue<WithEscapeHatch<UtilityValues["minBlockSize"]>>
       /**
         * The **\`min-height\`** CSS property sets the minimum height of an element. It prevents the used value of the \`height\` property from becoming smaller than the value specified for \`min-height\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **3**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-height
         */
      minHeight?: ConditionalValue<WithEscapeHatch<UtilityValues["minHeight"]>>
       /**
         * The **\`min-inline-size\`** CSS property defines the horizontal or vertical minimal size of an element's block, depending on its writing mode. It corresponds to either the \`min-width\` or the \`min-height\` property, depending on the value of \`writing-mode\`.
         *
         * **Syntax**: \`<'min-width'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-inline-size
         */
      minInlineSize?: ConditionalValue<WithEscapeHatch<UtilityValues["minInlineSize"]>>
       /**
         * The **\`min-width\`** CSS property sets the minimum width of an element. It prevents the used value of the \`width\` property from becoming smaller than the value specified for \`min-width\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-width
         */
      minWidth?: ConditionalValue<WithEscapeHatch<UtilityValues["minWidth"]>>
       /**
         * The **\`mix-blend-mode\`** CSS property sets how an element's content should blend with the content of the element's parent and the element's background.
         *
         * **Syntax**: \`<blend-mode> | plus-lighter\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **41** | **32**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/mix-blend-mode
         */
      mixBlendMode?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["mixBlendMode"]>>
       /**
         * The **\`object-fit\`** CSS property sets how the content of a replaced element, such as an \`<img>\` or \`<video>\`, should be resized to fit its container.
         *
         * **Syntax**: \`fill | contain | cover | none | scale-down\`
         *
         * **Initial value**: \`fill\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **32** | **36**  | **10** | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/object-fit
         */
      objectFit?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["objectFit"]>>
       /**
         * The **\`object-position\`** CSS property specifies the alignment of the selected replaced element's contents within the element's box. Areas of the box which aren't covered by the replaced element's object will show the element's background.
         *
         * **Syntax**: \`<position>\`
         *
         * **Initial value**: \`50% 50%\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **32** | **36**  | **10** | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/object-position
         */
      objectPosition?: ConditionalValue<WithEscapeHatch<CssProperties["objectPosition"]>>
       /**
         * The **\`offset\`** CSS shorthand property sets all the properties required for animating an element along a defined path.
         *
         * **Syntax**: \`[ <'offset-position'>? [ <'offset-path'> [ <'offset-distance'> || <'offset-rotate'> ]? ]? ]! [ / <'offset-anchor'> ]?\`
         *
         * |    Chrome     | Firefox | Safari | Edge | IE  |
         * | :-----------: | :-----: | :----: | :--: | :-: |
         * |    **55**     | **72**  | **16** | n/a  | No  |
         * | 46 _(motion)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset
         */
      offset?: ConditionalValue<WithEscapeHatch<CssProperties["offset"]>>
       /**
         * **Syntax**: \`auto | <position>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** | **72**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-anchor
         */
      offsetAnchor?: ConditionalValue<WithEscapeHatch<CssProperties["offsetAnchor"]>>
       /**
         * The **\`offset-distance\`** CSS property specifies a position along an \`offset-path\` for an element to be placed.
         *
         * **Syntax**: \`<length-percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * |         Chrome         | Firefox | Safari | Edge | IE  |
         * | :--------------------: | :-----: | :----: | :--: | :-: |
         * |         **55**         | **72**  | **16** | n/a  | No  |
         * | 46 _(motion-distance)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-distance
         */
      offsetDistance?: ConditionalValue<WithEscapeHatch<CssProperties["offsetDistance"]>>
       /**
         * The **\`offset-path\`** CSS property specifies a motion path for an element to follow and defines the element's positioning within the parent container or SVG coordinate system.
         *
         * **Syntax**: \`none | <offset-path> || <coord-box>\`
         *
         * **Initial value**: \`none\`
         *
         * |       Chrome       | Firefox |  Safari  | Edge | IE  |
         * | :----------------: | :-----: | :------: | :--: | :-: |
         * |       **55**       | **72**  | **15.4** | n/a  | No  |
         * | 46 _(motion-path)_ |         |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-path
         */
      offsetPath?: ConditionalValue<WithEscapeHatch<CssProperties["offsetPath"]>>
       /**
         * **Syntax**: \`normal | auto | <position>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** |   n/a   | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-position
         */
      offsetPosition?: ConditionalValue<WithEscapeHatch<CssProperties["offsetPosition"]>>
       /**
         * The **\`offset-rotate\`** CSS property defines the orientation/direction of the element as it is positioned along the \`offset-path\`.
         *
         * **Syntax**: \`[ auto | reverse ] || <angle>\`
         *
         * **Initial value**: \`auto\`
         *
         * |         Chrome         | Firefox | Safari | Edge | IE  |
         * | :--------------------: | :-----: | :----: | :--: | :-: |
         * |         **56**         | **72**  | **16** | n/a  | No  |
         * | 46 _(motion-rotation)_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/offset-rotate
         */
      offsetRotate?: ConditionalValue<WithEscapeHatch<CssProperties["offsetRotate"]>>
       /**
         * The **\`opacity\`** CSS property sets the opacity of an element. Opacity is the degree to which content behind an element is hidden, and is the opposite of transparency.
         *
         * **Syntax**: \`<alpha-value>\`
         *
         * **Initial value**: \`1\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **2**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/opacity
         */
      opacity?: ConditionalValue<WithEscapeHatch<CssProperties["opacity"]>>
       /**
         * The **\`order\`** CSS property sets the order to lay out an item in a flex or grid container. Items in a container are sorted by ascending \`order\` value and then by their source code order.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`0\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |    IE    |
         * | :------: | :-----: | :-----: | :----: | :------: |
         * |  **29**  | **20**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ |         | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/order
         */
      order?: ConditionalValue<WithEscapeHatch<CssProperties["order"]>>
       /**
         * The **\`orphans\`** CSS property sets the minimum number of lines in a block container that must be shown at the _bottom_ of a page, region, or column.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`2\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **25** |   No    | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/orphans
         */
      orphans?: ConditionalValue<WithEscapeHatch<CssProperties["orphans"]>>
       /**
         * The **\`outline\`** CSS shorthand property sets most of the outline properties in a single declaration.
         *
         * **Syntax**: \`[ <'outline-color'> || <'outline-style'> || <'outline-width'> ]\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **94** | **88**  | **16.4** | **94** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline
         */
      outline?: ConditionalValue<WithEscapeHatch<UtilityValues["outline"]>>
       /**
         * The **\`outline-color\`** CSS property sets the color of an element's outline.
         *
         * **Syntax**: \`<color> | invert\`
         *
         * **Initial value**: \`invert\`, for browsers supporting it, \`currentColor\` for the other
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-color
         */
      outlineColor?: ConditionalValue<WithEscapeHatch<UtilityValues["outlineColor"]>>
       /**
         * The **\`outline-offset\`** CSS property sets the amount of space between an outline and the edge or border of an element.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari  |  Edge  | IE  |
         * | :----: | :-----: | :-----: | :----: | :-: |
         * | **1**  | **1.5** | **1.2** | **15** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-offset
         */
      outlineOffset?: ConditionalValue<WithEscapeHatch<UtilityValues["outlineOffset"]>>
       /**
         * The **\`outline-style\`** CSS property sets the style of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`auto | <'border-style'>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-style
         */
      outlineStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["outlineStyle"]>>
       /**
         * The CSS **\`outline-width\`** property sets the thickness of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-width
         */
      outlineWidth?: ConditionalValue<WithEscapeHatch<CssProperties["outlineWidth"]>>
       /**
         * The **\`overflow\`** CSS shorthand property sets the desired behavior for an element's overflow — i.e. when an element's content is too big to fit in its block formatting context — in both directions.
         *
         * **Syntax**: \`[ visible | hidden | clip | scroll | auto ]{1,2}\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow
         */
      overflow?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflow"]>>
       /**
         * **Syntax**: \`auto | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **56** | **66**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-anchor
         */
      overflowAnchor?: ConditionalValue<WithEscapeHatch<CssProperties["overflowAnchor"]>>
       /**
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **69**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-block
         */
      overflowBlock?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflowBlock"]>>
       /**
         * The **\`overflow-clip-box\`** CSS property specifies relative to which box the clipping happens when there is an overflow. It is short hand for the \`overflow-clip-box-inline\` and \`overflow-clip-box-block\` properties.
         *
         * **Syntax**: \`padding-box | content-box\`
         *
         * **Initial value**: \`padding-box\`
         */
      overflowClipBox?: ConditionalValue<WithEscapeHatch<CssProperties["overflowClipBox"]>>
       /**
         * **Syntax**: \`<visual-box> || <length [0,∞]>\`
         *
         * **Initial value**: \`0px\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **90** | **102** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-clip-margin
         */
      overflowClipMargin?: ConditionalValue<WithEscapeHatch<CssProperties["overflowClipMargin"]>>
       /**
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **69**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-inline
         */
      overflowInline?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflowInline"]>>
       /**
         * The **\`overflow-wrap\`** CSS property applies to inline elements, setting whether the browser should insert line breaks within an otherwise unbreakable string to prevent text from overflowing its line box.
         *
         * **Syntax**: \`normal | break-word | anywhere\`
         *
         * **Initial value**: \`normal\`
         *
         * |     Chrome      |      Firefox      |     Safari      |       Edge       |          IE           |
         * | :-------------: | :---------------: | :-------------: | :--------------: | :-------------------: |
         * |     **23**      |      **49**       |      **7**      |      **18**      | **5.5** _(word-wrap)_ |
         * | 1 _(word-wrap)_ | 3.5 _(word-wrap)_ | 1 _(word-wrap)_ | 12 _(word-wrap)_ |                       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-wrap
         */
      overflowWrap?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflowWrap"]>>
       /**
         * The **\`overflow-x\`** CSS property sets what shows when content overflows a block-level element's left and right edges. This may be nothing, a scroll bar, or the overflow content.
         *
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **3.5** | **3**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-x
         */
      overflowX?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflowX"]>>
       /**
         * The **\`overflow-y\`** CSS property sets what shows when content overflows a block-level element's top and bottom edges. This may be nothing, a scroll bar, or the overflow content.
         *
         * **Syntax**: \`visible | hidden | clip | scroll | auto\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **3.5** | **3**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overflow-y
         */
      overflowY?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["overflowY"]>>
       /**
         * The **\`overlay\`** CSS property specifies whether an element appearing in the top layer (for example, a shown popover or modal \`<dialog>\` element) is actually rendered in the top layer. This property is only relevant within a list of \`transition-property\` values, and only if \`allow-discrete\` is set as the \`transition-behavior\`.
         *
         * **Syntax**: \`none | auto\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **117** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overlay
         */
      overlay?: ConditionalValue<WithEscapeHatch<CssProperties["overlay"]>>
       /**
         * The **\`overscroll-behavior\`** CSS property sets what a browser does when reaching the boundary of a scrolling area. It's a shorthand for \`overscroll-behavior-x\` and \`overscroll-behavior-y\`.
         *
         * **Syntax**: \`[ contain | none | auto ]{1,2}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior
         */
      overscrollBehavior?: ConditionalValue<WithEscapeHatch<CssProperties["overscrollBehavior"]>>
       /**
         * The **\`overscroll-behavior-block\`** CSS property sets the browser's behavior when the block direction boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **77** | **73**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-block
         */
      overscrollBehaviorBlock?: ConditionalValue<WithEscapeHatch<CssProperties["overscrollBehaviorBlock"]>>
       /**
         * The **\`overscroll-behavior-inline\`** CSS property sets the browser's behavior when the inline direction boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **77** | **73**  | **16** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-inline
         */
      overscrollBehaviorInline?: ConditionalValue<WithEscapeHatch<CssProperties["overscrollBehaviorInline"]>>
       /**
         * The **\`overscroll-behavior-x\`** CSS property sets the browser's behavior when the horizontal boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-x
         */
      overscrollBehaviorX?: ConditionalValue<WithEscapeHatch<CssProperties["overscrollBehaviorX"]>>
       /**
         * The **\`overscroll-behavior-y\`** CSS property sets the browser's behavior when the vertical boundary of a scrolling area is reached.
         *
         * **Syntax**: \`contain | none | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **63** | **59**  | **16** | **18** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior-y
         */
      overscrollBehaviorY?: ConditionalValue<WithEscapeHatch<CssProperties["overscrollBehaviorY"]>>
       /**
         * The **\`padding\`** CSS shorthand property sets the padding area on all four sides of an element at once.
         *
         * **Syntax**: \`[ <length> | <percentage> ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding
         */
      padding?: ConditionalValue<WithEscapeHatch<UtilityValues["padding"]>>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      paddingBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBlock"]>>
       /**
         * The **\`padding-block-end\`** CSS property defines the logical block end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block-end
         */
      paddingBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBlockEnd"]>>
       /**
         * The **\`padding-block-start\`** CSS property defines the logical block start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block-start
         */
      paddingBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBlockStart"]>>
       /**
         * The **\`padding-bottom\`** CSS property sets the height of the padding area on the bottom of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-bottom
         */
      paddingBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBottom"]>>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      paddingInline?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInline"]>>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      paddingInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineEnd"]>>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      paddingInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineStart"]>>
       /**
         * The **\`padding-left\`** CSS property sets the width of the padding area to the left of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-left
         */
      paddingLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingLeft"]>>
       /**
         * The **\`padding-right\`** CSS property sets the width of the padding area on the right of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-right
         */
      paddingRight?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingRight"]>>
       /**
         * The **\`padding-top\`** CSS property sets the height of the padding area on the top of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-top
         */
      paddingTop?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingTop"]>>
       /**
         * The **\`page\`** CSS property is used to specify the named page, a specific type of page defined by the \`@page\` at-rule.
         *
         * **Syntax**: \`auto | <custom-ident>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari   | Edge | IE  |
         * | :----: | :-----: | :-------: | :--: | :-: |
         * | **85** | **110** | **≤13.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page
         */
      page?: ConditionalValue<WithEscapeHatch<CssProperties["page"]>>
       /**
         * The **\`page-break-after\`** CSS property adjusts page breaks _after_ the current element.
         *
         * **Syntax**: \`auto | always | avoid | left | right | recto | verso\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-after
         */
      pageBreakAfter?: ConditionalValue<WithEscapeHatch<CssProperties["pageBreakAfter"]>>
       /**
         * The **\`page-break-before\`** CSS property adjusts page breaks _before_ the current element.
         *
         * **Syntax**: \`auto | always | avoid | left | right | recto | verso\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **1**  | **1.2** | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-before
         */
      pageBreakBefore?: ConditionalValue<WithEscapeHatch<CssProperties["pageBreakBefore"]>>
       /**
         * The **\`page-break-inside\`** CSS property adjusts page breaks _inside_ the current element.
         *
         * **Syntax**: \`auto | avoid\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **19**  | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/page-break-inside
         */
      pageBreakInside?: ConditionalValue<WithEscapeHatch<CssProperties["pageBreakInside"]>>
       /**
         * The **\`paint-order\`** CSS property lets you control the order in which the fill and stroke (and painting markers) of text content and shapes are drawn.
         *
         * **Syntax**: \`normal | [ fill || stroke || markers ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **35** | **60**  | **8**  | **17** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/paint-order
         */
      paintOrder?: ConditionalValue<WithEscapeHatch<CssProperties["paintOrder"]>>
       /**
         * The **\`perspective\`** CSS property determines the distance between the z=0 plane and the user in order to give a 3D-positioned element some perspective.
         *
         * **Syntax**: \`none | <length>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **36**  | **16**  |  **9**  | **12** | **10** |
         * | 12 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/perspective
         */
      perspective?: ConditionalValue<WithEscapeHatch<CssProperties["perspective"]>>
       /**
         * The **\`perspective-origin\`** CSS property determines the position at which the viewer is looking. It is used as the _vanishing point_ by the \`perspective\` property.
         *
         * **Syntax**: \`<position>\`
         *
         * **Initial value**: \`50% 50%\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :------: | :-----: | :-----: | :----: | :----: |
         * |  **36**  | **16**  |  **9**  | **12** | **10** |
         * | 12 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/perspective-origin
         */
      perspectiveOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["perspectiveOrigin"]>>
       /**
         * The **\`place-content\`** CSS shorthand property allows you to align content along both the block and inline directions at once (i.e. the \`align-content\` and \`justify-content\` properties) in a relevant layout system such as Grid or Flexbox.
         *
         * **Syntax**: \`<'align-content'> <'justify-content'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **9**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-content
         */
      placeContent?: ConditionalValue<WithEscapeHatch<CssProperties["placeContent"]>>
       /**
         * The CSS **\`place-items\`** shorthand property allows you to align items along both the block and inline directions at once (i.e. the \`align-items\` and \`justify-items\` properties) in a relevant layout system such as Grid or Flexbox. If the second value is not set, the first value is also used for it.
         *
         * **Syntax**: \`<'align-items'> <'justify-items'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-items
         */
      placeItems?: ConditionalValue<WithEscapeHatch<CssProperties["placeItems"]>>
       /**
         * The **\`place-self\`** CSS shorthand property allows you to align an individual item in both the block and inline directions at once (i.e. the \`align-self\` and \`justify-self\` properties) in a relevant layout system such as Grid or Flexbox. If the second value is not present, the first value is also used for it.
         *
         * **Syntax**: \`<'align-self'> <'justify-self'>?\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **59** | **45**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/place-self
         */
      placeSelf?: ConditionalValue<WithEscapeHatch<CssProperties["placeSelf"]>>
       /**
         * The **\`pointer-events\`** CSS property sets under what circumstances (if any) a particular graphic element can become the target of pointer events.
         *
         * **Syntax**: \`auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE   |
         * | :----: | :-----: | :----: | :----: | :----: |
         * | **1**  | **1.5** | **4**  | **12** | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/pointer-events
         */
      pointerEvents?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["pointerEvents"]>>
       /**
         * The **\`position\`** CSS property sets how an element is positioned in a document. The \`top\`, \`right\`, \`bottom\`, and \`left\` properties determine the final location of positioned elements.
         *
         * **Syntax**: \`static | relative | absolute | sticky | fixed\`
         *
         * **Initial value**: \`static\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/position
         */
      position?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["position"]>>
       /**
         * The **\`print-color-adjust\`** CSS property sets what, if anything, the user agent may do to optimize the appearance of the element on the output device. By default, the browser is allowed to make any adjustments to the element's appearance it determines to be necessary and prudent given the type and capabilities of the output device.
         *
         * **Syntax**: \`economy | exact\`
         *
         * **Initial value**: \`economy\`
         *
         * |    Chrome    |       Firefox       |  Safari  |     Edge     | IE  |
         * | :----------: | :-----------------: | :------: | :----------: | :-: |
         * | **17** _-x-_ |       **97**        | **15.4** | **79** _-x-_ | No  |
         * |              | 48 _(color-adjust)_ | 6 _-x-_  |              |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/print-color-adjust
         */
      printColorAdjust?: ConditionalValue<WithEscapeHatch<CssProperties["printColorAdjust"]>>
       /**
         * The **\`quotes\`** CSS property sets how the browser should render quotation marks that are added using the \`open-quotes\` or \`close-quotes\` values of the CSS \`content\` property.
         *
         * **Syntax**: \`none | auto | [ <string> <string> ]+\`
         *
         * **Initial value**: depends on user agent
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **11** | **1.5** | **9**  | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/quotes
         */
      quotes?: ConditionalValue<WithEscapeHatch<CssProperties["quotes"]>>
       /**
         * The **\`resize\`** CSS property sets whether an element is resizable, and if so, in which directions.
         *
         * **Syntax**: \`none | both | horizontal | vertical | block | inline\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **1**  |  **4**  | **3**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/resize
         */
      resize?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["resize"]>>
       /**
         * The **\`right\`** CSS property participates in specifying the horizontal position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/right
         */
      right?: ConditionalValue<WithEscapeHatch<UtilityValues["right"]>>
       /**
         * The **\`rotate\`** CSS property allows you to specify rotation transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` property.
         *
         * **Syntax**: \`none | <angle> | [ x | y | z | <number>{3} ] && <angle>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/rotate
         */
      rotate?: ConditionalValue<WithEscapeHatch<CssProperties["rotate"]>>
       /**
         * The **\`row-gap\`** CSS property sets the size of the gap (gutter) between an element's rows.
         *
         * **Syntax**: \`normal | <length-percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  | IE  |
         * | :----: | :-----: | :------: | :----: | :-: |
         * | **47** | **52**  | **10.1** | **16** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/row-gap
         */
      rowGap?: ConditionalValue<WithEscapeHatch<UtilityValues["rowGap"]>>
       /**
         * The **\`ruby-align\`** CSS property defines the distribution of the different ruby elements over the base.
         *
         * **Syntax**: \`start | center | space-between | space-around\`
         *
         * **Initial value**: \`space-around\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * |   No   | **38**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/ruby-align
         */
      rubyAlign?: ConditionalValue<WithEscapeHatch<CssProperties["rubyAlign"]>>
       /**
         * **Syntax**: \`separate | collapse | auto\`
         *
         * **Initial value**: \`separate\`
         */
      rubyMerge?: ConditionalValue<WithEscapeHatch<CssProperties["rubyMerge"]>>
       /**
         * The **\`ruby-position\`** CSS property defines the position of a ruby element relatives to its base element. It can be positioned over the element (\`over\`), under it (\`under\`), or between the characters on their right side (\`inter-character\`).
         *
         * **Syntax**: \`[ alternate || [ over | under ] ] | inter-character\`
         *
         * **Initial value**: \`alternate\`
         *
         * | Chrome  | Firefox |   Safari    | Edge  | IE  |
         * | :-----: | :-----: | :---------: | :---: | :-: |
         * | **84**  | **38**  | **7** _-x-_ | 12-79 | No  |
         * | 1 _-x-_ |         |             |       |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/ruby-position
         */
      rubyPosition?: ConditionalValue<WithEscapeHatch<CssProperties["rubyPosition"]>>
       /**
         * The **\`scale\`** CSS property allows you to specify scale transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` value.
         *
         * **Syntax**: \`none | <number>{1,3}\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scale
         */
      scale?: ConditionalValue<WithEscapeHatch<UtilityValues["scale"]>>
       /**
         * The **\`scrollbar-color\`** CSS property sets the color of the scrollbar track and thumb.
         *
         * **Syntax**: \`auto | <color>{2}\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **121** | **64**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-color
         */
      scrollbarColor?: ConditionalValue<WithEscapeHatch<CssProperties["scrollbarColor"]>>
       /**
         * The **\`scrollbar-gutter\`** CSS property allows authors to reserve space for the scrollbar, preventing unwanted layout changes as the content grows while also avoiding unnecessary visuals when scrolling isn't needed.
         *
         * **Syntax**: \`auto | stable && both-edges?\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **94** | **97**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-gutter
         */
      scrollbarGutter?: ConditionalValue<WithEscapeHatch<CssProperties["scrollbarGutter"]>>
       /**
         * The **\`scrollbar-width\`** property allows the author to set the maximum thickness of an element's scrollbars when they are shown.
         *
         * **Syntax**: \`auto | thin | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **121** | **64**  |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scrollbar-width
         */
      scrollbarWidth?: ConditionalValue<WithEscapeHatch<CssProperties["scrollbarWidth"]>>
       /**
         * The **\`scroll-behavior\`** CSS property sets the behavior for a scrolling box when scrolling is triggered by the navigation or CSSOM scrolling APIs.
         *
         * **Syntax**: \`auto | smooth\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **61** | **36**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-behavior
         */
      scrollBehavior?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["scrollBehavior"]>>
       /**
         * The **\`scroll-margin\`** shorthand property sets all of the scroll margins of an element at once, assigning values much like the \`margin\` property does for margins of an element.
         *
         * **Syntax**: \`<length>{1,4}\`
         *
         * | Chrome | Firefox |          Safari           | Edge | IE  |
         * | :----: | :-----: | :-----------------------: | :--: | :-: |
         * | **69** | **90**  |         **14.1**          | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin
         */
      scrollMargin?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMargin"]>>
       /**
         * The \`scroll-margin-block\` shorthand property sets the scroll margins of an element in the block dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block
         */
      scrollMarginBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginBlock"]>>
       /**
         * The \`scroll-margin-block-start\` property defines the margin of the scroll snap area at the start of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-start
         */
      scrollMarginBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginBlockStart"]>>
       /**
         * The \`scroll-margin-block-end\` property defines the margin of the scroll snap area at the end of the block dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block-end
         */
      scrollMarginBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginBlockEnd"]>>
       /**
         * The \`scroll-margin-bottom\` property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |              Safari              | Edge | IE  |
         * | :----: | :-----: | :------------------------------: | :--: | :-: |
         * | **69** | **68**  |             **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-bottom)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom
         */
      scrollMarginBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginBottom"]>>
       /**
         * The \`scroll-margin-inline\` shorthand property sets the scroll margins of an element in the inline dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline
         */
      scrollMarginInline?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginInline"]>>
       /**
         * The \`scroll-margin-inline-start\` property defines the margin of the scroll snap area at the start of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-start
         */
      scrollMarginInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginInlineStart"]>>
       /**
         * The \`scroll-margin-inline-end\` property defines the margin of the scroll snap area at the end of the inline dimension that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline-end
         */
      scrollMarginInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginInlineEnd"]>>
       /**
         * The \`scroll-margin-left\` property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari             | Edge | IE  |
         * | :----: | :-----: | :----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-left)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left
         */
      scrollMarginLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginLeft"]>>
       /**
         * The \`scroll-margin-right\` property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari              | Edge | IE  |
         * | :----: | :-----: | :-----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-right)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right
         */
      scrollMarginRight?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginRight"]>>
       /**
         * The \`scroll-margin-top\` property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |            Safari             | Edge | IE  |
         * | :----: | :-----: | :---------------------------: | :--: | :-: |
         * | **69** | **68**  |           **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-top)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top
         */
      scrollMarginTop?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginTop"]>>
       /**
         * The **\`scroll-padding\`** shorthand property sets scroll padding on all sides of an element at once, much like the \`padding\` property does for padding on an element.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,4}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding
         */
      scrollPadding?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPadding"]>>
       /**
         * The \`scroll-padding-block\` shorthand property sets the scroll padding of an element in the block dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block
         */
      scrollPaddingBlock?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingBlock"]>>
       /**
         * The \`scroll-padding-block-start\` property defines offsets for the start edge in the block dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-start
         */
      scrollPaddingBlockStart?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingBlockStart"]>>
       /**
         * The \`scroll-padding-block-end\` property defines offsets for the end edge in the block dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block-end
         */
      scrollPaddingBlockEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingBlockEnd"]>>
       /**
         * The \`scroll-padding-bottom\` property defines offsets for the bottom of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-bottom
         */
      scrollPaddingBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingBottom"]>>
       /**
         * The \`scroll-padding-inline\` shorthand property sets the scroll padding of an element in the inline dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline
         */
      scrollPaddingInline?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingInline"]>>
       /**
         * The \`scroll-padding-inline-start\` property defines offsets for the start edge in the inline dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-start
         */
      scrollPaddingInlineStart?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingInlineStart"]>>
       /**
         * The \`scroll-padding-inline-end\` property defines offsets for the end edge in the inline dimension of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline-end
         */
      scrollPaddingInlineEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingInlineEnd"]>>
       /**
         * The \`scroll-padding-left\` property defines offsets for the left of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-left
         */
      scrollPaddingLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingLeft"]>>
       /**
         * The \`scroll-padding-right\` property defines offsets for the right of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-right
         */
      scrollPaddingRight?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingRight"]>>
       /**
         * The **\`scroll-padding-top\`** property defines offsets for the top of the _optimal viewing region_ of the scrollport: the region used as the target region for placing things in view of the user. This allows the author to exclude regions of the scrollport that are obscured by other content (such as fixed-positioned toolbars or sidebars) or to put more breathing room between a targeted element and the edges of the scrollport.
         *
         * **Syntax**: \`auto | <length-percentage>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **68**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-top
         */
      scrollPaddingTop?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingTop"]>>
       /**
         * The \`scroll-snap-align\` property specifies the box's snap position as an alignment of its snap area (as the alignment subject) within its snap container's snapport (as the alignment container). The two values specify the snapping alignment in the block axis and inline axis, respectively. If only one value is specified, the second value defaults to the same value.
         *
         * **Syntax**: \`[ none | start | end | center ]{1,2}\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-align
         */
      scrollSnapAlign?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapAlign"]>>
       scrollSnapCoordinate?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapCoordinate"]>>
       scrollSnapDestination?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapDestination"]>>
       scrollSnapPointsX?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapPointsX"]>>
       scrollSnapPointsY?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapPointsY"]>>
       /**
         * The **\`scroll-snap-stop\`** CSS property defines whether or not the scroll container is allowed to "pass over" possible snap positions.
         *
         * **Syntax**: \`normal | always\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **75** | **103** | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-stop
         */
      scrollSnapStop?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapStop"]>>
       /**
         * The **\`scroll-snap-type\`** CSS property sets how strictly snap points are enforced on the scroll container in case there is one.
         *
         * **Syntax**: \`none | [ x | y | block | inline | both ] [ mandatory | proximity ]?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |      IE      |
         * | :----: | :-----: | :-----: | :----: | :----------: |
         * | **69** |  39-68  | **11**  | **79** | **10** _-x-_ |
         * |        |         | 9 _-x-_ |        |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-snap-type
         */
      scrollSnapType?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapType"]>>
       scrollSnapTypeX?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapTypeX"]>>
       scrollSnapTypeY?: ConditionalValue<WithEscapeHatch<CssProperties["scrollSnapTypeY"]>>
       /**
         * The **\`scroll-timeline\`** CSS shorthand property defines a name that can be used to identify the source element of a scroll timeline, along with the scrollbar axis that should provide the timeline.
         *
         * **Syntax**: \`[ <'scroll-timeline-name'> <'scroll-timeline-axis'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline
         */
      scrollTimeline?: ConditionalValue<WithEscapeHatch<CssProperties["scrollTimeline"]>>
       /**
         * The **\`scroll-timeline-axis\`** CSS property can be used to specify the scrollbar that will be used to provide the timeline for a scroll-timeline animation.
         *
         * **Syntax**: \`[ block | inline | x | y ]#\`
         *
         * **Initial value**: \`block\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-axis
         */
      scrollTimelineAxis?: ConditionalValue<WithEscapeHatch<CssProperties["scrollTimelineAxis"]>>
       /**
         * The **\`scroll-timeline-name\`** CSS property defines a name that can be used to identify an element as the source of a scroll timeline for an animation.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-timeline-name
         */
      scrollTimelineName?: ConditionalValue<WithEscapeHatch<CssProperties["scrollTimelineName"]>>
       /**
         * The **\`shape-image-threshold\`** CSS property sets the alpha channel threshold used to extract the shape using an image as the value for \`shape-outside\`.
         *
         * **Syntax**: \`<alpha-value>\`
         *
         * **Initial value**: \`0.0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-image-threshold
         */
      shapeImageThreshold?: ConditionalValue<WithEscapeHatch<CssProperties["shapeImageThreshold"]>>
       /**
         * The **\`shape-margin\`** CSS property sets a margin for a CSS shape created using \`shape-outside\`.
         *
         * **Syntax**: \`<length-percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-margin
         */
      shapeMargin?: ConditionalValue<WithEscapeHatch<CssProperties["shapeMargin"]>>
       /**
         * The **\`shape-outside\`** CSS property defines a shape—which may be non-rectangular—around which adjacent inline content should wrap. By default, inline content wraps around its margin box; \`shape-outside\` provides a way to customize this wrapping, making it possible to wrap text around complex objects rather than simple boxes.
         *
         * **Syntax**: \`none | [ <shape-box> || <basic-shape> ] | <image>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **37** | **62**  | **10.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/shape-outside
         */
      shapeOutside?: ConditionalValue<WithEscapeHatch<CssProperties["shapeOutside"]>>
       /**
         * The **\`tab-size\`** CSS property is used to customize the width of tab characters (U+0009).
         *
         * **Syntax**: \`<integer> | <length>\`
         *
         * **Initial value**: \`8\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **21** | **91**  | **7**  | n/a  | No  |
         * |        | 4 _-x-_ |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/tab-size
         */
      tabSize?: ConditionalValue<WithEscapeHatch<CssProperties["tabSize"]>>
       /**
         * The **\`table-layout\`** CSS property sets the algorithm used to lay out \`<table>\` cells, rows, and columns.
         *
         * **Syntax**: \`auto | fixed\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **14** |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/table-layout
         */
      tableLayout?: ConditionalValue<WithEscapeHatch<CssProperties["tableLayout"]>>
       /**
         * The **\`text-align\`** CSS property sets the horizontal alignment of the inline-level content inside a block element or table-cell box. This means it works like \`vertical-align\` but in the horizontal direction.
         *
         * **Syntax**: \`start | end | left | right | center | justify | match-parent\`
         *
         * **Initial value**: \`start\`, or a nameless value that acts as \`left\` if _direction_ is \`ltr\`, \`right\` if _direction_ is \`rtl\` if \`start\` is not supported by the browser.
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-align
         */
      textAlign?: ConditionalValue<WithEscapeHatch<CssProperties["textAlign"]>>
       /**
         * The **\`text-align-last\`** CSS property sets how the last line of a block or a line, right before a forced line break, is aligned.
         *
         * **Syntax**: \`auto | start | end | left | right | center | justify\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **47** | **49**  | **16** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-align-last
         */
      textAlignLast?: ConditionalValue<WithEscapeHatch<CssProperties["textAlignLast"]>>
       /**
         * The **\`text-combine-upright\`** CSS property sets the combination of characters into the space of a single character. If the combined text is wider than 1em, the user agent must fit the contents within 1em. The resulting composition is treated as a single upright glyph for layout and decoration. This property only has an effect in vertical writing modes.
         *
         * **Syntax**: \`none | all | [ digits <integer>? ]\`
         *
         * **Initial value**: \`none\`
         *
         * |           Chrome           | Firefox |            Safari            |  Edge  |                   IE                   |
         * | :------------------------: | :-----: | :--------------------------: | :----: | :------------------------------------: |
         * |           **48**           | **48**  |           **15.4**           | **79** | **11** _(-ms-text-combine-horizontal)_ |
         * | 9 _(-webkit-text-combine)_ |         | 5.1 _(-webkit-text-combine)_ |        |                                        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-combine-upright
         */
      textCombineUpright?: ConditionalValue<WithEscapeHatch<CssProperties["textCombineUpright"]>>
       /**
         * The **\`text-decoration\`** shorthand CSS property sets the appearance of decorative lines on text. It is a shorthand for \`text-decoration-line\`, \`text-decoration-color\`, \`text-decoration-style\`, and the newer \`text-decoration-thickness\` property.
         *
         * **Syntax**: \`<'text-decoration-line'> || <'text-decoration-style'> || <'text-decoration-color'> || <'text-decoration-thickness'>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration
         */
      textDecoration?: ConditionalValue<WithEscapeHatch<CssProperties["textDecoration"]>>
       /**
         * The **\`text-decoration-color\`** CSS property sets the color of decorations added to text by \`text-decoration-line\`.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-color
         */
      textDecorationColor?: ConditionalValue<WithEscapeHatch<UtilityValues["textDecorationColor"]>>
       /**
         * The **\`text-decoration-line\`** CSS property sets the kind of decoration that is used on text in an element, such as an underline or overline.
         *
         * **Syntax**: \`none | [ underline || overline || line-through || blink ] | spelling-error | grammar-error\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-line
         */
      textDecorationLine?: ConditionalValue<WithEscapeHatch<CssProperties["textDecorationLine"]>>
       /**
         * The **\`text-decoration-skip\`** CSS property sets what parts of an element's content any text decoration affecting the element must skip over. It controls all text decoration lines drawn by the element and also any text decoration lines drawn by its ancestors.
         *
         * **Syntax**: \`none | [ objects || [ spaces | [ leading-spaces || trailing-spaces ] ] || edges || box-decoration ]\`
         *
         * **Initial value**: \`objects\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | 57-64  |   No    | **12.1** | n/a  | No  |
         * |        |         | 7 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip
         */
      textDecorationSkip?: ConditionalValue<WithEscapeHatch<CssProperties["textDecorationSkip"]>>
       /**
         * The **\`text-decoration-skip-ink\`** CSS property specifies how overlines and underlines are drawn when they pass over glyph ascenders and descenders.
         *
         * **Syntax**: \`auto | all | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **64** | **70**  | **15.4** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-skip-ink
         */
      textDecorationSkipInk?: ConditionalValue<WithEscapeHatch<CssProperties["textDecorationSkipInk"]>>
       /**
         * The **\`text-decoration-style\`** CSS property sets the style of the lines specified by \`text-decoration-line\`. The style applies to all lines that are set with \`text-decoration-line\`.
         *
         * **Syntax**: \`solid | double | dotted | dashed | wavy\`
         *
         * **Initial value**: \`solid\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **57** | **36**  | **12.1** | n/a  | No  |
         * |        |         | 8 _-x-_  |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-style
         */
      textDecorationStyle?: ConditionalValue<WithEscapeHatch<CssProperties["textDecorationStyle"]>>
       /**
         * The **\`text-decoration-thickness\`** CSS property sets the stroke thickness of the decoration line that is used on text in an element, such as a line-through, underline, or overline.
         *
         * **Syntax**: \`auto | from-font | <length> | <percentage> \`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **89** | **70**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-decoration-thickness
         */
      textDecorationThickness?: ConditionalValue<WithEscapeHatch<CssProperties["textDecorationThickness"]>>
       /**
         * The **\`text-emphasis\`** CSS property applies emphasis marks to text (except spaces and control characters). It is a shorthand for \`text-emphasis-style\` and \`text-emphasis-color\`.
         *
         * **Syntax**: \`<'text-emphasis-style'> || <'text-emphasis-color'>\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis
         */
      textEmphasis?: ConditionalValue<WithEscapeHatch<CssProperties["textEmphasis"]>>
       /**
         * The **\`text-emphasis-color\`** CSS property sets the color of emphasis marks. This value can also be set using the \`text-emphasis\` shorthand.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-color
         */
      textEmphasisColor?: ConditionalValue<WithEscapeHatch<UtilityValues["textEmphasisColor"]>>
       /**
         * The **\`text-emphasis-position\`** CSS property sets where emphasis marks are drawn. Like ruby text, if there isn't enough room for emphasis marks, the line height is increased.
         *
         * **Syntax**: \`[ over | under ] && [ right | left ]\`
         *
         * **Initial value**: \`over right\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-position
         */
      textEmphasisPosition?: ConditionalValue<WithEscapeHatch<CssProperties["textEmphasisPosition"]>>
       /**
         * The **\`text-emphasis-style\`** CSS property sets the appearance of emphasis marks. It can also be set, and reset, using the \`text-emphasis\` shorthand.
         *
         * **Syntax**: \`none | [ [ filled | open ] || [ dot | circle | double-circle | triangle | sesame ] ] | <string>\`
         *
         * **Initial value**: \`none\`
         *
         * |  Chrome  | Firefox | Safari | Edge | IE  |
         * | :------: | :-----: | :----: | :--: | :-: |
         * |  **99**  | **46**  | **7**  | n/a  | No  |
         * | 25 _-x-_ |         |        |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-emphasis-style
         */
      textEmphasisStyle?: ConditionalValue<WithEscapeHatch<CssProperties["textEmphasisStyle"]>>
       /**
         * The **\`text-indent\`** CSS property sets the length of empty space (indentation) that is put before lines of text in a block.
         *
         * **Syntax**: \`<length-percentage> && hanging? && each-line?\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-indent
         */
      textIndent?: ConditionalValue<WithEscapeHatch<UtilityValues["textIndent"]>>
       /**
         * The **\`text-justify\`** CSS property sets what type of justification should be applied to text when \`text-align\`\`: justify;\` is set on an element.
         *
         * **Syntax**: \`auto | inter-character | inter-word | none\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge  |   IE   |
         * | :----: | :-----: | :----: | :---: | :----: |
         * |  n/a   | **55**  |   No   | 12-79 | **11** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-justify
         */
      textJustify?: ConditionalValue<WithEscapeHatch<CssProperties["textJustify"]>>
       /**
         * The **\`text-orientation\`** CSS property sets the orientation of the text characters in a line. It only affects text in vertical mode (when \`writing-mode\` is not \`horizontal-tb\`). It is useful for controlling the display of languages that use vertical script, and also for making vertical table headers.
         *
         * **Syntax**: \`mixed | upright | sideways\`
         *
         * **Initial value**: \`mixed\`
         *
         * |  Chrome  | Firefox |  Safari   | Edge | IE  |
         * | :------: | :-----: | :-------: | :--: | :-: |
         * |  **48**  | **41**  |  **14**   | n/a  | No  |
         * | 11 _-x-_ |         | 5.1 _-x-_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-orientation
         */
      textOrientation?: ConditionalValue<WithEscapeHatch<CssProperties["textOrientation"]>>
       /**
         * The **\`text-overflow\`** CSS property sets how hidden overflow content is signaled to users. It can be clipped, display an ellipsis ('\`…\`'), or display a custom string.
         *
         * **Syntax**: \`[ clip | ellipsis | <string> ]{1,2}\`
         *
         * **Initial value**: \`clip\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **7**  | **1.3** | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-overflow
         */
      textOverflow?: ConditionalValue<WithEscapeHatch<CssProperties["textOverflow"]>>
       /**
         * The **\`text-rendering\`** CSS property provides information to the rendering engine about what to optimize for when rendering text.
         *
         * **Syntax**: \`auto | optimizeSpeed | optimizeLegibility | geometricPrecision\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **4**  |  **1**  | **5**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-rendering
         */
      textRendering?: ConditionalValue<WithEscapeHatch<CssProperties["textRendering"]>>
       /**
         * The **\`text-shadow\`** CSS property adds shadows to text. It accepts a comma-separated list of shadows to be applied to the text and any of its \`decorations\`. Each shadow is described by some combination of X and Y offsets from the element, blur radius, and color.
         *
         * **Syntax**: \`none | <shadow-t>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE   |
         * | :----: | :-----: | :-----: | :----: | :----: |
         * | **2**  | **3.5** | **1.1** | **12** | **10** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-shadow
         */
      textShadow?: ConditionalValue<WithEscapeHatch<UtilityValues["textShadow"]>>
       /**
         * The **\`text-size-adjust\`** CSS property controls the text inflation algorithm used on some smartphones and tablets. Other browsers will ignore this property.
         *
         * **Syntax**: \`none | auto | <percentage>\`
         *
         * **Initial value**: \`auto\` for smartphone browsers supporting inflation, \`none\` in other cases (and then not modifiable).
         *
         * | Chrome | Firefox | Safari |  Edge  | IE  |
         * | :----: | :-----: | :----: | :----: | :-: |
         * | **54** |   No    |   No   | **79** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-size-adjust
         */
      textSizeAdjust?: ConditionalValue<WithEscapeHatch<CssProperties["textSizeAdjust"]>>
       /**
         * The **\`text-transform\`** CSS property specifies how to capitalize an element's text. It can be used to make text appear in all-uppercase or all-lowercase, or with each word capitalized. It also can help improve legibility for ruby.
         *
         * **Syntax**: \`none | capitalize | uppercase | lowercase | full-width | full-size-kana\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-transform
         */
      textTransform?: ConditionalValue<WithEscapeHatch<CssProperties["textTransform"]>>
       /**
         * The **\`text-underline-offset\`** CSS property sets the offset distance of an underline text decoration line (applied using \`text-decoration\`) from its original position.
         *
         * **Syntax**: \`auto | <length> | <percentage> \`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **70**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-underline-offset
         */
      textUnderlineOffset?: ConditionalValue<WithEscapeHatch<CssProperties["textUnderlineOffset"]>>
       /**
         * The **\`text-underline-position\`** CSS property specifies the position of the underline which is set using the \`text-decoration\` property's \`underline\` value.
         *
         * **Syntax**: \`auto | from-font | [ under || [ left | right ] ]\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **33** | **74**  | **12.1** | **12** | **6** |
         * |        |         | 9 _-x-_  |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-underline-position
         */
      textUnderlinePosition?: ConditionalValue<WithEscapeHatch<CssProperties["textUnderlinePosition"]>>
       /**
         * The **\`text-wrap\`** CSS property controls how text inside an element is wrapped. The different values provide:
         *
         * **Syntax**: \`wrap | nowrap | balance | stable | pretty\`
         *
         * **Initial value**: \`wrap\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **114** | **121** |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/text-wrap
         */
      textWrap?: ConditionalValue<WithEscapeHatch<UtilityValues["textWrap"]>>
       /**
         * The **\`timeline-scope\`** CSS property modifies the scope of a named animation timeline.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **116** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/timeline-scope
         */
      timelineScope?: ConditionalValue<WithEscapeHatch<CssProperties["timelineScope"]>>
       /**
         * The **\`top\`** CSS property participates in specifying the vertical position of a positioned element. It has no effect on non-positioned elements.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/top
         */
      top?: ConditionalValue<WithEscapeHatch<UtilityValues["top"]>>
       /**
         * The **\`touch-action\`** CSS property sets how an element's region can be manipulated by a touchscreen user (for example, by zooming features built into the browser).
         *
         * **Syntax**: \`auto | none | [ [ pan-x | pan-left | pan-right ] || [ pan-y | pan-up | pan-down ] || pinch-zoom ] | manipulation\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |    IE    |
         * | :----: | :-----: | :----: | :----: | :------: |
         * | **36** | **52**  | **13** | **12** |  **11**  |
         * |        |         |        |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/touch-action
         */
      touchAction?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["touchAction"]>>
       /**
         * The **\`transform\`** CSS property lets you rotate, scale, skew, or translate an element. It modifies the coordinate space of the CSS visual formatting model.
         *
         * **Syntax**: \`none | <transform-list>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE    |
         * | :-----: | :-----: | :-------: | :----: | :-----: |
         * | **36**  | **16**  |   **9**   | **12** | **10**  |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        | 9 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform
         */
      transform?: ConditionalValue<WithEscapeHatch<CssProperties["transform"]>>
       /**
         * The **\`transform-box\`** CSS property defines the layout box to which the \`transform\`, individual transform properties \`translate\`,\`scale\`, and \`rotate\`, and \`transform-origin\` properties relate.
         *
         * **Syntax**: \`content-box | border-box | fill-box | stroke-box | view-box\`
         *
         * **Initial value**: \`view-box\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **64** | **55**  | **11** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-box
         */
      transformBox?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["transformBox"]>>
       /**
         * The **\`transform-origin\`** CSS property sets the origin for an element's transformations.
         *
         * **Syntax**: \`[ <length-percentage> | left | center | right | top | bottom ] | [ [ <length-percentage> | left | center | right ] && [ <length-percentage> | top | center | bottom ] ] <length>?\`
         *
         * **Initial value**: \`50% 50% 0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE    |
         * | :-----: | :-----: | :-----: | :----: | :-----: |
         * | **36**  | **16**  |  **9**  | **12** | **10**  |
         * | 1 _-x-_ |         | 2 _-x-_ |        | 9 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-origin
         */
      transformOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["transformOrigin"]>>
       /**
         * The **\`transform-style\`** CSS property sets whether children of an element are positioned in the 3D space or are flattened in the plane of the element.
         *
         * **Syntax**: \`flat | preserve-3d\`
         *
         * **Initial value**: \`flat\`
         *
         * |  Chrome  | Firefox | Safari  |  Edge  | IE  |
         * | :------: | :-----: | :-----: | :----: | :-: |
         * |  **36**  | **16**  |  **9**  | **12** | No  |
         * | 12 _-x-_ |         | 4 _-x-_ |        |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transform-style
         */
      transformStyle?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["transformStyle"]>>
       /**
         * The **\`transition\`** CSS property is a shorthand property for \`transition-property\`, \`transition-duration\`, \`transition-timing-function\`, and \`transition-delay\`.
         *
         * **Syntax**: \`<single-transition>#\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition
         */
      transition?: ConditionalValue<WithEscapeHatch<UtilityValues["transition"]>>
       /**
         * The **\`transition-behavior\`** CSS property specifies whether transitions will be started for properties whose animation behavior is discrete.
         *
         * **Syntax**: \`<transition-behavior-value>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **117** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-behavior
         */
      transitionBehavior?: ConditionalValue<WithEscapeHatch<CssProperties["transitionBehavior"]>>
       /**
         * The **\`transition-delay\`** CSS property specifies the duration to wait before starting a property's transition effect when its value changes.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |   IE   |
         * | :-----: | :-----: | :-----: | :----: | :----: |
         * | **26**  | **16**  |  **9**  | **12** | **10** |
         * | 1 _-x-_ |         | 4 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-delay
         */
      transitionDelay?: ConditionalValue<WithEscapeHatch<UtilityValues["transitionDelay"]>>
       /**
         * The **\`transition-duration\`** CSS property sets the length of time a transition animation should take to complete. By default, the value is \`0s\`, meaning that no animation will occur.
         *
         * **Syntax**: \`<time>#\`
         *
         * **Initial value**: \`0s\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-duration
         */
      transitionDuration?: ConditionalValue<WithEscapeHatch<UtilityValues["transitionDuration"]>>
       /**
         * The **\`transition-property\`** CSS property sets the CSS properties to which a transition effect should be applied.
         *
         * **Syntax**: \`none | <single-transition-property>#\`
         *
         * **Initial value**: all
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-property
         */
      transitionProperty?: ConditionalValue<WithEscapeHatch<CssProperties["transitionProperty"]>>
       /**
         * The **\`transition-timing-function\`** CSS property sets how intermediate values are calculated for CSS properties being affected by a transition effect.
         *
         * **Syntax**: \`<easing-function>#\`
         *
         * **Initial value**: \`ease\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |   IE   |
         * | :-----: | :-----: | :-------: | :----: | :----: |
         * | **26**  | **16**  |   **9**   | **12** | **10** |
         * | 1 _-x-_ |         | 3.1 _-x-_ |        |        |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/transition-timing-function
         */
      transitionTimingFunction?: ConditionalValue<WithEscapeHatch<UtilityValues["transitionTimingFunction"]>>
       /**
         * The **\`translate\`** CSS property allows you to specify translation transforms individually and independently of the \`transform\` property. This maps better to typical user interface usage, and saves having to remember the exact order of transform functions to specify in the \`transform\` value.
         *
         * **Syntax**: \`none | <length-percentage> [ <length-percentage> <length>? ]?\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox |  Safari  | Edge | IE  |
         * | :-----: | :-----: | :------: | :--: | :-: |
         * | **104** | **72**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/translate
         */
      translate?: ConditionalValue<WithEscapeHatch<UtilityValues["translate"]>>
       /**
         * The **\`unicode-bidi\`** CSS property, together with the \`direction\` property, determines how bidirectional text in a document is handled. For example, if a block of content contains both left-to-right and right-to-left text, the user-agent uses a complex Unicode algorithm to decide how to display the text. The \`unicode-bidi\` property overrides this algorithm and allows the developer to control the text embedding.
         *
         * **Syntax**: \`normal | embed | isolate | bidi-override | isolate-override | plaintext\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE    |
         * | :----: | :-----: | :-----: | :----: | :-----: |
         * | **2**  |  **1**  | **1.3** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/unicode-bidi
         */
      unicodeBidi?: ConditionalValue<WithEscapeHatch<CssProperties["unicodeBidi"]>>
       /**
         * The **\`user-select\`** CSS property controls whether the user can select text. This doesn't have any effect on content loaded as part of a browser's user interface (its chrome), except in textboxes.
         *
         * **Syntax**: \`auto | text | none | contain | all\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox |   Safari    |   Edge   |      IE      |
         * | :-----: | :-----: | :---------: | :------: | :----------: |
         * | **54**  | **69**  | **3** _-x-_ |  **79**  | **10** _-x-_ |
         * | 1 _-x-_ | 1 _-x-_ |             | 12 _-x-_ |              |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/user-select
         */
      userSelect?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["userSelect"]>>
       /**
         * The **\`vertical-align\`** CSS property sets vertical alignment of an inline, inline-block or table-cell box.
         *
         * **Syntax**: \`baseline | sub | super | text-top | text-bottom | middle | top | bottom | <percentage> | <length>\`
         *
         * **Initial value**: \`baseline\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/vertical-align
         */
      verticalAlign?: ConditionalValue<WithEscapeHatch<CssProperties["verticalAlign"]>>
       /**
         * The **\`view-timeline\`** CSS shorthand property is used to define a _named view progress timeline_, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline\` is set on the subject.
         *
         * **Syntax**: \`[ <'view-timeline-name'> <'view-timeline-axis'>? ]#\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline
         */
      viewTimeline?: ConditionalValue<WithEscapeHatch<CssProperties["viewTimeline"]>>
       /**
         * The **\`view-timeline-axis\`** CSS property is used to specify the scrollbar direction that will be used to provide the timeline for a _named view progress timeline_ animation, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline-axis\` is set on the subject. See CSS scroll-driven animations for more details.
         *
         * **Syntax**: \`[ block | inline | x | y ]#\`
         *
         * **Initial value**: \`block\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-axis
         */
      viewTimelineAxis?: ConditionalValue<WithEscapeHatch<CssProperties["viewTimelineAxis"]>>
       /**
         * The **\`view-timeline-inset\`** CSS property is used to specify one or two values representing an adjustment to the position of the scrollport (see Scroll container for more details) in which the subject element of a _named view progress timeline_ animation is deemed to be visible. Put another way, this allows you to specify start and/or end inset (or outset) values that offset the position of the timeline.
         *
         * **Syntax**: \`[ [ auto | <length-percentage> ]{1,2} ]#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-inset
         */
      viewTimelineInset?: ConditionalValue<WithEscapeHatch<CssProperties["viewTimelineInset"]>>
       /**
         * The **\`view-timeline-name\`** CSS property is used to define the name of a _named view progress timeline_, which is progressed through based on the change in visibility of an element (known as the _subject_) inside a scrollable element (_scroller_). \`view-timeline\` is set on the subject.
         *
         * **Syntax**: \`none | <dashed-ident>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **115** |   n/a   |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-timeline-name
         */
      viewTimelineName?: ConditionalValue<WithEscapeHatch<CssProperties["viewTimelineName"]>>
       /**
         * The **\`view-transition-name\`** CSS property provides the selected element with a distinct identifying name (a \`<custom-ident>\`) and causes it to participate in a separate view transition from the root view transition — or no view transition if the \`none\` value is specified.
         *
         * **Syntax**: \`none | <custom-ident>\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **111** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/view-transition-name
         */
      viewTransitionName?: ConditionalValue<WithEscapeHatch<CssProperties["viewTransitionName"]>>
       /**
         * The **\`visibility\`** CSS property shows or hides an element without changing the layout of a document. The property can also hide rows or columns in a \`<table>\`.
         *
         * **Syntax**: \`visible | hidden | collapse\`
         *
         * **Initial value**: \`visible\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/visibility
         */
      visibility?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["visibility"]>>
       /**
         * The **\`white-space\`** CSS property sets how white space inside an element is handled.
         *
         * **Syntax**: \`normal | pre | nowrap | pre-wrap | pre-line | break-spaces | [ <'white-space-collapse'> || <'text-wrap'> || <'white-space-trim'> ]\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  |  **1**  | **1**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/white-space
         */
      whiteSpace?: ConditionalValue<WithEscapeHatch<CssProperties["whiteSpace"]>>
       /**
         * The **\`white-space-collapse\`** CSS property controls how white space inside an element is collapsed.
         *
         * **Syntax**: \`collapse | discard | preserve | preserve-breaks | preserve-spaces | break-spaces\`
         *
         * **Initial value**: \`collapse\`
         *
         * | Chrome  | Firefox | Safari | Edge | IE  |
         * | :-----: | :-----: | :----: | :--: | :-: |
         * | **114** |   No    |   No   | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/white-space-collapse
         */
      whiteSpaceCollapse?: ConditionalValue<WithEscapeHatch<CssProperties["whiteSpaceCollapse"]>>
       /**
         * The **\`widows\`** CSS property sets the minimum number of lines in a block container that must be shown at the _top_ of a page, region, or column.
         *
         * **Syntax**: \`<integer>\`
         *
         * **Initial value**: \`2\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **25** |   No    | **1.3** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/widows
         */
      widows?: ConditionalValue<WithEscapeHatch<CssProperties["widows"]>>
       /**
         * The **\`width\`** CSS property sets an element's width. By default, it sets the width of the content area, but if \`box-sizing\` is set to \`border-box\`, it sets the width of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/width
         */
      width?: ConditionalValue<WithEscapeHatch<UtilityValues["width"]>>
       /**
         * The **\`will-change\`** CSS property hints to browsers how an element is expected to change. Browsers may set up optimizations before an element is actually changed. These kinds of optimizations can increase the responsiveness of a page by doing potentially expensive work before they are actually required.
         *
         * **Syntax**: \`auto | <animateable-feature>#\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  | Edge | IE  |
         * | :----: | :-----: | :-----: | :--: | :-: |
         * | **36** | **36**  | **9.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/will-change
         */
      willChange?: ConditionalValue<WithEscapeHatch<CssProperties["willChange"]>>
       /**
         * The **\`word-break\`** CSS property sets whether line breaks appear wherever the text would otherwise overflow its content box.
         *
         * **Syntax**: \`normal | break-all | keep-all | break-word\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |   IE    |
         * | :----: | :-----: | :----: | :----: | :-----: |
         * | **1**  | **15**  | **3**  | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/word-break
         */
      wordBreak?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["wordBreak"]>>
       /**
         * The **\`word-spacing\`** CSS property sets the length of space between words and between tags.
         *
         * **Syntax**: \`normal | <length>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/word-spacing
         */
      wordSpacing?: ConditionalValue<WithEscapeHatch<CssProperties["wordSpacing"]>>
       /**
         * The **\`overflow-wrap\`** CSS property applies to inline elements, setting whether the browser should insert line breaks within an otherwise unbreakable string to prevent text from overflowing its line box.
         *
         * **Syntax**: \`normal | break-word\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge   | IE  |
         * | :-----: | :-----: | :-------: | :-----: | :-: |
         * | **≤80** | **≤72** | **≤13.1** | **≤80** | No  |
         */
      wordWrap?: ConditionalValue<WithEscapeHatch<CssProperties["wordWrap"]>>
       /**
         * The **\`writing-mode\`** CSS property sets whether lines of text are laid out horizontally or vertically, as well as the direction in which blocks progress. When set for an entire document, it should be set on the root element (\`html\` element for HTML documents).
         *
         * **Syntax**: \`horizontal-tb | vertical-rl | vertical-lr | sideways-rl | sideways-lr\`
         *
         * **Initial value**: \`horizontal-tb\`
         *
         * | Chrome  | Firefox |  Safari   |  Edge  |  IE   |
         * | :-----: | :-----: | :-------: | :----: | :---: |
         * | **48**  | **41**  | **10.1**  | **12** | **9** |
         * | 8 _-x-_ |         | 5.1 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/writing-mode
         */
      writingMode?: ConditionalValue<WithEscapeHatch<CssVars | CssProperties["writingMode"]>>
       /**
         * The **\`z-index\`** CSS property sets the z-order of a positioned element and its descendants or flex items. Overlapping elements with a larger z-index cover those with a smaller one.
         *
         * **Syntax**: \`auto | <integer>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/z-index
         */
      zIndex?: ConditionalValue<WithEscapeHatch<CssProperties["zIndex"]>>
       /**
         * The non-standard **\`zoom\`** CSS property can be used to control the magnification level of an element. \`transform: scale()\` should be used instead of this property, if possible. However, unlike CSS Transforms, \`zoom\` affects the layout size of the element.
         *
         * **Syntax**: \`normal | reset | <number> | <percentage>\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |   IE    |
         * | :----: | :-----: | :-----: | :----: | :-----: |
         * | **1**  |   n/a   | **3.1** | **12** | **5.5** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/zoom
         */
      zoom?: ConditionalValue<WithEscapeHatch<CssProperties["zoom"]>>
       alignmentBaseline?: ConditionalValue<WithEscapeHatch<CssProperties["alignmentBaseline"]>>
       baselineShift?: ConditionalValue<WithEscapeHatch<CssProperties["baselineShift"]>>
       clipRule?: ConditionalValue<WithEscapeHatch<CssProperties["clipRule"]>>
       colorInterpolation?: ConditionalValue<WithEscapeHatch<CssProperties["colorInterpolation"]>>
       colorRendering?: ConditionalValue<WithEscapeHatch<CssProperties["colorRendering"]>>
       dominantBaseline?: ConditionalValue<WithEscapeHatch<CssProperties["dominantBaseline"]>>
       fill?: ConditionalValue<WithEscapeHatch<UtilityValues["fill"]>>
       fillOpacity?: ConditionalValue<WithEscapeHatch<CssProperties["fillOpacity"]>>
       fillRule?: ConditionalValue<WithEscapeHatch<CssProperties["fillRule"]>>
       floodColor?: ConditionalValue<WithEscapeHatch<CssProperties["floodColor"]>>
       floodOpacity?: ConditionalValue<WithEscapeHatch<CssProperties["floodOpacity"]>>
       glyphOrientationVertical?: ConditionalValue<WithEscapeHatch<CssProperties["glyphOrientationVertical"]>>
       lightingColor?: ConditionalValue<WithEscapeHatch<CssProperties["lightingColor"]>>
       marker?: ConditionalValue<WithEscapeHatch<CssProperties["marker"]>>
       markerEnd?: ConditionalValue<WithEscapeHatch<CssProperties["markerEnd"]>>
       markerMid?: ConditionalValue<WithEscapeHatch<CssProperties["markerMid"]>>
       markerStart?: ConditionalValue<WithEscapeHatch<CssProperties["markerStart"]>>
       shapeRendering?: ConditionalValue<WithEscapeHatch<CssProperties["shapeRendering"]>>
       stopColor?: ConditionalValue<WithEscapeHatch<CssProperties["stopColor"]>>
       stopOpacity?: ConditionalValue<WithEscapeHatch<CssProperties["stopOpacity"]>>
       stroke?: ConditionalValue<WithEscapeHatch<UtilityValues["stroke"]>>
       strokeDasharray?: ConditionalValue<WithEscapeHatch<CssProperties["strokeDasharray"]>>
       strokeDashoffset?: ConditionalValue<WithEscapeHatch<CssProperties["strokeDashoffset"]>>
       strokeLinecap?: ConditionalValue<WithEscapeHatch<CssProperties["strokeLinecap"]>>
       strokeLinejoin?: ConditionalValue<WithEscapeHatch<CssProperties["strokeLinejoin"]>>
       strokeMiterlimit?: ConditionalValue<WithEscapeHatch<CssProperties["strokeMiterlimit"]>>
       strokeOpacity?: ConditionalValue<WithEscapeHatch<CssProperties["strokeOpacity"]>>
       strokeWidth?: ConditionalValue<WithEscapeHatch<CssProperties["strokeWidth"]>>
       textAnchor?: ConditionalValue<WithEscapeHatch<CssProperties["textAnchor"]>>
       vectorEffect?: ConditionalValue<WithEscapeHatch<CssProperties["vectorEffect"]>>
       /**
         * The **\`position\`** CSS property sets how an element is positioned in a document. The \`top\`, \`right\`, \`bottom\`, and \`left\` properties determine the final location of positioned elements.
         *
         * **Syntax**: \`static | relative | absolute | sticky | fixed\`
         *
         * **Initial value**: \`static\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/position
         */
      pos?: ConditionalValue<WithEscapeHatch<CssProperties["position"]>>
       /**
         * The **\`inset-inline\`** CSS property defines the logical start and end offsets of an element in the inline direction, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline
         */
      insetX?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInline"]>>
       /**
         * The **\`inset-block\`** CSS property defines the logical block start and end offsets of an element, which maps to physical offsets depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\` and \`bottom\`, or \`right\` and \`left\` properties depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-block
         */
      insetY?: ConditionalValue<WithEscapeHatch<UtilityValues["insetBlock"]>>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      insetEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineEnd"]>>
       /**
         * The **\`inset-inline-end\`** CSS property defines the logical inline end inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-end
         */
      end?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineEnd"]>>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      insetStart?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineStart"]>>
       /**
         * The **\`inset-inline-start\`** CSS property defines the logical inline start inset of an element, which maps to a physical offset depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`top\`, \`right\`, \`bottom\`, or \`left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'top'>\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **63**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/inset-inline-start
         */
      start?: ConditionalValue<WithEscapeHatch<UtilityValues["insetInlineStart"]>>
       /**
         * The **\`flex-direction\`** CSS property sets how flex items are placed in the flex container defining the main axis and the direction (normal or reversed).
         *
         * **Syntax**: \`row | row-reverse | column | column-reverse\`
         *
         * **Initial value**: \`row\`
         *
         * |  Chrome  | Firefox  | Safari  |  Edge  |    IE    |
         * | :------: | :------: | :-----: | :----: | :------: |
         * |  **29**  |  **81**  |  **9**  | **12** |  **11**  |
         * | 21 _-x-_ | 49 _-x-_ | 7 _-x-_ |        | 10 _-x-_ |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/flex-direction
         */
      flexDir?: ConditionalValue<WithEscapeHatch<CssProperties["flexDirection"]>>
       /**
         * The **\`padding\`** CSS shorthand property sets the padding area on all four sides of an element at once.
         *
         * **Syntax**: \`[ <length> | <percentage> ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding
         */
      p?: ConditionalValue<WithEscapeHatch<UtilityValues["padding"]>>
       /**
         * The **\`padding-left\`** CSS property sets the width of the padding area to the left of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-left
         */
      pl?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingLeft"]>>
       /**
         * The **\`padding-right\`** CSS property sets the width of the padding area on the right of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-right
         */
      pr?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingRight"]>>
       /**
         * The **\`padding-top\`** CSS property sets the height of the padding area on the top of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-top
         */
      pt?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingTop"]>>
       /**
         * The **\`padding-bottom\`** CSS property sets the height of the padding area on the bottom of an element.
         *
         * **Syntax**: \`<length> | <percentage>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-bottom
         */
      pb?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBottom"]>>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      py?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBlock"]>>
       /**
         * The **\`padding-block\`** CSS shorthand property defines the logical block start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-block
         */
      paddingY?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingBlock"]>>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      paddingX?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInline"]>>
       /**
         * The **\`padding-inline\`** CSS shorthand property defines the logical inline start and end padding of an element, which maps to physical padding properties depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline
         */
      px?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInline"]>>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      pe?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineEnd"]>>
       /**
         * The **\`padding-inline-end\`** CSS property defines the logical inline end padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome           |        Firefox         |          Safari           | Edge | IE  |
         * | :-----------------------: | :--------------------: | :-----------------------: | :--: | :-: |
         * |          **69**           |         **41**         |         **12.1**          | n/a  | No  |
         * | 2 _(-webkit-padding-end)_ | 3 _(-moz-padding-end)_ | 3 _(-webkit-padding-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-end
         */
      paddingEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineEnd"]>>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      ps?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineStart"]>>
       /**
         * The **\`padding-inline-start\`** CSS property defines the logical inline start padding of an element, which maps to a physical padding depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'padding-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome            |         Firefox          |           Safari            | Edge | IE  |
         * | :-------------------------: | :----------------------: | :-------------------------: | :--: | :-: |
         * |           **69**            |          **41**          |          **12.1**           | n/a  | No  |
         * | 2 _(-webkit-padding-start)_ | 3 _(-moz-padding-start)_ | 3 _(-webkit-padding-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/padding-inline-start
         */
      paddingStart?: ConditionalValue<WithEscapeHatch<UtilityValues["paddingInlineStart"]>>
       /**
         * The **\`margin-left\`** CSS property sets the margin area on the left side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-left
         */
      ml?: ConditionalValue<WithEscapeHatch<UtilityValues["marginLeft"]>>
       /**
         * The **\`margin-right\`** CSS property sets the margin area on the right side of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-right
         */
      mr?: ConditionalValue<WithEscapeHatch<UtilityValues["marginRight"]>>
       /**
         * The **\`margin-top\`** CSS property sets the margin area on the top of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-top
         */
      mt?: ConditionalValue<WithEscapeHatch<UtilityValues["marginTop"]>>
       /**
         * The **\`margin-bottom\`** CSS property sets the margin area on the bottom of an element. A positive value places it farther from its neighbors, while a negative value places it closer.
         *
         * **Syntax**: \`<length> | <percentage> | auto\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-bottom
         */
      mb?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBottom"]>>
       /**
         * The **\`margin\`** CSS shorthand property sets the margin area on all four sides of an element.
         *
         * **Syntax**: \`[ <length> | <percentage> | auto ]{1,4}\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **3** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin
         */
      m?: ConditionalValue<WithEscapeHatch<UtilityValues["margin"]>>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      my?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBlock"]>>
       /**
         * The **\`margin-block\`** CSS shorthand property defines the logical block start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-block
         */
      marginY?: ConditionalValue<WithEscapeHatch<UtilityValues["marginBlock"]>>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      mx?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInline"]>>
       /**
         * The **\`margin-inline\`** CSS shorthand property is a shorthand property that defines both the logical inline start and end margins of an element, which maps to physical margins depending on the element's writing mode, directionality, and text orientation.
         *
         * **Syntax**: \`<'margin-left'>{1,2}\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline
         */
      marginX?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInline"]>>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      me?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineEnd"]>>
       /**
         * The **\`margin-inline-end\`** CSS property defines the logical inline end margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. In other words, it corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\` or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |          Chrome          |        Firefox        |          Safari          | Edge | IE  |
         * | :----------------------: | :-------------------: | :----------------------: | :--: | :-: |
         * |          **69**          |        **41**         |         **12.1**         | n/a  | No  |
         * | 2 _(-webkit-margin-end)_ | 3 _(-moz-margin-end)_ | 3 _(-webkit-margin-end)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-end
         */
      marginEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineEnd"]>>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      ms?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineStart"]>>
       /**
         * The **\`margin-inline-start\`** CSS property defines the logical inline start margin of an element, which maps to a physical margin depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`margin-top\`, \`margin-right\`, \`margin-bottom\`, or \`margin-left\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'margin-left'>\`
         *
         * **Initial value**: \`0\`
         *
         * |           Chrome           |         Firefox         |           Safari           | Edge | IE  |
         * | :------------------------: | :---------------------: | :------------------------: | :--: | :-: |
         * |           **69**           |         **41**          |          **12.1**          | n/a  | No  |
         * | 2 _(-webkit-margin-start)_ | 3 _(-moz-margin-start)_ | 3 _(-webkit-margin-start)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/margin-inline-start
         */
      marginStart?: ConditionalValue<WithEscapeHatch<UtilityValues["marginInlineStart"]>>
       /**
         * The CSS **\`outline-width\`** property sets the thickness of an element's outline. An outline is a line that is drawn around an element, outside the \`border\`.
         *
         * **Syntax**: \`<line-width>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-width
         */
      ringWidth?: ConditionalValue<WithEscapeHatch<CssProperties["outlineWidth"]>>
       /**
         * The **\`outline-color\`** CSS property sets the color of an element's outline.
         *
         * **Syntax**: \`<color> | invert\`
         *
         * **Initial value**: \`invert\`, for browsers supporting it, \`currentColor\` for the other
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  | **1.5** | **1.2** | **12** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-color
         */
      ringColor?: ConditionalValue<WithEscapeHatch<UtilityValues["outlineColor"]>>
       /**
         * The **\`outline\`** CSS shorthand property sets most of the outline properties in a single declaration.
         *
         * **Syntax**: \`[ <'outline-color'> || <'outline-style'> || <'outline-width'> ]\`
         *
         * | Chrome | Firefox |  Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :------: | :----: | :---: |
         * | **94** | **88**  | **16.4** | **94** | **8** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline
         */
      ring?: ConditionalValue<WithEscapeHatch<UtilityValues["outline"]>>
       /**
         * The **\`outline-offset\`** CSS property sets the amount of space between an outline and the edge or border of an element.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari  |  Edge  | IE  |
         * | :----: | :-----: | :-----: | :----: | :-: |
         * | **1**  | **1.5** | **1.2** | **15** | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/outline-offset
         */
      ringOffset?: ConditionalValue<WithEscapeHatch<UtilityValues["outlineOffset"]>>
       /**
         * The **\`width\`** CSS property sets an element's width. By default, it sets the width of the content area, but if \`box-sizing\` is set to \`border-box\`, it sets the width of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/width
         */
      w?: ConditionalValue<WithEscapeHatch<UtilityValues["width"]>>
       /**
         * The **\`min-width\`** CSS property sets the minimum width of an element. It prevents the used value of the \`width\` property from becoming smaller than the value specified for \`min-width\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-width
         */
      minW?: ConditionalValue<WithEscapeHatch<UtilityValues["minWidth"]>>
       /**
         * The **\`max-width\`** CSS property sets the maximum width of an element. It prevents the used value of the \`width\` property from becoming larger than the value specified by \`max-width\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-width
         */
      maxW?: ConditionalValue<WithEscapeHatch<UtilityValues["maxWidth"]>>
       /**
         * The **\`height\`** CSS property specifies the height of an element. By default, the property defines the height of the content area. If \`box-sizing\` is set to \`border-box\`, however, it instead determines the height of the border area.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/height
         */
      h?: ConditionalValue<WithEscapeHatch<UtilityValues["height"]>>
       /**
         * The **\`min-height\`** CSS property sets the minimum height of an element. It prevents the used value of the \`height\` property from becoming smaller than the value specified for \`min-height\`.
         *
         * **Syntax**: \`auto | <length> | <percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`auto\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **3**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/min-height
         */
      minH?: ConditionalValue<WithEscapeHatch<UtilityValues["minHeight"]>>
       /**
         * The **\`max-height\`** CSS property sets the maximum height of an element. It prevents the used value of the \`height\` property from becoming larger than the value specified for \`max-height\`.
         *
         * **Syntax**: \`none | <length-percentage> | min-content | max-content | fit-content | fit-content(<length-percentage>)\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **18** |  **1**  | **1.3** | **12** | **7** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/max-height
         */
      maxH?: ConditionalValue<WithEscapeHatch<UtilityValues["maxHeight"]>>
       textShadowColor?: ConditionalValue<WithEscapeHatch<UtilityValues["textShadowColor"]>>
       /**
         * The **\`background-position\`** CSS property sets the initial position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`<bg-position>#\`
         *
         * **Initial value**: \`0% 0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position
         */
      bgPosition?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPosition"]>>
       /**
         * The **\`background-position-x\`** CSS property sets the initial horizontal position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ left | right | x-start | x-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-x
         */
      bgPositionX?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPositionX"]>>
       /**
         * The **\`background-position-y\`** CSS property sets the initial vertical position for each background image. The position is relative to the position layer set by \`background-origin\`.
         *
         * **Syntax**: \`[ center | [ [ top | bottom | y-start | y-end ]? <length-percentage>? ]! ]#\`
         *
         * **Initial value**: \`0%\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  | **49**  | **1**  | **12** | **6** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-position-y
         */
      bgPositionY?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundPositionY"]>>
       /**
         * The **\`background-attachment\`** CSS property sets whether a background image's position is fixed within the viewport, or scrolls with its containing block.
         *
         * **Syntax**: \`<attachment>#\`
         *
         * **Initial value**: \`scroll\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-attachment
         */
      bgAttachment?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundAttachment"]>>
       /**
         * The **\`background-clip\`** CSS property sets whether an element's background extends underneath its border box, padding box, or content box.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`border-box\`
         *
         * | Chrome | Firefox | Safari  |  Edge  |  IE   |
         * | :----: | :-----: | :-----: | :----: | :---: |
         * | **1**  |  **4**  |  **5**  | **12** | **9** |
         * |        |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-clip
         */
      bgClip?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundClip"]>>
       /**
         * The **\`background\`** shorthand CSS property sets all background style properties at once, such as color, image, origin and size, or repeat method.
         *
         * **Syntax**: \`[ <bg-layer> , ]* <final-bg-layer>\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background
         */
      bg?: ConditionalValue<WithEscapeHatch<UtilityValues["background"]>>
       /**
         * The **\`background-color\`** CSS property sets the background color of an element.
         *
         * **Syntax**: \`<color>\`
         *
         * **Initial value**: \`transparent\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-color
         */
      bgColor?: ConditionalValue<WithEscapeHatch<UtilityValues["backgroundColor"]>>
       /**
         * The **\`background-origin\`** CSS property sets the background's origin: from the border start, inside the border, or inside the padding.
         *
         * **Syntax**: \`<box>#\`
         *
         * **Initial value**: \`padding-box\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **4**  | **3**  | **12** | **9** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-origin
         */
      bgOrigin?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundOrigin"]>>
       /**
         * The **\`background-image\`** CSS property sets one or more background images on an element.
         *
         * **Syntax**: \`<bg-image>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-image
         */
      bgImage?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundImage"]>>
       /**
         * The **\`background-repeat\`** CSS property sets how background images are repeated. A background image can be repeated along the horizontal and vertical axes, or not repeated at all.
         *
         * **Syntax**: \`<repeat-style>#\`
         *
         * **Initial value**: \`repeat\`
         *
         * | Chrome | Firefox | Safari |  Edge  |  IE   |
         * | :----: | :-----: | :----: | :----: | :---: |
         * | **1**  |  **1**  | **1**  | **12** | **4** |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-repeat
         */
      bgRepeat?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundRepeat"]>>
       /**
         * The **\`background-blend-mode\`** CSS property sets how an element's background images should blend with each other and with the element's background color.
         *
         * **Syntax**: \`<blend-mode>#\`
         *
         * **Initial value**: \`normal\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **35** | **30**  | **8**  | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-blend-mode
         */
      bgBlendMode?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundBlendMode"]>>
       /**
         * The **\`background-size\`** CSS property sets the size of the element's background image. The image can be left to its natural size, stretched, or constrained to fit the available space.
         *
         * **Syntax**: \`<bg-size>#\`
         *
         * **Initial value**: \`auto auto\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **3**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/background-size
         */
      bgSize?: ConditionalValue<WithEscapeHatch<CssProperties["backgroundSize"]>>
       bgGradient?: ConditionalValue<WithEscapeHatch<UtilityValues["backgroundGradient"]>>
       /**
         * The **\`border-radius\`** CSS property rounds the corners of an element's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners.
         *
         * **Syntax**: \`<length-percentage>{1,4} [ / <length-percentage>{1,4} ]?\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-radius
         */
      rounded?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRadius"]>>
       /**
         * The **\`border-top-left-radius\`** CSS property rounds the top-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius
         */
      roundedTopLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopLeftRadius"]>>
       /**
         * The **\`border-top-right-radius\`** CSS property rounds the top-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius
         */
      roundedTopRight?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopRightRadius"]>>
       /**
         * The **\`border-bottom-right-radius\`** CSS property rounds the bottom-right corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius
         */
      roundedBottomRight?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomRightRadius"]>>
       /**
         * The **\`border-bottom-left-radius\`** CSS property rounds the bottom-left corner of an element by specifying the radius (or the radius of the semi-major and semi-minor axes) of the ellipse defining the curvature of the corner.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * |  **4**  |  **4**  |  **5**  | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius
         */
      roundedBottomLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomLeftRadius"]>>
       roundedTop?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopRadius"]>>
       roundedRight?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRightRadius"]>>
       roundedBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomRadius"]>>
       roundedLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["borderLeftRadius"]>>
       /**
         * The **\`border-start-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-start-radius
         */
      roundedStartStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartStartRadius"]>>
       /**
         * The **\`border-start-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-start-end-radius
         */
      roundedStartEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartEndRadius"]>>
       roundedStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartRadius"]>>
       /**
         * The **\`border-end-start-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius depending on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-start-radius
         */
      roundedEndStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndStartRadius"]>>
       /**
         * The **\`border-end-end-radius\`** CSS property defines a logical border radius on an element, which maps to a physical border radius that depends on the element's \`writing-mode\`, \`direction\`, and \`text-orientation\`. This is useful when building styles to work regardless of the text orientation and writing mode.
         *
         * **Syntax**: \`<length-percentage>{1,2}\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **89** | **66**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-end-end-radius
         */
      roundedEndEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndEndRadius"]>>
       roundedEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndRadius"]>>
       /**
         * The **\`border-inline\`** CSS property is a shorthand property for setting the individual logical inline border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline
         */
      borderX?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInline"]>>
       /**
         * The **\`border-inline-width\`** CSS property defines the width of the logical inline borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-width
         */
      borderXWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineWidth"]>>
       /**
         * The **\`border-inline-color\`** CSS property defines the color of the logical inline borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-color
         */
      borderXColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineColor"]>>
       /**
         * The **\`border-block\`** CSS property is a shorthand property for setting the individual logical block border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block
         */
      borderY?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlock"]>>
       /**
         * The **\`border-block-width\`** CSS property defines the width of the logical block borders of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\` and \`border-bottom-width\`, or \`border-left-width\`, and \`border-right-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-width
         */
      borderYWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderBlockWidth"]>>
       /**
         * The **\`border-block-color\`** CSS property defines the color of the logical block borders of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\` and \`border-bottom-color\`, or \`border-right-color\` and \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>{1,2}\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **87** | **66**  | **14.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-block-color
         */
      borderYColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBlockColor"]>>
       /**
         * The **\`border-inline-start\`** CSS property is a shorthand property for setting the individual logical inline-start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start
         */
      borderStart?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineStart"]>>
       /**
         * The **\`border-inline-start-width\`** CSS property defines the width of the logical inline-start border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-width
         */
      borderStartWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineStartWidth"]>>
       /**
         * The **\`border-inline-start-color\`** CSS property defines the color of the logical inline start border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |            Firefox            |  Safari  | Edge | IE  |
         * | :----: | :---------------------------: | :------: | :--: | :-: |
         * | **69** |            **41**             | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-start-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-start-color
         */
      borderStartColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineStartColor"]>>
       /**
         * The **\`border-inline-end\`** CSS property is a shorthand property for setting the individual logical inline-end border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-top-width'> || <'border-top-style'> || <color>\`
         *
         * | Chrome | Firefox |  Safari  | Edge | IE  |
         * | :----: | :-----: | :------: | :--: | :-: |
         * | **69** | **41**  | **12.1** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end
         */
      borderEnd?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineEnd"]>>
       /**
         * The **\`border-inline-end-width\`** CSS property defines the width of the logical inline-end border of an element, which maps to a physical border width depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-width\`, \`border-right-width\`, \`border-bottom-width\`, or \`border-left-width\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-width'>\`
         *
         * **Initial value**: \`medium\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-width)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-width
         */
      borderEndWidth?: ConditionalValue<WithEscapeHatch<CssProperties["borderInlineEndWidth"]>>
       /**
         * The **\`border-inline-end-color\`** CSS property defines the color of the logical inline-end border of an element, which maps to a physical border color depending on the element's writing mode, directionality, and text orientation. It corresponds to the \`border-top-color\`, \`border-right-color\`, \`border-bottom-color\`, or \`border-left-color\` property depending on the values defined for \`writing-mode\`, \`direction\`, and \`text-orientation\`.
         *
         * **Syntax**: \`<'border-top-color'>\`
         *
         * **Initial value**: \`currentcolor\`
         *
         * | Chrome |           Firefox           |  Safari  | Edge | IE  |
         * | :----: | :-------------------------: | :------: | :--: | :-: |
         * | **69** |           **41**            | **12.1** | n/a  | No  |
         * |        | 3 _(-moz-border-end-color)_ |          |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/border-inline-end-color
         */
      borderEndColor?: ConditionalValue<WithEscapeHatch<UtilityValues["borderInlineEndColor"]>>
       /**
         * The **\`box-shadow\`** CSS property adds shadow effects around an element's frame. You can set multiple effects separated by commas. A box shadow is described by X and Y offsets relative to the element, blur and spread radius, and color.
         *
         * **Syntax**: \`none | <shadow>#\`
         *
         * **Initial value**: \`none\`
         *
         * | Chrome  | Firefox | Safari  |  Edge  |  IE   |
         * | :-----: | :-----: | :-----: | :----: | :---: |
         * | **10**  |  **4**  | **5.1** | **12** | **9** |
         * | 1 _-x-_ |         | 3 _-x-_ |        |       |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/box-shadow
         */
      shadow?: ConditionalValue<WithEscapeHatch<UtilityValues["boxShadow"]>>
       shadowColor?: ConditionalValue<WithEscapeHatch<UtilityValues["boxShadowColor"]>>
       x?: ConditionalValue<WithEscapeHatch<UtilityValues["translateX"]>>
       y?: ConditionalValue<WithEscapeHatch<UtilityValues["translateY"]>>
       /**
         * The \`scroll-margin-block\` shorthand property sets the scroll margins of an element in the block dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-block
         */
      scrollMarginY?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginBlock"]>>
       /**
         * The \`scroll-margin-inline\` shorthand property sets the scroll margins of an element in the inline dimension.
         *
         * **Syntax**: \`<length>{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-inline
         */
      scrollMarginX?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollMarginInline"]>>
       /**
         * The \`scroll-padding-block\` shorthand property sets the scroll padding of an element in the block dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-block
         */
      scrollPaddingY?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingBlock"]>>
       /**
         * The \`scroll-padding-inline\` shorthand property sets the scroll padding of an element in the inline dimension.
         *
         * **Syntax**: \`[ auto | <length-percentage> ]{1,2}\`
         *
         * | Chrome | Firefox | Safari | Edge | IE  |
         * | :----: | :-----: | :----: | :--: | :-: |
         * | **69** | **68**  | **15** | n/a  | No  |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-padding-inline
         */
      scrollPaddingX?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollPaddingInline"]>>
       hideFrom?: ConditionalValue<WithEscapeHatch<UtilityValues["hideFrom"]>>
       hideBelow?: ConditionalValue<WithEscapeHatch<UtilityValues["hideBelow"]>>
       divideX?: ConditionalValue<WithEscapeHatch<UtilityValues["divideX"]>>
       divideY?: ConditionalValue<WithEscapeHatch<UtilityValues["divideY"]>>
       divideColor?: ConditionalValue<WithEscapeHatch<UtilityValues["divideColor"]>>
       divideStyle?: ConditionalValue<WithEscapeHatch<string | number>>
       fontSmoothing?: ConditionalValue<WithEscapeHatch<UtilityValues["fontSmoothing"]>>
       truncate?: ConditionalValue<WithEscapeHatch<UtilityValues["truncate"]>>
       backgroundGradient?: ConditionalValue<WithEscapeHatch<UtilityValues["backgroundGradient"]>>
       textGradient?: ConditionalValue<WithEscapeHatch<UtilityValues["textGradient"]>>
       gradientFrom?: ConditionalValue<WithEscapeHatch<UtilityValues["gradientFrom"]>>
       gradientTo?: ConditionalValue<WithEscapeHatch<UtilityValues["gradientTo"]>>
       gradientVia?: ConditionalValue<WithEscapeHatch<UtilityValues["gradientVia"]>>
       borderTopRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderTopRadius"]>>
       borderRightRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderRightRadius"]>>
       borderBottomRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderBottomRadius"]>>
       borderLeftRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderLeftRadius"]>>
       borderStartRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderStartRadius"]>>
       borderEndRadius?: ConditionalValue<WithEscapeHatch<UtilityValues["borderEndRadius"]>>
       boxShadowColor?: ConditionalValue<WithEscapeHatch<UtilityValues["boxShadowColor"]>>
       brightness?: ConditionalValue<WithEscapeHatch<string | number>>
       contrast?: ConditionalValue<WithEscapeHatch<string | number>>
       grayscale?: ConditionalValue<WithEscapeHatch<string | number>>
       hueRotate?: ConditionalValue<WithEscapeHatch<string | number>>
       invert?: ConditionalValue<WithEscapeHatch<string | number>>
       saturate?: ConditionalValue<WithEscapeHatch<string | number>>
       sepia?: ConditionalValue<WithEscapeHatch<string | number>>
       dropShadow?: ConditionalValue<WithEscapeHatch<string | number>>
       blur?: ConditionalValue<WithEscapeHatch<UtilityValues["blur"]>>
       backdropBlur?: ConditionalValue<WithEscapeHatch<UtilityValues["backdropBlur"]>>
       backdropBrightness?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropContrast?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropGrayscale?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropHueRotate?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropInvert?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropOpacity?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropSaturate?: ConditionalValue<WithEscapeHatch<string | number>>
       backdropSepia?: ConditionalValue<WithEscapeHatch<string | number>>
       borderSpacingX?: ConditionalValue<WithEscapeHatch<UtilityValues["borderSpacingX"]>>
       borderSpacingY?: ConditionalValue<WithEscapeHatch<UtilityValues["borderSpacingY"]>>
       scaleX?: ConditionalValue<WithEscapeHatch<string | number>>
       scaleY?: ConditionalValue<WithEscapeHatch<string | number>>
       translateX?: ConditionalValue<WithEscapeHatch<UtilityValues["translateX"]>>
       translateY?: ConditionalValue<WithEscapeHatch<UtilityValues["translateY"]>>
       scrollbar?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollbar"]>>
       scrollSnapStrictness?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapStrictness"]>>
       /**
         * The **\`scroll-margin\`** shorthand property sets all of the scroll margins of an element at once, assigning values much like the \`margin\` property does for margins of an element.
         *
         * **Syntax**: \`<length>{1,4}\`
         *
         * | Chrome | Firefox |          Safari           | Edge | IE  |
         * | :----: | :-----: | :-----------------------: | :--: | :-: |
         * | **69** |  68-90  |         **14.1**          | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin
         */
      scrollSnapMargin?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapMargin"]>>
       /**
         * The \`scroll-margin-top\` property defines the top margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |            Safari             | Edge | IE  |
         * | :----: | :-----: | :---------------------------: | :--: | :-: |
         * | **69** | **68**  |           **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-top)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-top
         */
      scrollSnapMarginTop?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapMarginTop"]>>
       /**
         * The \`scroll-margin-bottom\` property defines the bottom margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |              Safari              | Edge | IE  |
         * | :----: | :-----: | :------------------------------: | :--: | :-: |
         * | **69** | **68**  |             **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-bottom)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-bottom
         */
      scrollSnapMarginBottom?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapMarginBottom"]>>
       /**
         * The \`scroll-margin-left\` property defines the left margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari             | Edge | IE  |
         * | :----: | :-----: | :----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**            | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-left)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-left
         */
      scrollSnapMarginLeft?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapMarginLeft"]>>
       /**
         * The \`scroll-margin-right\` property defines the right margin of the scroll snap area that is used for snapping this box to the snapport. The scroll snap area is determined by taking the transformed border box, finding its rectangular bounding box (axis-aligned in the scroll container's coordinate space), then adding the specified outsets.
         *
         * **Syntax**: \`<length>\`
         *
         * **Initial value**: \`0\`
         *
         * | Chrome | Firefox |             Safari              | Edge | IE  |
         * | :----: | :-----: | :-----------------------------: | :--: | :-: |
         * | **69** | **68**  |            **14.1**             | n/a  | No  |
         * |        |         | 11 _(scroll-snap-margin-right)_ |      |     |
         *
         * @see https://developer.mozilla.org/docs/Web/CSS/scroll-margin-right
         */
      scrollSnapMarginRight?: ConditionalValue<WithEscapeHatch<UtilityValues["scrollSnapMarginRight"]>>
       srOnly?: ConditionalValue<WithEscapeHatch<UtilityValues["srOnly"]>>
       debug?: ConditionalValue<WithEscapeHatch<UtilityValues["debug"]>>
       colorPalette?: ConditionalValue<WithEscapeHatch<UtilityValues["colorPalette"]>>
       textStyle?: ConditionalValue<WithEscapeHatch<UtilityValues["textStyle"]>>
      }"
    `)
  })

  test('with globalVars', () => {
    const str = generateStyleProps(
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
    )

    expect(str.slice(0, str.indexOf('WebkitBorderBefore'))).toMatchInlineSnapshot(`
      "import type { ConditionalValue } from './conditions';
      import type { OnlyKnown, UtilityValues, WithEscapeHatch } from './prop-type';
      import type { CssProperties } from './system-types';
      import type { Token } from '../tokens/index';

      type AnyString = (string & {})
      type CssVars = "var(--random-color)" | "var(--button-color)"
      type CssVarValue = ConditionalValue<Token | CssVars | AnyString | (number & {})>

      type CssVarName = "random-color" | "button-color" | AnyString
      type CssVarKeys = \`--\${CssVarName}\`

      export type CssVarProperties = {
        [key in CssVarKeys]?: CssVarValue
      }

      export interface SystemProperties {
         /**
         * The **\`appearance\`** CSS property is used to control native appearance of UI controls, that are based on operating system's theme.
         *
         * **Syntax**: \`none | button | button-bevel | caret | checkbox | default-button | inner-spin-button | listbox | listitem | media-controls-background | media-controls-fullscreen-background | media-current-time-display | media-enter-fullscreen-button | media-exit-fullscreen-button | media-fullscreen-button | media-mute-button | media-overlay-play-button | media-play-button | media-seek-back-button | media-seek-forward-button | media-slider | media-sliderthumb | media-time-remaining-display | media-toggle-closed-captions-button | media-volume-slider | media-volume-slider-container | media-volume-sliderthumb | menulist | menulist-button | menulist-text | menulist-textfield | meter | progress-bar | progress-bar-value | push-button | radio | searchfield | searchfield-cancel-button | searchfield-decoration | searchfield-results-button | searchfield-results-decoration | slider-horizontal | slider-vertical | sliderthumb-horizontal | sliderthumb-vertical | square-button | textarea | textfield | -apple-pay-button\`
         *
         * **Initial value**: \`none\` (but this value is overridden in the user agent CSS)
         */
      WebkitAppearance?: ConditionalValue<CssProperties["WebkitAppearance"] | AnyString>
       /**
         * The **\`-webkit-border-before\`** CSS property is a shorthand property for setting the individual logical block start border property values in a single place in the style sheet.
         *
         * **Syntax**: \`<'border-width'> || <'border-style'> || <color>\`
         */
      "
    `)
  })
})
