import { createCss, withoutSpace, compact } from '../helpers.mjs';

const createRecipe = (name, defaultVariants) => {
  return (variants) => {
   const transform = (prop, value) => {
      if (value === '__ignore__') {
        return { className: name }
      }

      value = withoutSpace(value)
      return { className: `${name}--${prop}_${value}` }
   }
   
   const context = {
     hash: false,
     utility: {
       prefix: undefined,
       transform,
     }
   }
   
   const css = createCss(context)
   
   return css({
     [name]: '__ignore__',
     ...defaultVariants,
     ...compact(variants)
   })
  }
}