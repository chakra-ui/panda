---
title: Border
description: Panda's border utilities.
---

# Border

Panda provides the css properties for styling borders.

## Compound Properties

The border compound property maps to the `borders` token category.

| Prop                                | CSS Property        | Token Category |
| ----------------------------------- | ------------------- | -------------- |
| `border`                            | `border`            | `borders`      |
| `borderX` , `borderInline`          | `borderInline`      | `borders`      |
| `borderY` , `borderBlock`           | `borderBlock`       | `borders`      |
| `borderStart` , `borderInlineStart` | `borderInlineStart` | `borders`      |
| `borderEnd` , `borderInlineEnd`     | `borderInlineEnd`   | `borders`      |

## Border Radius

### All sides

```jsx
<div className={css({ borderRadius: 'md' })} />
<div className={css({ rounded: 'md' })} /> // shorthand
```

### Specific sides

Use the `border{Left|Right|Top|Bottom}Radius` properties, or the shorthand equivalent to apply border radius on a specific side of an element.

```jsx
<div className={css({ borderTopRadius: 'md' })} />
<div className={css({ roundedTop: 'md' })} /> // shorthand

<div className={css({ borderLeftRadius: 'md' })} />
<div className={css({ roundedLeft: 'md' })} /> // shorthand
```

### Specific corners

Use the `border{Top|Bottom}{Left|Right}Radius` properties, or the shorthand equivalent to round a specific corner.

```jsx
<div className={css({ borderTopLeftRadius: 'md' })} />
<div className={css({ roundedTopLeft: 'md' })} /> // shorthand
```

| Prop                                     | CSS Property                        | Token Category |
| ---------------------------------------- | ----------------------------------- | -------------- |
| `rounded`,`borderRadius`                 | `border-radius`                     | `radii`        |
| `roundedTopLeft`,`borderTopLeftRadius`   | `border-top-left-radius`            | `radii`        |
| `roundedTopRight`,`borderTopRight`       | `border-top-right-radius`           | `radii`        |
| `roundedBottomRight`,`borderBottomRight` | `border-bottom-right-radius`        | `radii`        |
| `roundedBottomLeft`,`borderBottomLeft`   | `border-bottom-left-radius`         | `radii`        |
| `roundedTop`,`borderTopRadius`           | `border-top-{left+right}-radius`    | `radii`        |
| `roundedRight`,`borderRightRadius`       | `border-{top+bottom}-right-radius`  | `radii`        |
| `roundedBottom`,`borderBottomRadius`     | `border-bottom-{left+right}-radius` | `radii`        |
| `roundedLeft`,`borderLeftRadius`         | `border-{top+bottom}-left-radius`   | `radii`        |

### Logical Properties

Panda also provides the logical properties for border radius, which map to corresponding physical properties based on the document's writing mode.

> For example, `borderStartRadius` will map to `border-left-radius` in LTR mode, and `border-right-radius` in RTL mode.

```jsx
<div className={css({ borderStartRadius: 'md' })} />
<div className={css({ roundedStart: 'md' })} /> // shorthand
```

| Prop                                         | CSS Property                      | Token Category |
| -------------------------------------------- | --------------------------------- | -------------- |
| `roundedStartStart`,`borderStartStartRadius` | `border-start-start-radius`       | `radii`        |
| `roundedStartEnd`,`borderStartEndRadius`     | `border-start-end-radius`         | `radii`        |
| `roundedStart`,`borderStartRadius`           | `border-{start+end}-start-radius` | `radii`        |
| `roundedEndStart`,`borderEndStartRadius`     | `border-end-start-radius`         | `radii`        |
| `roundedEndEnd`,`borderEndEndRadius`         | `border-end-end-radius`           | `radii`        |
| `roundedEnd` ,`borderEndRadius`              | `border-{start+end}-end-radius`   | `radii`        |

## Border Width

### All sides

```jsx
<div className={css({ borderWidth: '1px' })} />
```

### Specific sides

Use the `border{Left|Right|Top|Bottom}Width` properties, to apply border width on a specific side of an element.

```jsx
<div className={css({ borderTopWidth: '1px' })} />
<div className={css({ borderLeftWidth: '1px' })} />
```

| Prop                                 | CSS Property                |
| ------------------------------------ | --------------------------- |
| `borderWidth`                        | `border-width`              |
| `borderTopWidth`                     | `border-top-width`          |
| `borderLeftWidth`                    | `border-left-width`         |
| `borderRightWidth`                   | `border-right-width`        |
| `borderBottomWidth`                  | `border-bottom-width`       |
| `borderXWidth` , `borderInlineWidth` | `border-{left+right}-width` |
| `borderYWidth` , `borderBlockWidth`  | `border-{top+bottom}-width` |

### Logical Properties

Panda also provides the logical properties for border width, which map to corresponding physical properties based on the document's writing mode.

> For example, `borderStartWidth` will map to `border-left-width` in LTR mode, and `border-right-width` in RTL mode.

```jsx
<div className={css({ borderStartWidth: '1px' })} />
```

| Prop                                          | CSS Property               |
| --------------------------------------------- | -------------------------- |
| `borderStartWidth` , `borderInlineStartWidth` | `border-{start+end}-width` |
| `borderEndWidth` , `borderInlineEndWidth`     | `border-{start+end}-width` |

## Border Color

The border color utilities are used to set the border color of an element. It references the `colors` token category.

### All sides

```jsx
<div className={css({ borderColor: 'primary' })} />
```

### Specific sides

Use the `border{Left|Right|Top|Bottom}Color` properties to apply border color on a specific side of an element.

```jsx
<div className={css({ borderTopColor: 'primary' })} />
<div className={css({ borderLeftColor: 'primary' })} />
```

| Prop                | CSS Property          | Token Category |
| ------------------- | --------------------- | -------------- |
| `borderColor`       | `border-color`        | `colors`       |
| `borderTopColor`    | `border-top-color`    | `colors`       |
| `borderLeftColor`   | `border-left-color`   | `colors`       |
| `borderRightColor`  | `border-right-color`  | `colors`       |
| `borderBottomColor` | `border-bottom-color` | `colors`       |

### Logical Properties

Panda also provides the logical properties for border color, which map to corresponding physical properties based on the document's writing mode.

> For example, `borderInlineStartColor` will map to `border-left-color` in LTR mode, and `border-right-color` in RTL mode.

```jsx
<div className={css({ borderInlineStartColor: 'red.500' })} />
```

| Prop                                        | CSS Property               | Token Category |
| ------------------------------------------- | -------------------------- | -------------- |
| `borderStartColor` , `borderInlineStartColor` | `border-{start+end}-color` | `colors`       |
| `borderEndColor` , `borderInlineEndColor`   | `border-{start+end}-color` | `colors`       |
| `borderXColor`, `borderInlineColor`         | `border-inline-color`      | `colors`       |
| `borderYColor`, `borderBlockColor`          | `border-block-color`       | `colors`       |
