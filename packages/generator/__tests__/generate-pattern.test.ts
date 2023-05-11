import { expect, test } from 'vitest'
import { generatePattern } from '../src/artifacts/js/pattern'
import { generator } from './fixture'

test('should generate pattern', () => {
  expect(generatePattern(generator)).toMatchInlineSnapshot(`
    [
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type BoxProperties = {
       
    }


    type BoxOptions = BoxProperties & Omit<SystemStyleObject, keyof BoxProperties >


    export declare function box(options?: BoxOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const boxConfig = {
    transform(props) {
      return props;
    }}

    export const getBoxStyle = (styles = {}) => boxConfig.transform(styles, { map: mapObject })

    export const box = (styles) => css(getBoxStyle(styles))",
        "name": "box",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type FlexProperties = {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	wrap?: PropertyValue<'flexWrap'>
    	basis?: PropertyValue<'flexBasis'>
    	grow?: PropertyValue<'flexGrow'>
    	shrink?: PropertyValue<'flexShrink'>
    }


    type FlexOptions = FlexProperties & Omit<SystemStyleObject, keyof FlexProperties >


    export declare function flex(options?: FlexOptions): string
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

    export const flex = (styles) => css(getFlexStyle(styles))",
        "name": "flex",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type StackProperties = {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	gap?: PropertyValue<'gap'>
    }


    type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties | 'flexDirection'>


    export declare function stack(options?: StackOptions): string
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

    export const stack = (styles) => css(getStackStyle(styles))",
        "name": "stack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type VstackProperties = {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    type VstackOptions = VstackProperties & Omit<SystemStyleObject, keyof VstackProperties | 'flexDirection'>


    export declare function vstack(options?: VstackOptions): string
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

    export const vstack = (styles) => css(getVstackStyle(styles))",
        "name": "vstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type HstackProperties = {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    type HstackOptions = HstackProperties & Omit<SystemStyleObject, keyof HstackProperties | 'flexDirection'>


    export declare function hstack(options?: HstackOptions): string
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

    export const hstack = (styles) => css(getHstackStyle(styles))",
        "name": "hstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type SpacerProperties = {
       size?: ConditionalValue<Tokens[\\"spacing\\"]>
    }


    type SpacerOptions = SpacerProperties & Omit<SystemStyleObject, keyof SpacerProperties >


    export declare function spacer(options?: SpacerOptions): string
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

    export const spacer = (styles) => css(getSpacerStyle(styles))",
        "name": "spacer",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type CircleProperties = {
       size?: PropertyValue<'width'>
    }


    type CircleOptions = CircleProperties & Omit<SystemStyleObject, keyof CircleProperties | 'width' | 'height' | 'borderRadius'>


    export declare function circle(options?: CircleOptions): string
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

    export const circle = (styles) => css(getCircleStyle(styles))",
        "name": "circle",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type CenterProperties = {
       inline?: ConditionalValue<boolean>
    }


    type CenterOptions = CenterProperties & Omit<SystemStyleObject, keyof CenterProperties >


    export declare function center(options?: CenterOptions): string
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

    export const center = (styles) => css(getCenterStyle(styles))",
        "name": "center",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type AbsoluteCenterProperties = {
       axis?: ConditionalValue<\\"x\\" | \\"y\\" | \\"both\\">
    }


    type AbsoluteCenterOptions = AbsoluteCenterProperties & Omit<SystemStyleObject, keyof AbsoluteCenterProperties >


    export declare function absoluteCenter(options?: AbsoluteCenterOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const absoluteCenterConfig = {
    transform(props, { map }) {
      const { axis = \\"both\\", ...rest } = props;
      return {
        position: \\"absolute\\",
        insetBlockStart: map(axis, (v) => v === \\"x\\" ? \\"auto\\" : \\"50%\\"),
        insetInlineStart: map(axis, (v) => v === \\"y\\" ? \\"auto\\" : \\"50%\\"),
        transform: map(
          axis,
          (v) => v === \\"both\\" ? \\"translate(-50%, -50%)\\" : v === \\"x\\" ? \\"translateX(-50%)\\" : \\"translateY(-50%)\\"
        ),
        maxWidth: \\"100%\\",
        maxHeight: \\"100%\\",
        ...rest
      };
    }}

    export const getAbsoluteCenterStyle = (styles = {}) => absoluteCenterConfig.transform(styles, { map: mapObject })

    export const absoluteCenter = (styles) => css(getAbsoluteCenterStyle(styles))",
        "name": "absolute-center",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type AspectRatioProperties = {
       ratio?: ConditionalValue<number>
    }


    type AspectRatioOptions = AspectRatioProperties & Omit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'>


    export declare function aspectRatio(options?: AspectRatioOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const aspectRatioConfig = {
    transform(props) {
      const { ratio, ...rest } = props;
      return {
        aspectRatio: ratio,
        overflow: \\"hidden\\",
        display: \\"flex\\",
        justifyContent: \\"center\\",
        alignItems: \\"center\\",
        \\"&>img, &>video\\": {
          width: \\"100%\\",
          height: \\"100%\\",
          objectFit: \\"cover\\"
        },
        ...rest
      };
    }}

    export const getAspectRatioStyle = (styles = {}) => aspectRatioConfig.transform(styles, { map: mapObject })

    export const aspectRatio = (styles) => css(getAspectRatioStyle(styles))",
        "name": "aspect-ratio",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type GridProperties = {
       gap?: PropertyValue<'gap'>
    	gapX?: PropertyValue<'gap'>
    	gapY?: PropertyValue<'gap'>
    	columns?: ConditionalValue<number>
    	minChildWidth?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"width\\"]>
    }


    type GridOptions = GridProperties & Omit<SystemStyleObject, keyof GridProperties >


    export declare function grid(options?: GridOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const gridConfig = {
    transform(props, { map }) {
      const { gapX, gapY, gap = gapX || gapY ? void 0 : \\"10px\\", columns, minChildWidth, ...rest } = props;
      return {
        gridTemplateColumns: columns != null ? map(columns, (v) => \`repeat(\${v}, minmax(0, 1fr))\`) : minChildWidth != null ? map(minChildWidth, (v) => \`repeat(auto-fit, minmax(\${v}, 1fr))\`) : void 0,
        display: \\"grid\\",
        gap,
        columnGap: gapX,
        rowGap: gapY,
        ...rest
      };
    }}

    export const getGridStyle = (styles = {}) => gridConfig.transform(styles, { map: mapObject })

    export const grid = (styles) => css(getGridStyle(styles))",
        "name": "grid",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type GridItemProperties = {
       colSpan?: ConditionalValue<number>
    	rowSpan?: ConditionalValue<number>
    	colStart?: ConditionalValue<number>
    	rowStart?: ConditionalValue<number>
    	colEnd?: ConditionalValue<number>
    	rowEnd?: ConditionalValue<number>
    }


    type GridItemOptions = GridItemProperties & Omit<SystemStyleObject, keyof GridItemProperties >


    export declare function gridItem(options?: GridItemOptions): string
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
        gridColumnEnd: colEnd,
        gridRowEnd: rowEnd,
        ...rest
      };
    }}

    export const getGridItemStyle = (styles = {}) => gridItemConfig.transform(styles, { map: mapObject })

    export const gridItem = (styles) => css(getGridItemStyle(styles))",
        "name": "grid-item",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type WrapProperties = {
       gap?: PropertyValue<'gap'>
    	gapX?: PropertyValue<'gap'>
    	gapY?: PropertyValue<'gap'>
    	align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    }


    type WrapOptions = WrapProperties & Omit<SystemStyleObject, keyof WrapProperties >


    export declare function wrap(options?: WrapOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const wrapConfig = {
    transform(props) {
      const { gapX, gapY, gap = gapX || gapY ? void 0 : \\"10px\\", align, justify, ...rest } = props;
      return {
        display: \\"flex\\",
        flexWrap: \\"wrap\\",
        alignItems: align,
        justifyContent: justify,
        gap,
        columnGap: gapX,
        rowGap: gapY,
        ...rest
      };
    }}

    export const getWrapStyle = (styles = {}) => wrapConfig.transform(styles, { map: mapObject })

    export const wrap = (styles) => css(getWrapStyle(styles))",
        "name": "wrap",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../tokens/tokens'

    export type ContainerProperties = {
       size?: ConditionalValue<Tokens[\\"breakpoints\\"]>
    }


    type ContainerOptions = ContainerProperties & Omit<SystemStyleObject, keyof ContainerProperties >


    export declare function container(options?: ContainerOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const containerConfig = {
    transform(props, { map }) {
      const { size, ...rest } = props;
      return {
        position: \\"relative\\",
        width: \\"100%\\",
        maxWidth: size != null ? map(size, (v) => \`breakpoint-\${v}\`) : \\"60ch\\",
        marginX: \\"auto\\",
        ...rest
      };
    }}

    export const getContainerStyle = (styles = {}) => containerConfig.transform(styles, { map: mapObject })

    export const container = (styles) => css(getContainerStyle(styles))",
        "name": "container",
      },
    ]
  `)
})
