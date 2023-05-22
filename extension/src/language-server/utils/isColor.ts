// borrow from https://github.com/princejwesley/is-css-color/blob/master/index.js
'use strict'

// every string I match against are lowercase
const HEX_PATTERN = /^#(?:[a-f0-9]{3})?(?:[a-f0-9]{3})$/

// css color names + initial + inherit + currentColor + transparent
const CSS_COLOR_NAMES = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'currentColor',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'inherit',
  'initial',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'transparent',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen'
]

const PREFIX = '^(rgb|hsl)(a?)\\s*\\('
const VALUE = '\\s*([-+]?\\d+%?)\\s*'
const ALPHA = '(?:,\\s*([-+]?(?:(?:\\d+(?:.\\d+)?)|(?:.\\d+))\\s*))?'
const SUFFIX = '\\)$'
const RGB_HSL_PATTERN = new RegExp(PREFIX + VALUE + ',' + VALUE + ',' + VALUE + ALPHA + SUFFIX)

const NUM_TYPE = 1
const PERCENTAGE_TYPE = 2
const ERROR_TYPE = NUM_TYPE & PERCENTAGE_TYPE

const isColor = (str: string) => {
  function getColorType (token: string) {
    return token.includes('%') ? PERCENTAGE_TYPE : NUM_TYPE
  }

  if (!str || typeof str !== 'string') {
    return false
  }

  const color = str.replace(/^\s+|\s+$/g, '').toLocaleLowerCase()

  // named colors or hex code
  if ((CSS_COLOR_NAMES.includes(color)) || HEX_PATTERN.test(color)) {
    return true
  }

  const result = color.match(RGB_HSL_PATTERN)
  if (result) {
    const flavor = result[1]
    const alpha = result[2]
    const rh = result[3]
    const gs = result[4]
    const bl = result[5]
    const a = result[6]

    // alpha test
    if ((alpha === 'a' && !a) || (a && alpha === '')) {
      return false
    }

    // hsl
    if (flavor === 'hsl') {
      if (getColorType(rh) !== NUM_TYPE) {
        return false
      }
      return (getColorType(gs) & getColorType(bl)) === PERCENTAGE_TYPE
    }

    // rgb
    return (getColorType(rh) & getColorType(gs) & getColorType(bl)) !== ERROR_TYPE
  }

  return false
}

export default isColor
