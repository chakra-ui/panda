import { memo } from '../helpers.mjs'
// src/index.ts
var userGeneratedStr =
  'css,pos,end,start,p,pl,pr,pt,pb,py,px,pe,ps,ml,mr,mt,mb,m,my,mx,me,ms,ring,w,h,bgPosition,bgPositionX,bgPositionY,bgAttachment,bgClip,bg,bgColor,bgOrigin,bgImage,bgRepeat,bgBlendMode,bgSize,bgGradient,rounded,shadow,x,y,zIndex,position,top,left,inset,right,bottom,float,visibility,display,flex,gap,padding,margin,outline,width,height,color,truncate,background,border,opacity,filter,brightness,contrast,grayscale,invert,saturate,sepia,blur,transition,animation,scale,translate,scrollbar,fill,stroke,srOnly,debug,appearance,hyphens,mask,_hover,_focus,_focusWithin,_focusVisible,_disabled,_active,_visited,_target,_readOnly,_readWrite,_empty,_checked,_enabled,_expanded,_highlighted,_before,_after,_firstLetter,_firstLine,_marker,_selection,_file,_backdrop,_first,_last,_only,_even,_odd,_firstOfType,_lastOfType,_onlyOfType,_peerFocus,_peerHover,_peerActive,_peerFocusWithin,_peerFocusVisible,_peerDisabled,_peerChecked,_peerInvalid,_peerExpanded,_peerPlaceholderShown,_groupFocus,_groupHover,_groupActive,_groupFocusWithin,_groupFocusVisible,_groupDisabled,_groupChecked,_groupExpanded,_groupInvalid,_indeterminate,_required,_valid,_invalid,_autofill,_inRange,_outOfRange,_placeholder,_placeholderShown,_pressed,_selected,_default,_optional,_open,_fullscreen,_loading,_currentPage,_currentStep,_motionReduce,_motionSafe,_print,_landscape,_portrait,_dark,_light,_osDark,_osLight,_highContrast,_lessContrast,_moreContrast,_ltr,_rtl,_scrollbar,_scrollbarThumb,_scrollbarTrack,_horizontal,_vertical,sm,smOnly,smDown,md,mdOnly,mdDown,lg,lgOnly,lgDown,xl,xlOnly,xlDown,2xl,2xlOnly,smToMd,smToLg,smToXl,smTo2xl,mdToLg,mdToXl,mdTo2xl,lgToXl,lgTo2xl,xlTo2xl'
var userGenerated = userGeneratedStr.split(',')
var userGeneratedPrefixes =
  'inset,flex,padding,margin,ring,min,max,rounded,border,shadow,aspect,box,object,overscroll,hide,grid,row,column,justify,align,outline,divide,inline,block,font,letter,line,text,vertical,word,list,background,gradient,mix,hue,drop,backdrop,table,transition,animation,transform,scale,translate,accent,caret,scroll,touch,user,backface,clip,mask,color'
var prefixes =
  'Webkit,accent,align,animation,aspect,backdrop,backface,background,block,border,box,break,caption,caret,clip,color,column,contain,container,content,counter,empty,flex,font,forced,grid,hanging,hyphenate,image,ime,initial,inline,input,inset,justify,letter,line,list,margin,mask,masonry,math,mix,object,offset,outline,overflow,overscroll,padding,paint,perspective,place,pointer,print,row,ruby,scrollbar,scroll,shape,tab,table,text,touch,transform,transition,unicode,user,vertical,view,white,word,writing'
var regexes = Array.from(prefixes.split(','))
  .concat(userGeneratedPrefixes.split(','))
  .map((prefix) => new RegExp('^' + prefix + '[A-Z][a-zA-Z]*'))
var cssPropertiesStr =
  'all,animation,appearance,azimuth,background,border,bottom,caret,clear,clip,color,columns,contain,container,content,cursor,direction,display,filter,flex,float,font,gap,grid,height,hyphens,inset,isolation,left,margin,mask,maxBlockSize,maxHeight,maxInlineSize,maxLines,maxWidth,minBlockSize,minHeight,minInlineSize,minWidth,offset,opacity,order,orphans,outline,overflow,padding,page,pageBreakAfter,pageBreakBefore,pageBreakInside,perspective,position,quotes,resize,right,rotate,scale,top,transform,transition,translate,visibility,widows,width,willChange,zIndex,zoom'
var allCssProperties = cssPropertiesStr.split(',').concat(userGenerated)
var properties = new Set(allCssProperties)
var cssPropertySelectorRegex = /&|@/
var isCssProperty = /* @__PURE__ */ memo((prop) => {
  return (
    properties.has(prop) ||
    regexes.some((regex) => regex.test(prop)) ||
    prop.startsWith('--') ||
    cssPropertySelectorRegex.test(prop)
  )
})
export { allCssProperties, isCssProperty }
