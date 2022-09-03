import { createCss } from "../css/serializer"

export const textStyle = (styles) => {

 const transform = (prop, value) => {
    if (value === '__ignore__') {
      return { className: "textStyle" }
    }

    value = value.toString().replaceAll(" ", "_")
    return { className: `textStyle__${prop}-${value}` }
 }
 
 const context = { transform }
 const css = createCss(context)
 
 return css({ textStyle: '__ignore__' , ...styles })
}