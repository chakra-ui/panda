---
'@pandacss/generator': patch
---

Fix `strictPropertyValues` with border\* properties

We had listed `border\*` properties as affected by `strictPropertyValues` but they shouldn't be restricted as their
syntax is too complex to be restricted. This removes any `border*` properties that do not specifically end with `Style`
like `borderTopStyle`.

```ts
import { css } from '../styled-system/css'

css({
  borderTop: '1px solid red', // ✅ will now be fine as it should be
  borderTopStyle: 'abc', // ✅ will still report a TS error
})
```

```diff

  type StrictableProps =
    | 'alignContent'
    | 'alignItems'
    | 'alignSelf'
    | 'all'
    | 'animationComposition'
    | 'animationDirection'
    | 'animationFillMode'
    | 'appearance'
    | 'backfaceVisibility'
    | 'backgroundAttachment'
    | 'backgroundClip'
    | 'borderCollapse'
-    | 'border'
-    | 'borderBlock'
-    | 'borderBlockEnd'
-    | 'borderBlockStart'
-    | 'borderBottom'
-    | 'borderInline'
-    | 'borderInlineEnd'
-    | 'borderInlineStart'
-    | 'borderLeft'
-    | 'borderRight'
-    | 'borderTop'
    | 'borderBlockEndStyle'
    | 'borderBlockStartStyle'
    | 'borderBlockStyle'
    | 'borderBottomStyle'
    | 'borderInlineEndStyle'
    | 'borderInlineStartStyle'
    | 'borderInlineStyle'
    | 'borderLeftStyle'
    | 'borderRightStyle'
    | 'borderTopStyle'
    | 'boxDecorationBreak'
    | 'boxSizing'
    | 'breakAfter'
    | 'breakBefore'
    | 'breakInside'
    | 'captionSide'
    | 'clear'
    | 'columnFill'
    | 'columnRuleStyle'
    | 'contentVisibility'
    | 'direction'
    | 'display'
    | 'emptyCells'
    | 'flexDirection'
    | 'flexWrap'
    | 'float'
    | 'fontKerning'
    | 'forcedColorAdjust'
    | 'isolation'
    | 'lineBreak'
    | 'mixBlendMode'
    | 'objectFit'
    | 'outlineStyle'
    | 'overflow'
    | 'overflowX'
    | 'overflowY'
    | 'overflowBlock'
    | 'overflowInline'
    | 'overflowWrap'
    | 'pointerEvents'
    | 'position'
    | 'resize'
    | 'scrollBehavior'
    | 'touchAction'
    | 'transformBox'
    | 'transformStyle'
    | 'userSelect'
    | 'visibility'
    | 'wordBreak'
    | 'writingMode'
```
