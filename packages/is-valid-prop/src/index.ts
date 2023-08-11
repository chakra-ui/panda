const userGeneratedStr = ''
const userGenerated = userGeneratedStr.split(',')
const userGeneratedPrefixes = ''

const prefixes =
  'Webkit,accent,align,animation,aspect,backdrop,backface,background,block,border,box,break,caption,caret,clip,color,column,contain,container,content,counter,empty,flex,font,forced,grid,hanging,hyphenate,image,ime,initial,inline,input,inset,justify,letter,line,list,margin,mask,masonry,math,mix,object,offset,outline,overflow,overscroll,padding,paint,perspective,place,pointer,print,row,ruby,scrollbar,scroll,shape,tab,table,text,touch,transform,transition,unicode,user,vertical,view,white,word,writing'
const regexes = Array.from(prefixes.split(','))
  .concat(userGeneratedPrefixes.split(','))
  .map((prefix) => new RegExp('^' + prefix + '[A-Z][a-zA-Z]*'))
const cssPropertiesStr =
  'all,animation,appearance,azimuth,background,border,bottom,caret,clear,clip,color,columns,contain,container,content,cursor,direction,display,filter,flex,float,font,gap,grid,height,hyphens,inset,isolation,left,margin,mask,maxBlockSize,maxHeight,maxInlineSize,maxLines,maxWidth,minBlockSize,minHeight,minInlineSize,minWidth,offset,opacity,order,orphans,outline,overflow,padding,page,pageBreakAfter,pageBreakBefore,pageBreakInside,perspective,position,quotes,resize,right,rotate,scale,top,transform,transition,translate,visibility,widows,width,willChange,zIndex,zoom'

const allCssProperties = cssPropertiesStr.split(',').concat(userGenerated)
const properties = new Set(allCssProperties)

function memo<T>(fn: (value: string) => T): (value: string) => T {
  const cache = Object.create(null)
  return (arg: string) => {
    if (cache[arg] === undefined) cache[arg] = fn(arg)
    return cache[arg]
  }
}

const cssPropertySelectorRegex = /&|@/

const isCssProperty = /* @__PURE__ */ memo((prop: string) => {
  return (
    properties.has(prop) ||
    regexes.some((regex) => regex.test(prop)) ||
    prop.startsWith('--') ||
    cssPropertySelectorRegex.test(prop)
  )
})

export { isCssProperty, allCssProperties }
