/** Taken from https://github.com/frenic/csstype/blob/46694defae2cf3386218d0000490b0d0ac385aa6/src/data/svg.ts */
import './mdn-data.d.ts'

// This is originated from https://svgwg.org/svg2-draft/propidx.html to add SVG specific properties
// and is a temporarily solution until https://github.com/mdn/data/issues/59 is solved
import * as styleProperties from 'mdn-data/css/properties.json'

export const properties: { [property: string]: Pick<MDN.Property, 'syntax' | 'initial' | 'inherited' | 'media'> } = {
  'alignment-baseline': {
    syntax:
      'auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical',
    initial: 'see property description',
    inherited: false,
    media: 'visual',
  },
  'baseline-shift': {
    syntax: 'baseline | sub | super | <percentage> | <length>',
    initial: 'baseline',
    inherited: false,
    media: 'visual',
  },
  clip: styleProperties.clip,
  'clip-path': styleProperties['clip-path'],
  'clip-rule': {
    syntax: 'nonzero | evenodd',
    initial: 'nonzero',
    inherited: true,
    media: 'visual',
  },
  color: styleProperties.color,
  'color-interpolation': {
    syntax: 'auto | sRGB | linearRGB',
    initial: 'sRGB',
    inherited: true,
    media: 'visual',
  },
  'color-rendering': {
    syntax: 'auto | optimizeSpeed | optimizeQuality',
    initial: 'auto',
    inherited: true,
    media: 'visual',
  },
  cursor: styleProperties.cursor,
  direction: styleProperties.direction,
  display: styleProperties.display,
  'dominant-baseline': {
    syntax:
      'auto | use-script | no-change | reset-size | ideographic | alphabetic | hanging | mathematical | central | middle | text-after-edge | text-before-edge',
    initial: 'auto',
    inherited: false,
    media: 'visual',
  },
  fill: {
    syntax: '<paint>',
    initial: 'black',
    inherited: true,
    media: 'visual',
  },
  'fill-opacity': {
    syntax: '<number>',
    initial: '1',
    inherited: true,
    media: 'visual',
  },
  'fill-rule': {
    syntax: 'nonzero | evenodd',
    initial: 'nonzero',
    inherited: true,
    media: 'visual',
  },
  filter: styleProperties.filter,
  'flood-color': {
    syntax: 'currentColor | <color>',
    initial: 'black',
    inherited: false,
    media: 'visual',
  },
  'flood-opacity': {
    syntax: '<number>',
    initial: '1',
    inherited: false,
    media: 'visual',
  },
  font: styleProperties.font,
  'font-family': styleProperties['font-family'],
  'font-size': styleProperties['font-size'],
  'font-size-adjust': styleProperties['font-size-adjust'],
  'font-stretch': styleProperties['font-stretch'],
  'font-style': styleProperties['font-style'],
  'font-variant': styleProperties['font-variant'],
  'font-weight': styleProperties['font-weight'],
  'glyph-orientation-vertical': {
    syntax: 'auto | <angle> | <number>',
    initial: 'auto',
    inherited: true,
    media: 'visual',
  },
  'image-rendering': styleProperties['image-rendering'],
  'letter-spacing': styleProperties['letter-spacing'],
  'lighting-color': {
    syntax: 'currentColor | <color>',
    initial: 'white',
    inherited: false,
    media: 'visual',
  },
  'line-height': styleProperties['line-height'],
  marker: {
    syntax: 'none | <url>',
    initial: 'none | <url>',
    inherited: true,
    media: 'visual',
  },
  'marker-end': {
    syntax: 'none | <url>',
    initial: 'none',
    inherited: true,
    media: 'visual',
  },
  'marker-mid': {
    syntax: 'none | <url>',
    initial: 'none',
    inherited: true,
    media: 'visual',
  },
  'marker-start': {
    syntax: 'none | <url>',
    initial: 'none',
    inherited: true,
    media: 'visual',
  },
  mask: styleProperties.mask,
  opacity: styleProperties.opacity,
  overflow: styleProperties.overflow,
  'paint-order': styleProperties['paint-order'],
  'pointer-events': styleProperties['pointer-events'],
  'shape-rendering': {
    syntax: 'auto | optimizeSpeed | crispEdges | geometricPrecision',
    initial: 'auto',
    inherited: true,
    media: 'visual',
  },
  'stop-color': {
    syntax: 'currentColor | <color>',
    initial: 'black',
    inherited: false,
    media: 'visual',
  },
  'stop-opacity': {
    syntax: '<number>',
    initial: '1',
    inherited: false,
    media: 'visual',
  },
  stroke: {
    syntax: '<paint>',
    initial: 'none',
    inherited: true,
    media: 'visual',
  },
  'stroke-dasharray': {
    syntax: 'none | <dasharray>',
    initial: 'none',
    inherited: true,
    media: 'visual',
  },
  'stroke-dashoffset': {
    syntax: '<percentage> | <length>',
    initial: '0',
    inherited: true,
    media: 'visual',
  },
  'stroke-linecap': {
    syntax: 'butt | round | square',
    initial: 'butt',
    inherited: true,
    media: 'visual',
  },
  'stroke-linejoin': {
    syntax: 'miter | round | bevel',
    initial: 'miter',
    inherited: true,
    media: 'visual',
  },
  'stroke-miterlimit': {
    syntax: '<number>',
    initial: '4',
    inherited: true,
    media: 'visual',
  },
  'stroke-opacity': {
    syntax: '<number>',
    initial: '1',
    inherited: true,
    media: 'visual',
  },
  'stroke-width': {
    syntax: '<percentage> | <length>',
    initial: '1',
    inherited: true,
    media: 'visual',
  },
  'text-anchor': {
    syntax: 'start | middle | end',
    initial: 'start',
    inherited: true,
    media: 'visual',
  },
  'text-decoration': styleProperties['text-decoration'],
  'text-rendering': styleProperties['text-rendering'],
  'unicode-bidi': styleProperties['unicode-bidi'],
  'vector-effect': {
    syntax: 'non-scaling-stroke | none',
    initial: 'none',
    inherited: false,
    media: 'visual',
  },
  visibility: styleProperties.visibility,
  'word-spacing': styleProperties['word-spacing'],
  'white-space': styleProperties['white-space'],
  'writing-mode': styleProperties['writing-mode'],
}

export const syntaxes: MDN.Syntaxes = {
  paint: {
    syntax: 'none | child | child(<integer>) | <color> | <url> [ none | <color> ]? | context-fill | context-stroke',
  },
  dasharray: {
    syntax: '[ <length> | <percentage> | <number> ]#',
  },
}
