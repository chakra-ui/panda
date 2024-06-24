import { createContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { generateCssFn } from '../src/artifacts/js/css-fn'

describe('generate css-fn', () => {
  test('basic', () => {
    expect(generateCssFn(createContext())).toMatchInlineSnapshot(`
      {
        "dts": "import type { SystemStyleObject } from '../types/index';

      type Styles = SystemStyleObject | undefined | null | false

      interface CssRawFunction {
        (styles: Styles): SystemStyleObject
        (styles: Styles[]): SystemStyleObject
        (...styles: Array<Styles | Styles[]>): SystemStyleObject
        (styles: Styles): SystemStyleObject
      }

      interface CssFunction {
        (styles: Styles): string
        (styles: Styles[]): string
        (...styles: Array<Styles | Styles[]>): string
        (styles: Styles): string

        raw: CssRawFunction
      }

      export declare const css: CssFunction;",
        "js": "import { createCss, createMergeCss, hypenateProperty, withoutSpace } from '../helpers.mjs';
      import { sortConditions, finalizeConditions } from './conditions.mjs';

      const utilities = "aspectRatio:aspect,boxDecorationBreak:decoration,zIndex:z,boxSizing:box,objectPosition:obj-pos,objectFit:obj-fit,overscrollBehavior:overscroll,overscrollBehaviorX:overscroll-x,overscrollBehaviorY:overscroll-y,position:pos/1,top:top,left:left,insetInline:inset-x/insetX,insetBlock:inset-y/insetY,inset:inset,insetBlockEnd:inset-b,insetBlockStart:inset-t,insetInlineEnd:end/insetEnd/1,insetInlineStart:start/insetStart/1,right:right,bottom:bottom,float:float,visibility:vis,display:d,hideFrom:hide,hideBelow:show,flexBasis:basis,flex:flex,flexDirection:flex-dir/flexDir,flexGrow:grow,flexShrink:shrink,gridTemplateColumns:grid-cols,gridTemplateRows:grid-rows,gridColumn:col-span,gridRow:row-span,gridColumnStart:col-start,gridColumnEnd:col-end,gridAutoFlow:grid-flow,gridAutoColumns:auto-cols,gridAutoRows:auto-rows,gap:gap,gridGap:grid-gap,gridRowGap:grid-gap-x,gridColumnGap:grid-gap-y,rowGap:gap-x,columnGap:gap-y,justifyContent:justify,alignContent:content,alignItems:items,alignSelf:self,padding:p/1,paddingLeft:pl/1,paddingRight:pr/1,paddingTop:pt/1,paddingBottom:pb/1,paddingBlock:py/1/paddingY,paddingBlockEnd:pbe,paddingBlockStart:p-bs,paddingInline:px/paddingX/1,paddingInlineEnd:pe/1/paddingEnd,paddingInlineStart:ps/1/paddingStart,marginLeft:ml/1,marginRight:mr/1,marginTop:mt/1,marginBottom:mb/1,margin:m/1,marginBlock:my/1/marginY,marginBlockEnd:mbe,marginBlockStart:mts,marginInline:mx/1/marginX,marginInlineEnd:me/1/marginEnd,marginInlineStart:ms/1/marginStart,spaceX:space-x,spaceY:space-y,outlineWidth:ring-width/ringWidth,outlineColor:ring-color/ringColor,outline:ring/1,outlineOffset:ring-offset/ringOffset,divideX:divide-x,divideY:divide-y,divideColor:divide-color,divideStyle:divide-style,width:w/1,inlineSize:w-is,minWidth:min-w/minW,minInlineSize:min-w-is,maxWidth:max-w/maxW,maxInlineSize:max-w-is,height:h/1,blockSize:h-bs,minHeight:min-h/minH,minBlockSize:min-h-bs,maxHeight:max-h/maxH,maxBlockSize:max-b,color:text,fontFamily:font,fontSize:fs,fontWeight:fw,fontSmoothing:smoothing,fontVariantNumeric:numeric,letterSpacing:tracking,lineHeight:leading,textAlign:text-align,textDecoration:text-decor,textDecorationColor:text-decor-color,textEmphasisColor:text-emphasis-color,textDecorationStyle:decoration-style,textDecorationThickness:decoration-thickness,textUnderlineOffset:underline-offset,textTransform:text-transform,textIndent:indent,textShadow:text-shadow,textShadowColor:text-shadow-color/textShadowColor,textOverflow:text-overflow,verticalAlign:v-align,wordBreak:break,textWrap:text-wrap,truncate:truncate,lineClamp:clamp,listStyleType:list-type,listStylePosition:list-pos,listStyleImage:list-img,backgroundPosition:bg-pos/bgPosition,backgroundPositionX:bg-pos-x/bgPositionX,backgroundPositionY:bg-pos-y/bgPositionY,backgroundAttachment:bg-attach/bgAttachment,backgroundClip:bg-clip/bgClip,background:bg/1,backgroundColor:bg-color/bgColor,backgroundOrigin:bg-origin/bgOrigin,backgroundImage:bg-img/bgImage,backgroundRepeat:bg-repeat/bgRepeat,backgroundBlendMode:bg-blend/bgBlendMode,backgroundSize:bg-size/bgSize,backgroundGradient:bg-gradient/bgGradient,textGradient:text-gradient,gradientFromPosition:gradient-from-pos,gradientToPosition:gradient-to-pos,gradientFrom:gradient-from,gradientTo:gradient-to,gradientVia:gradient-via,gradientViaPosition:gradient-via-pos,borderRadius:rounded/1,borderTopLeftRadius:rounded-tl/roundedTopLeft,borderTopRightRadius:rounded-tr/roundedTopRight,borderBottomRightRadius:rounded-br/roundedBottomRight,borderBottomLeftRadius:rounded-bl/roundedBottomLeft,borderTopRadius:rounded-t/roundedTop,borderRightRadius:rounded-r/roundedRight,borderBottomRadius:rounded-b/roundedBottom,borderLeftRadius:rounded-l/roundedLeft,borderStartStartRadius:rounded-ss/roundedStartStart,borderStartEndRadius:rounded-se/roundedStartEnd,borderStartRadius:rounded-s/roundedStart,borderEndStartRadius:rounded-es/roundedEndStart,borderEndEndRadius:rounded-ee/roundedEndEnd,borderEndRadius:rounded-e/roundedEnd,border:border,borderWidth:border-w,borderTopWidth:border-tw,borderLeftWidth:border-lw,borderRightWidth:border-rw,borderBottomWidth:border-bw,borderColor:border-color,borderInline:border-x/borderX,borderInlineWidth:border-xw/borderXWidth,borderInlineColor:border-xc/borderXColor,borderBlock:border-y/borderY,borderBlockWidth:border-yw/borderYWidth,borderBlockColor:border-yc/borderYColor,borderLeft:border-l,borderLeftColor:border-lc,borderInlineStart:border-s/borderStart,borderInlineStartWidth:border-sw/borderStartWidth,borderInlineStartColor:border-sc/borderStartColor,borderRight:border-r,borderRightColor:border-rc,borderInlineEnd:border-e/borderEnd,borderInlineEndWidth:border-ew/borderEndWidth,borderInlineEndColor:border-ec/borderEndColor,borderTop:border-t,borderTopColor:border-tc,borderBottom:border-b,borderBottomColor:border-bc,borderBlockEnd:border-be,borderBlockEndColor:border-bec,borderBlockStart:border-bs,borderBlockStartColor:border-bsc,opacity:opacity,boxShadow:shadow/1,boxShadowColor:shadow-color/shadowColor,mixBlendMode:mix-blend,filter:filter,brightness:brightness,contrast:contrast,grayscale:grayscale,hueRotate:hue-rotate,invert:invert,saturate:saturate,sepia:sepia,dropShadow:drop-shadow,blur:blur,backdropFilter:backdrop,backdropBlur:backdrop-blur,backdropBrightness:backdrop-brightness,backdropContrast:backdrop-contrast,backdropGrayscale:backdrop-grayscale,backdropHueRotate:backdrop-hue-rotate,backdropInvert:backdrop-invert,backdropOpacity:backdrop-opacity,backdropSaturate:backdrop-saturate,backdropSepia:backdrop-sepia,borderCollapse:border-collapse,borderSpacing:border-spacing,borderSpacingX:border-spacing-x,borderSpacingY:border-spacing-y,tableLayout:table,transitionTimingFunction:ease,transitionDelay:delay,transitionDuration:duration,transitionProperty:transition-prop,transition:transition,animation:animation,animationName:animation-name,animationTimingFunction:animation-ease,animationDuration:animation-duration,animationDelay:animation-delay,transformOrigin:origin,rotate:rotate,rotateX:rotate-x,rotateY:rotate-y,rotateZ:rotate-z,scale:scale,scaleX:scale-x,scaleY:scale-y,translate:translate,translateX:translate-x/x,translateY:translate-y/y,translateZ:translate-z/z,accentColor:accent,caretColor:caret,scrollBehavior:scroll,scrollbar:scrollbar,scrollMargin:scroll-m,scrollMarginLeft:scroll-ml,scrollMarginRight:scroll-mr,scrollMarginTop:scroll-mt,scrollMarginBottom:scroll-mb,scrollMarginBlock:scroll-my/scrollMarginY,scrollMarginBlockEnd:scroll-mbe,scrollMarginBlockStart:scroll-mbt,scrollMarginInline:scroll-mx/scrollMarginX,scrollMarginInlineEnd:scroll-me,scrollMarginInlineStart:scroll-ms,scrollPadding:scroll-p,scrollPaddingBlock:scroll-pb/scrollPaddingY,scrollPaddingBlockStart:scroll-pbs,scrollPaddingBlockEnd:scroll-pbe,scrollPaddingInline:scroll-px/scrollPaddingX,scrollPaddingInlineEnd:scroll-pe,scrollPaddingInlineStart:scroll-ps,scrollPaddingLeft:scroll-pl,scrollPaddingRight:scroll-pr,scrollPaddingTop:scroll-pt,scrollPaddingBottom:scroll-pbo,scrollSnapAlign:snap-align,scrollSnapStop:snap-stop,scrollSnapType:snap-type,scrollSnapStrictness:snap-strictness,scrollSnapMargin:snap-m,scrollSnapMarginTop:snap-mt,scrollSnapMarginBottom:snap-mb,scrollSnapMarginLeft:snap-ml,scrollSnapMarginRight:snap-mr,touchAction:touch,userSelect:select,fill:fill,stroke:stroke,strokeWidth:stroke-w,srOnly:sr,debug:debug,appearance:appearance,backfaceVisibility:backface,clipPath:clip-path,hyphens:hyphens,mask:mask,maskImage:mask-image,maskSize:mask-size,textSizeAdjust:text-adjust,container:cq,containerName:cq-name,containerType:cq-type,textStyle:textStyle"

      const classNameByProp = new Map()
      const shorthands = new Map()
      utilities.split(',').forEach((utility) => {
        const [prop, meta] = utility.split(':')
        const [className, ...shorthandList] = meta.split('/')
        classNameByProp.set(prop, className)
        if (shorthandList.length) {
          shorthandList.forEach((shorthand) => {
            shorthands.set(shorthand === '1' ? className : shorthand, prop)
          })
        }
      })

      const resolveShorthand = (prop) => shorthands.get(prop) || prop

      const context = {
        
        conditions: {
          shift: sortConditions,
          finalize: finalizeConditions,
          breakpoints: { keys: ["base","sm","md","lg","xl","2xl"] }
        },
        utility: {
          
          transform: (prop, value) => {
                    const key = resolveShorthand(prop)
                    const propKey = classNameByProp.get(key) || hypenateProperty(key)
                    return { className: \`\${propKey}_\${withoutSpace(value)}\` }
                  },
          hasShorthand: true,
          toHash: (path, hashFn) => hashFn(path.join(":")),
          resolveShorthand: resolveShorthand,
        }
      }

      const cssFn = createCss(context)
      export const css = (...styles) => cssFn(mergeCss(...styles))
      css.raw = (...styles) => mergeCss(...styles)

      export const { mergeCss, assignCss } = createMergeCss(context)",
      }
    `)
  })

  test('basic', () => {
    expect(
      generateCssFn(
        createContext({
          hooks: {
            'utility:created': ({ configure }) => {
              configure({
                toHash(paths, toHash) {
                  const stringConds = paths.join(':')
                  const splitConds = stringConds.split('_')
                  const hashConds = splitConds.map(toHash)
                  return hashConds.join('_')
                },
              })
            },
          },
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "dts": "import type { SystemStyleObject } from '../types/index';

      type Styles = SystemStyleObject | undefined | null | false

      interface CssRawFunction {
        (styles: Styles): SystemStyleObject
        (styles: Styles[]): SystemStyleObject
        (...styles: Array<Styles | Styles[]>): SystemStyleObject
        (styles: Styles): SystemStyleObject
      }

      interface CssFunction {
        (styles: Styles): string
        (styles: Styles[]): string
        (...styles: Array<Styles | Styles[]>): string
        (styles: Styles): string

        raw: CssRawFunction
      }

      export declare const css: CssFunction;",
        "js": "import { createCss, createMergeCss, hypenateProperty, withoutSpace } from '../helpers.mjs';
      import { sortConditions, finalizeConditions } from './conditions.mjs';

      const utilities = "aspectRatio:aspect,boxDecorationBreak:decoration,zIndex:z,boxSizing:box,objectPosition:obj-pos,objectFit:obj-fit,overscrollBehavior:overscroll,overscrollBehaviorX:overscroll-x,overscrollBehaviorY:overscroll-y,position:pos/1,top:top,left:left,insetInline:inset-x/insetX,insetBlock:inset-y/insetY,inset:inset,insetBlockEnd:inset-b,insetBlockStart:inset-t,insetInlineEnd:end/insetEnd/1,insetInlineStart:start/insetStart/1,right:right,bottom:bottom,float:float,visibility:vis,display:d,hideFrom:hide,hideBelow:show,flexBasis:basis,flex:flex,flexDirection:flex-dir/flexDir,flexGrow:grow,flexShrink:shrink,gridTemplateColumns:grid-cols,gridTemplateRows:grid-rows,gridColumn:col-span,gridRow:row-span,gridColumnStart:col-start,gridColumnEnd:col-end,gridAutoFlow:grid-flow,gridAutoColumns:auto-cols,gridAutoRows:auto-rows,gap:gap,gridGap:grid-gap,gridRowGap:grid-gap-x,gridColumnGap:grid-gap-y,rowGap:gap-x,columnGap:gap-y,justifyContent:justify,alignContent:content,alignItems:items,alignSelf:self,padding:p/1,paddingLeft:pl/1,paddingRight:pr/1,paddingTop:pt/1,paddingBottom:pb/1,paddingBlock:py/1/paddingY,paddingBlockEnd:pbe,paddingBlockStart:p-bs,paddingInline:px/paddingX/1,paddingInlineEnd:pe/1/paddingEnd,paddingInlineStart:ps/1/paddingStart,marginLeft:ml/1,marginRight:mr/1,marginTop:mt/1,marginBottom:mb/1,margin:m/1,marginBlock:my/1/marginY,marginBlockEnd:mbe,marginBlockStart:mts,marginInline:mx/1/marginX,marginInlineEnd:me/1/marginEnd,marginInlineStart:ms/1/marginStart,spaceX:space-x,spaceY:space-y,outlineWidth:ring-width/ringWidth,outlineColor:ring-color/ringColor,outline:ring/1,outlineOffset:ring-offset/ringOffset,divideX:divide-x,divideY:divide-y,divideColor:divide-color,divideStyle:divide-style,width:w/1,inlineSize:w-is,minWidth:min-w/minW,minInlineSize:min-w-is,maxWidth:max-w/maxW,maxInlineSize:max-w-is,height:h/1,blockSize:h-bs,minHeight:min-h/minH,minBlockSize:min-h-bs,maxHeight:max-h/maxH,maxBlockSize:max-b,color:text,fontFamily:font,fontSize:fs,fontWeight:fw,fontSmoothing:smoothing,fontVariantNumeric:numeric,letterSpacing:tracking,lineHeight:leading,textAlign:text-align,textDecoration:text-decor,textDecorationColor:text-decor-color,textEmphasisColor:text-emphasis-color,textDecorationStyle:decoration-style,textDecorationThickness:decoration-thickness,textUnderlineOffset:underline-offset,textTransform:text-transform,textIndent:indent,textShadow:text-shadow,textShadowColor:text-shadow-color/textShadowColor,textOverflow:text-overflow,verticalAlign:v-align,wordBreak:break,textWrap:text-wrap,truncate:truncate,lineClamp:clamp,listStyleType:list-type,listStylePosition:list-pos,listStyleImage:list-img,backgroundPosition:bg-pos/bgPosition,backgroundPositionX:bg-pos-x/bgPositionX,backgroundPositionY:bg-pos-y/bgPositionY,backgroundAttachment:bg-attach/bgAttachment,backgroundClip:bg-clip/bgClip,background:bg/1,backgroundColor:bg-color/bgColor,backgroundOrigin:bg-origin/bgOrigin,backgroundImage:bg-img/bgImage,backgroundRepeat:bg-repeat/bgRepeat,backgroundBlendMode:bg-blend/bgBlendMode,backgroundSize:bg-size/bgSize,backgroundGradient:bg-gradient/bgGradient,textGradient:text-gradient,gradientFromPosition:gradient-from-pos,gradientToPosition:gradient-to-pos,gradientFrom:gradient-from,gradientTo:gradient-to,gradientVia:gradient-via,gradientViaPosition:gradient-via-pos,borderRadius:rounded/1,borderTopLeftRadius:rounded-tl/roundedTopLeft,borderTopRightRadius:rounded-tr/roundedTopRight,borderBottomRightRadius:rounded-br/roundedBottomRight,borderBottomLeftRadius:rounded-bl/roundedBottomLeft,borderTopRadius:rounded-t/roundedTop,borderRightRadius:rounded-r/roundedRight,borderBottomRadius:rounded-b/roundedBottom,borderLeftRadius:rounded-l/roundedLeft,borderStartStartRadius:rounded-ss/roundedStartStart,borderStartEndRadius:rounded-se/roundedStartEnd,borderStartRadius:rounded-s/roundedStart,borderEndStartRadius:rounded-es/roundedEndStart,borderEndEndRadius:rounded-ee/roundedEndEnd,borderEndRadius:rounded-e/roundedEnd,border:border,borderWidth:border-w,borderTopWidth:border-tw,borderLeftWidth:border-lw,borderRightWidth:border-rw,borderBottomWidth:border-bw,borderColor:border-color,borderInline:border-x/borderX,borderInlineWidth:border-xw/borderXWidth,borderInlineColor:border-xc/borderXColor,borderBlock:border-y/borderY,borderBlockWidth:border-yw/borderYWidth,borderBlockColor:border-yc/borderYColor,borderLeft:border-l,borderLeftColor:border-lc,borderInlineStart:border-s/borderStart,borderInlineStartWidth:border-sw/borderStartWidth,borderInlineStartColor:border-sc/borderStartColor,borderRight:border-r,borderRightColor:border-rc,borderInlineEnd:border-e/borderEnd,borderInlineEndWidth:border-ew/borderEndWidth,borderInlineEndColor:border-ec/borderEndColor,borderTop:border-t,borderTopColor:border-tc,borderBottom:border-b,borderBottomColor:border-bc,borderBlockEnd:border-be,borderBlockEndColor:border-bec,borderBlockStart:border-bs,borderBlockStartColor:border-bsc,opacity:opacity,boxShadow:shadow/1,boxShadowColor:shadow-color/shadowColor,mixBlendMode:mix-blend,filter:filter,brightness:brightness,contrast:contrast,grayscale:grayscale,hueRotate:hue-rotate,invert:invert,saturate:saturate,sepia:sepia,dropShadow:drop-shadow,blur:blur,backdropFilter:backdrop,backdropBlur:backdrop-blur,backdropBrightness:backdrop-brightness,backdropContrast:backdrop-contrast,backdropGrayscale:backdrop-grayscale,backdropHueRotate:backdrop-hue-rotate,backdropInvert:backdrop-invert,backdropOpacity:backdrop-opacity,backdropSaturate:backdrop-saturate,backdropSepia:backdrop-sepia,borderCollapse:border-collapse,borderSpacing:border-spacing,borderSpacingX:border-spacing-x,borderSpacingY:border-spacing-y,tableLayout:table,transitionTimingFunction:ease,transitionDelay:delay,transitionDuration:duration,transitionProperty:transition-prop,transition:transition,animation:animation,animationName:animation-name,animationTimingFunction:animation-ease,animationDuration:animation-duration,animationDelay:animation-delay,transformOrigin:origin,rotate:rotate,rotateX:rotate-x,rotateY:rotate-y,rotateZ:rotate-z,scale:scale,scaleX:scale-x,scaleY:scale-y,translate:translate,translateX:translate-x/x,translateY:translate-y/y,translateZ:translate-z/z,accentColor:accent,caretColor:caret,scrollBehavior:scroll,scrollbar:scrollbar,scrollMargin:scroll-m,scrollMarginLeft:scroll-ml,scrollMarginRight:scroll-mr,scrollMarginTop:scroll-mt,scrollMarginBottom:scroll-mb,scrollMarginBlock:scroll-my/scrollMarginY,scrollMarginBlockEnd:scroll-mbe,scrollMarginBlockStart:scroll-mbt,scrollMarginInline:scroll-mx/scrollMarginX,scrollMarginInlineEnd:scroll-me,scrollMarginInlineStart:scroll-ms,scrollPadding:scroll-p,scrollPaddingBlock:scroll-pb/scrollPaddingY,scrollPaddingBlockStart:scroll-pbs,scrollPaddingBlockEnd:scroll-pbe,scrollPaddingInline:scroll-px/scrollPaddingX,scrollPaddingInlineEnd:scroll-pe,scrollPaddingInlineStart:scroll-ps,scrollPaddingLeft:scroll-pl,scrollPaddingRight:scroll-pr,scrollPaddingTop:scroll-pt,scrollPaddingBottom:scroll-pbo,scrollSnapAlign:snap-align,scrollSnapStop:snap-stop,scrollSnapType:snap-type,scrollSnapStrictness:snap-strictness,scrollSnapMargin:snap-m,scrollSnapMarginTop:snap-mt,scrollSnapMarginBottom:snap-mb,scrollSnapMarginLeft:snap-ml,scrollSnapMarginRight:snap-mr,touchAction:touch,userSelect:select,fill:fill,stroke:stroke,strokeWidth:stroke-w,srOnly:sr,debug:debug,appearance:appearance,backfaceVisibility:backface,clipPath:clip-path,hyphens:hyphens,mask:mask,maskImage:mask-image,maskSize:mask-size,textSizeAdjust:text-adjust,container:cq,containerName:cq-name,containerType:cq-type,textStyle:textStyle"

      const classNameByProp = new Map()
      const shorthands = new Map()
      utilities.split(',').forEach((utility) => {
        const [prop, meta] = utility.split(':')
        const [className, ...shorthandList] = meta.split('/')
        classNameByProp.set(prop, className)
        if (shorthandList.length) {
          shorthandList.forEach((shorthand) => {
            shorthands.set(shorthand === '1' ? className : shorthand, prop)
          })
        }
      })

      const resolveShorthand = (prop) => shorthands.get(prop) || prop

      const context = {
        
        conditions: {
          shift: sortConditions,
          finalize: finalizeConditions,
          breakpoints: { keys: ["base","sm","md","lg","xl","2xl"] }
        },
        utility: {
          
          transform: (prop, value) => {
                    const key = resolveShorthand(prop)
                    const propKey = classNameByProp.get(key) || hypenateProperty(key)
                    return { className: \`\${propKey}_\${withoutSpace(value)}\` }
                  },
          hasShorthand: true,
          toHash: toHash(paths, toHash) {
                        const stringConds = paths.join(":");
                        const splitConds = stringConds.split("_");
                        const hashConds = splitConds.map(toHash);
                        return hashConds.join("_");
                      },
          resolveShorthand: resolveShorthand,
        }
      }

      const cssFn = createCss(context)
      export const css = (...styles) => cssFn(mergeCss(...styles))
      css.raw = (...styles) => mergeCss(...styles)

      export const { mergeCss, assignCss } = createMergeCss(context)",
      }
    `)
  })
})
