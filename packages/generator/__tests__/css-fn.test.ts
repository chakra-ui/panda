import { expect, test } from 'vitest'

const utilities =
  'aspectRatio:aspect,boxDecorationBreak:decoration,zIndex:z,boxSizing:box,objectPosition:object,objectFit:object,overscrollBehavior:overscroll,overscrollBehaviorX:overscroll-x,overscrollBehaviorY:overscroll-y,position:pos/1,top:top,left:left,insetInline:inset-x,insetBlock:inset-y,inset:inset,insetBlockEnd:inset-b,insetBlockStart:inset-t,insetInlineEnd:end/insetEnd/1,insetInlineStart:start/insetStart/1,right:right,bottom:bottom,insetX:inset-x,insetY:inset-y,float:float,visibility:vis,display:d,hideFrom:hide,hideBelow:show,flexBasis:basis,flex:flex,flexDirection:flex/flexDir,flexGrow:grow,flexShrink:shrink,gridTemplateColumns:grid-cols,gridTemplateRows:grid-rows'

// extracted decode function from generator/css-fn.ts
function decode(str: string) {
  const classNames = new Map()
  const shorthands = new Map()

  str.split(',').forEach((utility) => {
    const [prop, meta] = utility.split(':')
    const [className, ...shorthandList] = meta.split('/')

    classNames.set(prop, className)

    if (shorthandList.length) {
      shorthandList.forEach((shorthand) => {
        shorthands.set(shorthand === '1' ? className : shorthand, prop)
      })
    }
  })

  return { classNames, shorthands }
}

test('generator/css fn', () => {
  expect(decode(utilities)).toMatchInlineSnapshot(`
    {
      "classNames": Map {
        "aspectRatio" => "aspect",
        "boxDecorationBreak" => "decoration",
        "zIndex" => "z",
        "boxSizing" => "box",
        "objectPosition" => "object",
        "objectFit" => "object",
        "overscrollBehavior" => "overscroll",
        "overscrollBehaviorX" => "overscroll-x",
        "overscrollBehaviorY" => "overscroll-y",
        "position" => "pos",
        "top" => "top",
        "left" => "left",
        "insetInline" => "inset-x",
        "insetBlock" => "inset-y",
        "inset" => "inset",
        "insetBlockEnd" => "inset-b",
        "insetBlockStart" => "inset-t",
        "insetInlineEnd" => "end",
        "insetInlineStart" => "start",
        "right" => "right",
        "bottom" => "bottom",
        "insetX" => "inset-x",
        "insetY" => "inset-y",
        "float" => "float",
        "visibility" => "vis",
        "display" => "d",
        "hideFrom" => "hide",
        "hideBelow" => "show",
        "flexBasis" => "basis",
        "flex" => "flex",
        "flexDirection" => "flex",
        "flexGrow" => "grow",
        "flexShrink" => "shrink",
        "gridTemplateColumns" => "grid-cols",
        "gridTemplateRows" => "grid-rows",
      },
      "shorthands": Map {
        "pos" => "position",
        "insetEnd" => "insetInlineEnd",
        "end" => "insetInlineEnd",
        "insetStart" => "insetInlineStart",
        "start" => "insetInlineStart",
        "flexDir" => "flexDirection",
      },
    }
  `)
})
