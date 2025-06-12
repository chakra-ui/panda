/**
 * Slightly modified from https://github.com/facebook/stylex/blob/main/packages/%40stylexjs/babel-plugin/src/shared/utils/property-priorities.js
 * License: MIT
 */
const longHandPhysical = new Set<string>()
const longHandLogical = new Set<string>()
const shorthandsOfLonghands = new Set<string>()
const shorthandsOfShorthands = new Set<string>()

// Composition and Blending
longHandLogical.add('backgroundBlendMode')
longHandLogical.add('isolation')
longHandLogical.add('mixBlendMode')

// CSS Animations
shorthandsOfShorthands.add('animation')
longHandLogical.add('animationComposition')
longHandLogical.add('animationDelay')
longHandLogical.add('animationDirection')
longHandLogical.add('animationDuration')
longHandLogical.add('animationFillMode')
longHandLogical.add('animationIterationCount')
longHandLogical.add('animationName')
longHandLogical.add('animationPlayState')
shorthandsOfLonghands.add('animationRange')
longHandLogical.add('animationRangeEnd')
longHandLogical.add('animationRangeStart')
longHandLogical.add('animationTimingFunction')
longHandLogical.add('animationTimeline')

shorthandsOfLonghands.add('scrollTimeline')
longHandLogical.add('scrollTimelineAxis')
longHandLogical.add('scrollTimelineName')

longHandLogical.add('timelineScope')

shorthandsOfLonghands.add('viewTimeline')
longHandLogical.add('viewTimelineAxis')
longHandLogical.add('viewTimelineInset')
longHandLogical.add('viewTimelineName')

// CSS Backgrounds and Borders
shorthandsOfShorthands.add('background')
longHandLogical.add('backgroundAttachment')
longHandLogical.add('backgroundClip')
longHandLogical.add('backgroundColor')
longHandLogical.add('backgroundImage')
longHandLogical.add('backgroundOrigin')
longHandLogical.add('backgroundRepeat')
longHandLogical.add('backgroundSize')
shorthandsOfLonghands.add('backgroundPosition')
longHandLogical.add('backgroundPositionX')
longHandLogical.add('backgroundPositionY')

shorthandsOfShorthands.add('border') // OF SHORTHANDS!
shorthandsOfLonghands.add('borderColor')
shorthandsOfLonghands.add('borderStyle')
shorthandsOfLonghands.add('borderWidth')
shorthandsOfShorthands.add('borderBlock')
longHandLogical.add('borderBlockColor')
longHandLogical.add('borderBlockStyle')
longHandLogical.add('borderBlockWidth')
shorthandsOfLonghands.add('borderBlockStart')
shorthandsOfLonghands.add('borderTop')
longHandLogical.add('borderBlockStartColor')
longHandPhysical.add('borderTopColor')
longHandLogical.add('borderBlockStartStyle')
longHandPhysical.add('borderTopStyle')
longHandLogical.add('borderBlockStartWidth')
longHandPhysical.add('borderTopWidth')
shorthandsOfLonghands.add('borderBlockEnd')
shorthandsOfLonghands.add('borderBottom')
longHandLogical.add('borderBlockEndColor')
longHandPhysical.add('borderBottomColor')
longHandLogical.add('borderBlockEndStyle')
longHandPhysical.add('borderBottomStyle')
longHandLogical.add('borderBlockEndWidth') //
longHandPhysical.add('borderBottomWidth')
shorthandsOfShorthands.add('borderInline')
shorthandsOfLonghands.add('borderInlineColor')
shorthandsOfLonghands.add('borderInlineStyle')
shorthandsOfLonghands.add('borderInlineWidth')
shorthandsOfLonghands.add('borderInlineStart')
shorthandsOfLonghands.add('borderLeft')
longHandLogical.add('borderInlineStartColor')
longHandPhysical.add('borderLeftColor')
longHandLogical.add('borderInlineStartStyle')
longHandPhysical.add('borderLeftStyle')
longHandLogical.add('borderInlineStartWidth')
longHandPhysical.add('borderLeftWidth')
shorthandsOfLonghands.add('borderInlineEnd')
shorthandsOfLonghands.add('borderRight')
longHandLogical.add('borderInlineEndColor')
longHandPhysical.add('borderRightColor')
longHandLogical.add('borderInlineEndStyle')
longHandPhysical.add('borderRightStyle')
longHandLogical.add('borderInlineEndWidth')
longHandPhysical.add('borderRightWidth')

shorthandsOfLonghands.add('borderImage')
longHandLogical.add('borderImageOutset')
longHandLogical.add('borderImageRepeat')
longHandLogical.add('borderImageSlice')
longHandLogical.add('borderImageSource')
longHandLogical.add('borderImageWidth')

shorthandsOfLonghands.add('borderRadius')
longHandLogical.add('borderStartEndRadius')
longHandLogical.add('borderStartStartRadius')
longHandLogical.add('borderEndEndRadius')
longHandLogical.add('borderEndStartRadius')
longHandPhysical.add('borderTopLeftRadius')
longHandPhysical.add('borderTopRightRadius')
longHandPhysical.add('borderBottomLeftRadius')
longHandPhysical.add('borderBottomRightRadius')

longHandLogical.add('boxShadow')

// CSS Basic User Interface
longHandLogical.add('accentColor')
longHandLogical.add('appearance')
longHandLogical.add('aspectRatio')

shorthandsOfLonghands.add('caret')
longHandLogical.add('caretColor')
longHandLogical.add('caretShape')

longHandLogical.add('cursor')
longHandLogical.add('imeMode')
longHandLogical.add('inputSecurity')

shorthandsOfLonghands.add('outline')
longHandLogical.add('outlineColor')
longHandLogical.add('outlineOffset')
longHandLogical.add('outlineStyle')
longHandLogical.add('outlineWidth')

longHandLogical.add('pointerEvents')
longHandLogical.add('resize') // horizontal, vertical, block, inline, both
longHandLogical.add('textOverflow')
longHandLogical.add('userSelect')

// CSS Box Alignment
shorthandsOfLonghands.add('gridGap') // alias for `gap`
shorthandsOfLonghands.add('gap')
longHandLogical.add('gridRowGap')
longHandLogical.add('rowGap')
longHandLogical.add('gridColumnGap')
longHandLogical.add('columnGap')

shorthandsOfLonghands.add('placeContent')
longHandLogical.add('alignContent')
longHandLogical.add('justifyContent')

shorthandsOfLonghands.add('placeItems')
longHandLogical.add('alignItems')
longHandLogical.add('justifyItems')

shorthandsOfLonghands.add('placeSelf')
longHandLogical.add('alignSelf')
longHandLogical.add('justifySelf')

// CSS Box Model
longHandLogical.add('boxSizing')

longHandLogical.add('blockSize')
longHandPhysical.add('height')
longHandLogical.add('inlineSize')
longHandPhysical.add('width')

longHandLogical.add('maxBlockSize')
longHandPhysical.add('maxHeight')
longHandLogical.add('maxInlineSize')
longHandPhysical.add('maxWidth')
longHandLogical.add('minBlockSize')
longHandPhysical.add('minHeight')
longHandLogical.add('minInlineSize')
longHandPhysical.add('minWidth')

shorthandsOfShorthands.add('margin')
shorthandsOfLonghands.add('marginBlock')
longHandLogical.add('marginBlockStart')
longHandPhysical.add('marginTop')
longHandLogical.add('marginBlockEnd')
longHandPhysical.add('marginBottom')
shorthandsOfLonghands.add('marginInline')
longHandLogical.add('marginInlineStart')
longHandPhysical.add('marginLeft')
longHandLogical.add('marginInlineEnd')
longHandPhysical.add('marginRight')

longHandLogical.add('marginTrim')

shorthandsOfLonghands.add('overscrollBehavior')
longHandLogical.add('overscrollBehaviorBlock')
longHandPhysical.add('overscrollBehaviorY')
longHandLogical.add('overscrollBehaviorInline')
longHandPhysical.add('overscrollBehaviorX')

shorthandsOfShorthands.add('padding')
shorthandsOfLonghands.add('paddingBlock')
longHandLogical.add('paddingBlockStart')
longHandPhysical.add('paddingTop')
longHandLogical.add('paddingBlockEnd')
longHandPhysical.add('paddingBottom')
shorthandsOfLonghands.add('paddingInline')
longHandLogical.add('paddingInlineStart')
longHandPhysical.add('paddingLeft')
longHandLogical.add('paddingInlineEnd')
longHandPhysical.add('paddingRight')

longHandLogical.add('visibility')

// CSS Color
longHandLogical.add('color')
longHandLogical.add('colorScheme')
longHandLogical.add('forcedColorAdjust')
longHandLogical.add('opacity')
longHandLogical.add('printColorAdjust')

// CSS Columns
shorthandsOfLonghands.add('columns')
longHandLogical.add('columnCount')
longHandLogical.add('columnWidth')

longHandLogical.add('columnFill')
longHandLogical.add('columnSpan')

shorthandsOfLonghands.add('columnRule')
longHandLogical.add('columnRuleColor')
longHandLogical.add('columnRuleStyle')
longHandLogical.add('columnRuleWidth')

// CSS Containment
longHandLogical.add('contain')

shorthandsOfLonghands.add('containIntrinsicSize')
longHandLogical.add('containIntrinsicBlockSize')
longHandLogical.add('containIntrinsicWidth')
longHandLogical.add('containIntrinsicHeight')
longHandLogical.add('containIntrinsicInlineSize')

shorthandsOfLonghands.add('container')
longHandLogical.add('containerName')
longHandLogical.add('containerType')

longHandLogical.add('contentVisibility')

// CSS Counter Styles
longHandLogical.add('counterIncrement')
longHandLogical.add('counterReset')
longHandLogical.add('counterSet')

// CSS Display
longHandLogical.add('display')

// CSS Flexible Box Layout
shorthandsOfLonghands.add('flex')
longHandLogical.add('flexBasis')
longHandLogical.add('flexGrow')
longHandLogical.add('flexShrink')

shorthandsOfLonghands.add('flexFlow')
longHandLogical.add('flexDirection')
longHandLogical.add('flexWrap')

longHandLogical.add('order')

// CSS Fonts
shorthandsOfShorthands.add('font')
longHandLogical.add('fontFamily')
longHandLogical.add('fontSize')
longHandLogical.add('fontStretch')
longHandLogical.add('fontStyle')
longHandLogical.add('fontWeight')
longHandLogical.add('lineHeight')
shorthandsOfLonghands.add('fontVariant')
longHandLogical.add('fontVariantAlternates')
longHandLogical.add('fontVariantCaps')
longHandLogical.add('fontVariantEastAsian')
longHandLogical.add('fontVariantEmoji')
longHandLogical.add('fontVariantLigatures')
longHandLogical.add('fontVariantNumeric')
longHandLogical.add('fontVariantPosition')

longHandLogical.add('fontFeatureSettings')
longHandLogical.add('fontKerning')
longHandLogical.add('fontLanguageOverride')
longHandLogical.add('fontOpticalSizing')
longHandLogical.add('fontPalette')
longHandLogical.add('fontVariationSettings')
longHandLogical.add('fontSizeAdjust')
longHandLogical.add('fontSmooth') // Non-standard
longHandLogical.add('fontSynthesisPosition')
longHandLogical.add('fontSynthesisSmallCaps')
longHandLogical.add('fontSynthesisStyle')
longHandLogical.add('fontSynthesisWeight')
shorthandsOfLonghands.add('fontSynthesis')

longHandLogical.add('lineHeightStep')

// CSS Fragmentation
longHandLogical.add('boxDecorationBreak')
longHandLogical.add('breakAfter')
longHandLogical.add('breakBefore')
longHandLogical.add('breakInside')
longHandLogical.add('orphans')
longHandLogical.add('widows')

// CSS Generated Content
longHandLogical.add('content')
longHandLogical.add('quotes')

// CSS Grid Layout
shorthandsOfShorthands.add('grid')
longHandLogical.add('gridAutoFlow')
longHandLogical.add('gridAutoRows')
longHandLogical.add('gridAutoColumns')
shorthandsOfShorthands.add('gridTemplate')
shorthandsOfLonghands.add('gridTemplateAreas')
longHandLogical.add('gridTemplateColumns')
longHandLogical.add('gridTemplateRows')

shorthandsOfShorthands.add('gridArea')
shorthandsOfLonghands.add('gridRow')
longHandLogical.add('gridRowStart')
longHandLogical.add('gridRowEnd')
shorthandsOfLonghands.add('gridColumn')
longHandLogical.add('gridColumnStart')
longHandLogical.add('gridColumnEnd')

longHandLogical.add('alignTracks')
longHandLogical.add('justifyTracks')
longHandLogical.add('masonryAutoFlow')

// CSS Images
longHandLogical.add('imageOrientation')
longHandLogical.add('imageRendering')
longHandLogical.add('imageResolution')
longHandLogical.add('objectFit')
longHandLogical.add('objectPosition')

// CSS Inline
longHandLogical.add('initialLetter')
longHandLogical.add('initialLetterAlign')

// CSS Lists and Counters
shorthandsOfLonghands.add('listStyle')
longHandLogical.add('listStyleImage')
longHandLogical.add('listStylePosition')
longHandLogical.add('listStyleType')

// CSS Masking
longHandLogical.add('clip') // @deprecated
longHandLogical.add('clipPath')

shorthandsOfLonghands.add('mask')
longHandLogical.add('maskClip')
longHandLogical.add('maskComposite')
longHandLogical.add('maskImage')
longHandLogical.add('maskMode')
longHandLogical.add('maskOrigin')
longHandLogical.add('maskPosition')
longHandLogical.add('maskRepeat')
longHandLogical.add('maskSize')

longHandLogical.add('maskType')

shorthandsOfLonghands.add('maskBorder')
longHandLogical.add('maskBorderMode')
longHandLogical.add('maskBorderOutset')
longHandLogical.add('maskBorderRepeat')
longHandLogical.add('maskBorderSlice')
longHandLogical.add('maskBorderSource')
longHandLogical.add('maskBorderWidth')

// CSS Miscellaneous
shorthandsOfShorthands.add('all') // avoid!
longHandLogical.add('textRendering')
longHandLogical.add('zoom')

// CSS Motion Path
shorthandsOfLonghands.add('offset')
longHandLogical.add('offsetAnchor')
longHandLogical.add('offsetDistance')
longHandLogical.add('offsetPath')
longHandLogical.add('offsetPosition')
longHandLogical.add('offsetRotate')

// CSS Overflow
longHandLogical.add('WebkitBoxOrient')
longHandLogical.add('WebkitLineClamp')
longHandPhysical.add('lineClamp')
longHandPhysical.add('maxLines')
longHandLogical.add('blockOverflow')

shorthandsOfLonghands.add('overflow')
longHandLogical.add('overflowBlock')
longHandPhysical.add('overflowY')
longHandLogical.add('overflowInline')
longHandPhysical.add('overflowX')

longHandLogical.add('overflowClipMargin')

longHandLogical.add('scrollGutter')
longHandLogical.add('scrollBehavior')

// CSS Pages
longHandLogical.add('page')
longHandLogical.add('pageBreakAfter')
longHandLogical.add('pageBreakBefore')
longHandLogical.add('pageBreakInside')

// CSS Positioning
shorthandsOfShorthands.add('inset')
shorthandsOfLonghands.add('insetBlock')
longHandLogical.add('insetBlockStart')
longHandPhysical.add('top')
longHandLogical.add('insetBlockEnd')
longHandPhysical.add('bottom')
shorthandsOfLonghands.add('insetInline')
longHandLogical.add('insetInlineStart')
longHandPhysical.add('left')
longHandLogical.add('insetInlineEnd')
longHandPhysical.add('right')

longHandLogical.add('clear')
longHandLogical.add('float')
longHandLogical.add('overlay')
longHandLogical.add('position')
longHandLogical.add('zIndex')

// CSS Ruby
longHandLogical.add('rubyAlign')
longHandLogical.add('rubyMerge')
longHandLogical.add('rubyPosition')

// CSS Scroll Anchoring
longHandLogical.add('overflowAnchor')

// CSS Scroll Snap
shorthandsOfShorthands.add('scrollMargin')
shorthandsOfLonghands.add('scrollMarginBlock')
longHandLogical.add('scrollMarginBlockStart')
longHandPhysical.add('scrollMarginTop')
longHandLogical.add('scrollMarginBlockEnd')
longHandPhysical.add('scrollMarginBottom')
shorthandsOfLonghands.add('scrollMarginInline')
longHandLogical.add('scrollMarginInlineStart')
longHandPhysical.add('scrollMarginLeft')
longHandLogical.add('scrollMarginInlineEnd')
longHandPhysical.add('scrollMarginRight')

shorthandsOfShorthands.add('scrollPadding')
shorthandsOfLonghands.add('scrollPaddingBlock')
longHandLogical.add('scrollPaddingBlockStart')
longHandPhysical.add('scrollPaddingTop')
longHandLogical.add('scrollPaddingBlockEnd')
longHandPhysical.add('scrollPaddingBottom')
shorthandsOfLonghands.add('scrollPaddingInline')
longHandLogical.add('scrollPaddingInlineStart')
longHandPhysical.add('scrollPaddingLeft')
longHandLogical.add('scrollPaddingInlineEnd')
longHandPhysical.add('scrollPaddingRight')

longHandLogical.add('scrollSnapAlign')
// longHandLogical.add('scrollSnapCoordinate');
// longHandLogical.add('scrollSnapDestination');
// longHandLogical.add('scrollSnapPointsX');
// longHandLogical.add('scrollSnapPointsY');
longHandLogical.add('scrollSnapStop')
shorthandsOfLonghands.add('scrollSnapType')
// longHandLogical.add('scrollSnapTypeX');
// longHandLogical.add('scrollSnapTypeY');

// CSS Scrollbars
longHandLogical.add('scrollbarColor')
longHandLogical.add('scrollbarWidth')

// CSS Shapes
longHandLogical.add('shapeImageThreshold')
longHandLogical.add('shapeMargin')
longHandLogical.add('shapeOutside')

// CSS Speech
longHandLogical.add('azimuth')

// CSS Table
longHandLogical.add('borderCollapse')
longHandLogical.add('borderSpacing')
longHandLogical.add('captionSide')
longHandLogical.add('emptyCells')
longHandLogical.add('tableLayout')
longHandLogical.add('verticalAlign')

// CSS Text Decoration
shorthandsOfLonghands.add('textDecoration')
longHandLogical.add('textDecorationColor')
longHandLogical.add('textDecorationLine')
longHandLogical.add('textDecorationSkip')
longHandLogical.add('textDecorationSkipInk')
longHandLogical.add('textDecorationStyle')
longHandLogical.add('textDecorationThickness')

shorthandsOfLonghands.add('WebkitTextStroke')
longHandLogical.add('WebkitTextStrokeColor')
longHandLogical.add('WebkitTextStrokeWidth')
longHandLogical.add('WebkitTextFillColor')

shorthandsOfLonghands.add('textEmphasis')
longHandLogical.add('textEmphasisColor')
longHandLogical.add('textEmphasisPosition')
longHandLogical.add('textEmphasisStyle')
longHandLogical.add('textShadow')
longHandLogical.add('textUnderlineOffset')
longHandLogical.add('textUnderlinePosition')

// CSS Text
longHandLogical.add('hangingPunctuation')
longHandLogical.add('hyphenateCharacter')
longHandLogical.add('hyphenateLimitChars')
longHandLogical.add('hyphens')
longHandLogical.add('letterSpacing')
longHandLogical.add('lineBreak')
longHandLogical.add('overflowWrap')
longHandLogical.add('paintOrder')
longHandLogical.add('tabSize')
longHandLogical.add('textAlign')
longHandLogical.add('textAlignLast')
longHandLogical.add('textIndent')
longHandLogical.add('textJustify')
longHandLogical.add('textSizeAdjust')
longHandLogical.add('textTransform')
shorthandsOfLonghands.add('textWrap')
longHandLogical.add('textWrapMode')
longHandLogical.add('textWrapStyle')
longHandLogical.add('whiteSpace')
longHandLogical.add('whiteSpaceCollapse')
longHandLogical.add('whiteSpaceTrim')
longHandLogical.add('wordBreak')
longHandLogical.add('wordSpacing')
longHandLogical.add('wordWrap')

// CSS Transforms
longHandLogical.add('backfaceVisibility')
longHandLogical.add('perspective')
longHandLogical.add('perspectiveOrigin')
longHandLogical.add('rotate')
longHandLogical.add('scale')
longHandLogical.add('transform')
longHandLogical.add('transformBox')
longHandLogical.add('transformOrigin')
longHandLogical.add('transformStyle')
longHandLogical.add('translate')

// CSS Transitions
shorthandsOfLonghands.add('transition')
longHandLogical.add('transitionBehavior')
longHandLogical.add('transitionDelay')
longHandLogical.add('transitionDuration')
longHandLogical.add('transitionProperty')
longHandLogical.add('transitionTimingFunction')

// CSS View Transitions
longHandLogical.add('viewTransitionName')

// CSS Will Change
longHandLogical.add('willChange')

// CSS Writing Modes
longHandLogical.add('direction')
longHandLogical.add('textCombineUpright')
longHandLogical.add('textOrientation')
longHandLogical.add('unicodeBidi')
longHandLogical.add('writingMode')

// CSS Filter Effects
longHandLogical.add('backdropFilter')
longHandLogical.add('filter')

// MathML
longHandLogical.add('mathDepth')
longHandLogical.add('mathShift')
longHandLogical.add('mathStyle')

// CSS Pointer Events
longHandLogical.add('touchAction')

export function getPropertyPriority(key: string): number {
  if (key === 'all') return 0
  if (key.startsWith('--')) return 1
  if (longHandPhysical.has(key)) return 4000
  if (longHandLogical.has(key)) return 3000
  if (shorthandsOfLonghands.has(key)) return 2000
  if (shorthandsOfShorthands.has(key)) return 1000
  return 3000
}
