import { expect, test } from 'vitest'
import { generatePattern } from '../src/artifacts/js/pattern'
import { generator } from './fixture'

test('should generate pattern', () => {
  expect(generatePattern(generator)).toMatchInlineSnapshot(`
    [
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type BoxProperties = {
       
    }


    type BoxStyles = BoxProperties & DistributiveOmit<SystemStyleObject, keyof BoxProperties >

    interface BoxPatternFn {
      (styles?: BoxStyles): string
      raw: (styles: BoxStyles) => BoxStyles
    }


    export declare const box: BoxPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const boxConfig = {
    transform(props) {
      return props;
    }}

    export const getBoxStyle = (styles = {}) => boxConfig.transform(styles, { map: mapObject })

    export const box = (styles) => css(getBoxStyle(styles))
    box.raw = (styles) => styles",
        "name": "box",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type FlexProperties = {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	wrap?: PropertyValue<'flexWrap'>
    	basis?: PropertyValue<'flexBasis'>
    	grow?: PropertyValue<'flexGrow'>
    	shrink?: PropertyValue<'flexShrink'>
    }


    type FlexStyles = FlexProperties & DistributiveOmit<SystemStyleObject, keyof FlexProperties >

    interface FlexPatternFn {
      (styles?: FlexStyles): string
      raw: (styles: FlexStyles) => FlexStyles
    }


    export declare const flex: FlexPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const flexConfig = {
    transform(props) {
      const { direction, align, justify, wrap: wrap2, basis, grow, shrink, ...rest } = props;
      return {
        display: \\"flex\\",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap2,
        flexBasis: basis,
        flexGrow: grow,
        flexShrink: shrink,
        ...rest
      };
    }}

    export const getFlexStyle = (styles = {}) => flexConfig.transform(styles, { map: mapObject })

    export const flex = (styles) => css(getFlexStyle(styles))
    flex.raw = (styles) => styles",
        "name": "flex",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type StackProperties = {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	gap?: PropertyValue<'gap'>
    }


    type StackStyles = StackProperties & DistributiveOmit<SystemStyleObject, keyof StackProperties >

    interface StackPatternFn {
      (styles?: StackStyles): string
      raw: (styles: StackStyles) => StackStyles
    }


    export declare const stack: StackPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const stackConfig = {
    transform(props) {
      const { align, justify, direction = \\"column\\", gap = \\"10px\\", ...rest } = props;
      return {
        display: \\"flex\\",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        ...rest
      };
    }}

    export const getStackStyle = (styles = {}) => stackConfig.transform(styles, { map: mapObject })

    export const stack = (styles) => css(getStackStyle(styles))
    stack.raw = (styles) => styles",
        "name": "stack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type VstackProperties = {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    type VstackStyles = VstackProperties & DistributiveOmit<SystemStyleObject, keyof VstackProperties >

    interface VstackPatternFn {
      (styles?: VstackStyles): string
      raw: (styles: VstackStyles) => VstackStyles
    }


    export declare const vstack: VstackPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const vstackConfig = {
    transform(props) {
      const { justify, gap = \\"10px\\", ...rest } = props;
      return {
        display: \\"flex\\",
        alignItems: \\"center\\",
        justifyContent: justify,
        gap,
        flexDirection: \\"column\\",
        ...rest
      };
    }}

    export const getVstackStyle = (styles = {}) => vstackConfig.transform(styles, { map: mapObject })

    export const vstack = (styles) => css(getVstackStyle(styles))
    vstack.raw = (styles) => styles",
        "name": "vstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type HstackProperties = {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    type HstackStyles = HstackProperties & DistributiveOmit<SystemStyleObject, keyof HstackProperties >

    interface HstackPatternFn {
      (styles?: HstackStyles): string
      raw: (styles: HstackStyles) => HstackStyles
    }


    export declare const hstack: HstackPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const hstackConfig = {
    transform(props) {
      const { justify, gap = \\"10px\\", ...rest } = props;
      return {
        display: \\"flex\\",
        alignItems: \\"center\\",
        justifyContent: justify,
        gap,
        flexDirection: \\"row\\",
        ...rest
      };
    }}

    export const getHstackStyle = (styles = {}) => hstackConfig.transform(styles, { map: mapObject })

    export const hstack = (styles) => css(getHstackStyle(styles))
    hstack.raw = (styles) => styles",
        "name": "hstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type SpacerProperties = {
       size?: ConditionalValue<Tokens[\\"spacing\\"]>
    }


    type SpacerStyles = SpacerProperties & DistributiveOmit<SystemStyleObject, keyof SpacerProperties >

    interface SpacerPatternFn {
      (styles?: SpacerStyles): string
      raw: (styles: SpacerStyles) => SpacerStyles
    }


    export declare const spacer: SpacerPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const spacerConfig = {
    transform(props, { map }) {
      const { size, ...rest } = props;
      return {
        alignSelf: \\"stretch\\",
        justifySelf: \\"stretch\\",
        flex: map(size, (v) => v == null ? \\"1\\" : \`0 0 \${v}\`),
        ...rest
      };
    }}

    export const getSpacerStyle = (styles = {}) => spacerConfig.transform(styles, { map: mapObject })

    export const spacer = (styles) => css(getSpacerStyle(styles))
    spacer.raw = (styles) => styles",
        "name": "spacer",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type SquareProperties = {
       size?: PropertyValue<'width'>
    }


    type SquareStyles = SquareProperties & DistributiveOmit<SystemStyleObject, keyof SquareProperties >

    interface SquarePatternFn {
      (styles?: SquareStyles): string
      raw: (styles: SquareStyles) => SquareStyles
    }


    export declare const square: SquarePatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const squareConfig = {
    transform(props) {
      const { size, ...rest } = props;
      return {
        display: \\"flex\\",
        alignItems: \\"center\\",
        justifyContent: \\"center\\",
        flex: \\"0 0 auto\\",
        width: size,
        height: size,
        ...rest
      };
    }}

    export const getSquareStyle = (styles = {}) => squareConfig.transform(styles, { map: mapObject })

    export const square = (styles) => css(getSquareStyle(styles))
    square.raw = (styles) => styles",
        "name": "square",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type CircleProperties = {
       size?: PropertyValue<'width'>
    }


    type CircleStyles = CircleProperties & DistributiveOmit<SystemStyleObject, keyof CircleProperties >

    interface CirclePatternFn {
      (styles?: CircleStyles): string
      raw: (styles: CircleStyles) => CircleStyles
    }


    export declare const circle: CirclePatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const circleConfig = {
    transform(props) {
      const { size, ...rest } = props;
      return {
        display: \\"flex\\",
        alignItems: \\"center\\",
        justifyContent: \\"center\\",
        flex: \\"0 0 auto\\",
        width: size,
        height: size,
        borderRadius: \\"9999px\\",
        ...rest
      };
    }}

    export const getCircleStyle = (styles = {}) => circleConfig.transform(styles, { map: mapObject })

    export const circle = (styles) => css(getCircleStyle(styles))
    circle.raw = (styles) => styles",
        "name": "circle",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type CenterProperties = {
       inline?: ConditionalValue<boolean>
    }


    type CenterStyles = CenterProperties & DistributiveOmit<SystemStyleObject, keyof CenterProperties >

    interface CenterPatternFn {
      (styles?: CenterStyles): string
      raw: (styles: CenterStyles) => CenterStyles
    }


    export declare const center: CenterPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const centerConfig = {
    transform(props) {
      const { inline, ...rest } = props;
      return {
        display: inline ? \\"inline-flex\\" : \\"flex\\",
        alignItems: \\"center\\",
        justifyContent: \\"center\\",
        ...rest
      };
    }}

    export const getCenterStyle = (styles = {}) => centerConfig.transform(styles, { map: mapObject })

    export const center = (styles) => css(getCenterStyle(styles))
    center.raw = (styles) => styles",
        "name": "center",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type LinkBoxProperties = {
       
    }


    type LinkBoxStyles = LinkBoxProperties & DistributiveOmit<SystemStyleObject, keyof LinkBoxProperties >

    interface LinkBoxPatternFn {
      (styles?: LinkBoxStyles): string
      raw: (styles: LinkBoxStyles) => LinkBoxStyles
    }


    export declare const linkBox: LinkBoxPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const linkBoxConfig = {
    transform(props) {
      return {
        position: \\"relative\\",
        \\"& :where(a, abbr)\\": {
          position: \\"relative\\",
          zIndex: \\"1\\"
        },
        ...props
      };
    }}

    export const getLinkBoxStyle = (styles = {}) => linkBoxConfig.transform(styles, { map: mapObject })

    export const linkBox = (styles) => css(getLinkBoxStyle(styles))
    linkBox.raw = (styles) => styles",
        "name": "link-box",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type LinkOverlayProperties = {
       
    }


    type LinkOverlayStyles = LinkOverlayProperties & DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties >

    interface LinkOverlayPatternFn {
      (styles?: LinkOverlayStyles): string
      raw: (styles: LinkOverlayStyles) => LinkOverlayStyles
    }


    export declare const linkOverlay: LinkOverlayPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const linkOverlayConfig = {
    transform(props) {
      return {
        position: \\"static\\",
        _before: {
          content: '\\"\\"',
          display: \\"block\\",
          position: \\"absolute\\",
          cursor: \\"inherit\\",
          inset: \\"0\\",
          zIndex: \\"0\\",
          ...props[\\"_before\\"]
        },
        ...props
      };
    }}

    export const getLinkOverlayStyle = (styles = {}) => linkOverlayConfig.transform(styles, { map: mapObject })

    export const linkOverlay = (styles) => css(getLinkOverlayStyle(styles))
    linkOverlay.raw = (styles) => styles",
        "name": "link-overlay",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type AspectRatioProperties = {
       ratio?: ConditionalValue<number>
    }


    type AspectRatioStyles = AspectRatioProperties & DistributiveOmit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>

    interface AspectRatioPatternFn {
      (styles?: AspectRatioStyles): string
      raw: (styles: AspectRatioStyles) => AspectRatioStyles
    }


    export declare const aspectRatio: AspectRatioPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const aspectRatioConfig = {
    transform(props, { map }) {
      const { ratio = 4 / 3, ...rest } = props;
      return {
        position: \\"relative\\",
        _before: {
          content: \`\\"\\"\`,
          display: \\"block\\",
          height: \\"0\\",
          paddingBottom: map(ratio, (r) => \`\${1 / r * 100}%\`)
        },
        \\"&>*\\": {
          display: \\"flex\\",
          justifyContent: \\"center\\",
          alignItems: \\"center\\",
          overflow: \\"hidden\\",
          position: \\"absolute\\",
          inset: \\"0\\",
          width: \\"100%\\",
          height: \\"100%\\"
        },
        \\"&>img, &>video\\": {
          objectFit: \\"cover\\"
        },
        ...rest
      };
    }}

    export const getAspectRatioStyle = (styles = {}) => aspectRatioConfig.transform(styles, { map: mapObject })

    export const aspectRatio = (styles) => css(getAspectRatioStyle(styles))
    aspectRatio.raw = (styles) => styles",
        "name": "aspect-ratio",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type GridProperties = {
       gap?: PropertyValue<'gap'>
    	columnGap?: PropertyValue<'gap'>
    	rowGap?: PropertyValue<'gap'>
    	columns?: ConditionalValue<number>
    	minChildWidth?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"width\\"]>
    }


    type GridStyles = GridProperties & DistributiveOmit<SystemStyleObject, keyof GridProperties >

    interface GridPatternFn {
      (styles?: GridStyles): string
      raw: (styles: GridStyles) => GridStyles
    }


    export declare const grid: GridPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const gridConfig = {
    transform(props, { map }) {
      const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : \\"10px\\", columns, minChildWidth, ...rest } = props;
      return {
        display: \\"grid\\",
        gridTemplateColumns: columns != null ? map(columns, (v) => \`repeat(\${v}, minmax(0, 1fr))\`) : minChildWidth != null ? map(minChildWidth, (v) => \`repeat(auto-fit, minmax(\${v}, 1fr))\`) : void 0,
        gap,
        columnGap,
        rowGap,
        ...rest
      };
    }}

    export const getGridStyle = (styles = {}) => gridConfig.transform(styles, { map: mapObject })

    export const grid = (styles) => css(getGridStyle(styles))
    grid.raw = (styles) => styles",
        "name": "grid",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type GridItemProperties = {
       colSpan?: ConditionalValue<number>
    	rowSpan?: ConditionalValue<number>
    	colStart?: ConditionalValue<number>
    	rowStart?: ConditionalValue<number>
    	colEnd?: ConditionalValue<number>
    	rowEnd?: ConditionalValue<number>
    }


    type GridItemStyles = GridItemProperties & DistributiveOmit<SystemStyleObject, keyof GridItemProperties >

    interface GridItemPatternFn {
      (styles?: GridItemStyles): string
      raw: (styles: GridItemStyles) => GridItemStyles
    }


    export declare const gridItem: GridItemPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const gridItemConfig = {
    transform(props, { map }) {
      const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...rest } = props;
      const spanFn = (v) => v === \\"auto\\" ? v : \`span \${v}\`;
      return {
        gridColumn: colSpan != null ? map(colSpan, spanFn) : void 0,
        gridRow: rowSpan != null ? map(rowSpan, spanFn) : void 0,
        gridColumnStart: colStart,
        gridColumnEnd: colEnd,
        gridRowStart: rowStart,
        gridRowEnd: rowEnd,
        ...rest
      };
    }}

    export const getGridItemStyle = (styles = {}) => gridItemConfig.transform(styles, { map: mapObject })

    export const gridItem = (styles) => css(getGridItemStyle(styles))
    gridItem.raw = (styles) => styles",
        "name": "grid-item",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type WrapProperties = {
       gap?: PropertyValue<'gap'>
    	rowGap?: PropertyValue<'gap'>
    	columnGap?: PropertyValue<'gap'>
    	align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    }


    type WrapStyles = WrapProperties & DistributiveOmit<SystemStyleObject, keyof WrapProperties >

    interface WrapPatternFn {
      (styles?: WrapStyles): string
      raw: (styles: WrapStyles) => WrapStyles
    }


    export declare const wrap: WrapPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const wrapConfig = {
    transform(props) {
      const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : \\"10px\\", align, justify, ...rest } = props;
      return {
        display: \\"flex\\",
        flexWrap: \\"wrap\\",
        alignItems: align,
        justifyContent: justify,
        gap,
        columnGap,
        rowGap,
        ...rest
      };
    }}

    export const getWrapStyle = (styles = {}) => wrapConfig.transform(styles, { map: mapObject })

    export const wrap = (styles) => css(getWrapStyle(styles))
    wrap.raw = (styles) => styles",
        "name": "wrap",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type ContainerProperties = {
       
    }


    type ContainerStyles = ContainerProperties & DistributiveOmit<SystemStyleObject, keyof ContainerProperties >

    interface ContainerPatternFn {
      (styles?: ContainerStyles): string
      raw: (styles: ContainerStyles) => ContainerStyles
    }


    export declare const container: ContainerPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const containerConfig = {
    transform(props) {
      return {
        position: \\"relative\\",
        maxWidth: \\"8xl\\",
        mx: \\"auto\\",
        px: { base: \\"4\\", md: \\"6\\", lg: \\"8\\" },
        ...props
      };
    }}

    export const getContainerStyle = (styles = {}) => containerConfig.transform(styles, { map: mapObject })

    export const container = (styles) => css(getContainerStyle(styles))
    container.raw = (styles) => styles",
        "name": "container",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type DividerProperties = {
       orientation?: ConditionalValue<\\"horizontal\\" | \\"vertical\\">
    	thickness?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"borderWidth\\"]>
    	color?: ConditionalValue<Tokens[\\"colors\\"] | Properties[\\"borderColor\\"]>
    }


    type DividerStyles = DividerProperties & DistributiveOmit<SystemStyleObject, keyof DividerProperties >

    interface DividerPatternFn {
      (styles?: DividerStyles): string
      raw: (styles: DividerStyles) => DividerStyles
    }


    export declare const divider: DividerPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const dividerConfig = {
    transform(props, { map }) {
      const { orientation = \\"horizontal\\", thickness = \\"1px\\", color, ...rest } = props;
      return {
        \\"--thickness\\": thickness,
        width: map(orientation, (v) => v === \\"vertical\\" ? void 0 : \\"100%\\"),
        height: map(orientation, (v) => v === \\"horizontal\\" ? void 0 : \\"100%\\"),
        borderBlockEndWidth: map(orientation, (v) => v === \\"horizontal\\" ? \\"var(--thickness)\\" : void 0),
        borderInlineEndWidth: map(orientation, (v) => v === \\"vertical\\" ? \\"var(--thickness)\\" : void 0),
        borderColor: color,
        ...rest
      };
    }}

    export const getDividerStyle = (styles = {}) => dividerConfig.transform(styles, { map: mapObject })

    export const divider = (styles) => css(getDividerStyle(styles))
    divider.raw = (styles) => styles",
        "name": "divider",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type FloatProperties = {
       offsetX?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"left\\"]>
    	offsetY?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"top\\"]>
    	offset?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"top\\"]>
    	placement?: ConditionalValue<\\"bottom-end\\" | \\"bottom-start\\" | \\"top-end\\" | \\"top-start\\" | \\"bottom-center\\" | \\"top-center\\" | \\"middle-center\\" | \\"middle-end\\" | \\"middle-start\\">
    }


    type FloatStyles = FloatProperties & DistributiveOmit<SystemStyleObject, keyof FloatProperties >

    interface FloatPatternFn {
      (styles?: FloatStyles): string
      raw: (styles: FloatStyles) => FloatStyles
    }


    export declare const float: FloatPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const floatConfig = {
    transform(props, { map }) {
      const { offset = \\"0\\", offsetX = offset, offsetY = offset, placement = \\"top-end\\", ...rest } = props;
      return {
        display: \\"inline-flex\\",
        justifyContent: \\"center\\",
        alignItems: \\"center\\",
        position: \\"absolute\\",
        insetBlockStart: map(placement, (v) => {
          const [side] = v.split(\\"-\\");
          const map2 = { top: offsetY, middle: \\"50%\\", bottom: \\"auto\\" };
          return map2[side];
        }),
        insetBlockEnd: map(placement, (v) => {
          const [side] = v.split(\\"-\\");
          const map2 = { top: \\"auto\\", middle: \\"50%\\", bottom: offsetY };
          return map2[side];
        }),
        insetInlineStart: map(placement, (v) => {
          const [, align] = v.split(\\"-\\");
          const map2 = { start: offsetX, center: \\"50%\\", end: \\"auto\\" };
          return map2[align];
        }),
        insetInlineEnd: map(placement, (v) => {
          const [, align] = v.split(\\"-\\");
          const map2 = { start: \\"auto\\", center: \\"50%\\", end: offsetX };
          return map2[align];
        }),
        translate: map(placement, (v) => {
          const [side, align] = v.split(\\"-\\");
          const mapX = { start: \\"-50%\\", center: \\"-50%\\", end: \\"50%\\" };
          const mapY = { top: \\"-50%\\", middle: \\"-50%\\", bottom: \\"50%\\" };
          return \`\${mapX[align]} \${mapY[side]}\`;
        }),
        ...rest
      };
    }}

    export const getFloatStyle = (styles = {}) => floatConfig.transform(styles, { map: mapObject })

    export const float = (styles) => css(getFloatStyle(styles))
    float.raw = (styles) => styles",
        "name": "float",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type BleedProperties = {
       inline?: PropertyValue<'marginInline'>
    	block?: PropertyValue<'marginBlock'>
    }


    type BleedStyles = BleedProperties & DistributiveOmit<SystemStyleObject, keyof BleedProperties >

    interface BleedPatternFn {
      (styles?: BleedStyles): string
      raw: (styles: BleedStyles) => BleedStyles
    }


    export declare const bleed: BleedPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const bleedConfig = {
    transform(props) {
      const { inline = \\"0\\", block = \\"0\\", ...rest } = props;
      return {
        \\"--bleed-x\\": \`spacing.\${inline}\`,
        \\"--bleed-y\\": \`spacing.\${block}\`,
        marginInline: \\"calc(var(--bleed-x, 0) * -1)\\",
        marginBlock: \\"calc(var(--bleed-y, 0) * -1)\\",
        ...rest
      };
    }}

    export const getBleedStyle = (styles = {}) => bleedConfig.transform(styles, { map: mapObject })

    export const bleed = (styles) => css(getBleedStyle(styles))
    bleed.raw = (styles) => styles",
        "name": "bleed",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { Properties } from '../types/csstype'
    import type { PropertyValue } from '../types/prop-type'
    import type { DistributiveOmit } from '../types/system-types'
    import type { Tokens } from '../tokens'

    export type VisuallyHiddenProperties = {
       
    }


    type VisuallyHiddenStyles = VisuallyHiddenProperties & DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties >

    interface VisuallyHiddenPatternFn {
      (styles?: VisuallyHiddenStyles): string
      raw: (styles: VisuallyHiddenStyles) => VisuallyHiddenStyles
    }


    export declare const visuallyHidden: VisuallyHiddenPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const visuallyHiddenConfig = {
    transform(props) {
      return {
        srOnly: true,
        ...props
      };
    }}

    export const getVisuallyHiddenStyle = (styles = {}) => visuallyHiddenConfig.transform(styles, { map: mapObject })

    export const visuallyHidden = (styles) => css(getVisuallyHiddenStyle(styles))
    visuallyHidden.raw = (styles) => styles",
        "name": "visually-hidden",
      },
    ]
  `)
})
