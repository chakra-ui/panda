import type { ConfigResultWithHooks } from '@pandacss/types'
import { expect, test } from 'vitest'
import { Generator } from '../src'
import { generatePattern } from '../src/artifacts/js/pattern'
import { generatorConfig } from './fixture'

const patterns = (config: ConfigResultWithHooks) => {
  const generator = new Generator(config)
  return generatePattern(generator)
}

test('should generate pattern', () => {
  expect(patterns(generatorConfig)).toMatchInlineSnapshot(`
    [
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface BoxProperties {
       
    }


    interface BoxStyles extends BoxProperties, DistributiveOmit<SystemStyleObject, keyof BoxProperties > {}

    interface BoxPatternFn {
      (styles?: BoxStyles): string
      raw: (styles?: BoxStyles) => SystemStyleObject
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
    box.raw = getBoxStyle",
        "name": "box",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface FlexProperties {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	wrap?: PropertyValue<'flexWrap'>
    	basis?: PropertyValue<'flexBasis'>
    	grow?: PropertyValue<'flexGrow'>
    	shrink?: PropertyValue<'flexShrink'>
    }


    interface FlexStyles extends FlexProperties, DistributiveOmit<SystemStyleObject, keyof FlexProperties > {}

    interface FlexPatternFn {
      (styles?: FlexStyles): string
      raw: (styles?: FlexStyles) => SystemStyleObject
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
    flex.raw = getFlexStyle",
        "name": "flex",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface StackProperties {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	gap?: PropertyValue<'gap'>
    }


    interface StackStyles extends StackProperties, DistributiveOmit<SystemStyleObject, keyof StackProperties > {}

    interface StackPatternFn {
      (styles?: StackStyles): string
      raw: (styles?: StackStyles) => SystemStyleObject
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
    stack.raw = getStackStyle",
        "name": "stack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface VstackProperties {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    interface VstackStyles extends VstackProperties, DistributiveOmit<SystemStyleObject, keyof VstackProperties > {}

    interface VstackPatternFn {
      (styles?: VstackStyles): string
      raw: (styles?: VstackStyles) => SystemStyleObject
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
    vstack.raw = getVstackStyle",
        "name": "vstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface HstackProperties {
       justify?: PropertyValue<'justifyContent'>
    	gap?: PropertyValue<'gap'>
    }


    interface HstackStyles extends HstackProperties, DistributiveOmit<SystemStyleObject, keyof HstackProperties > {}

    interface HstackPatternFn {
      (styles?: HstackStyles): string
      raw: (styles?: HstackStyles) => SystemStyleObject
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
    hstack.raw = getHstackStyle",
        "name": "hstack",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface SpacerProperties {
       size?: ConditionalValue<Tokens[\\"spacing\\"]>
    }


    interface SpacerStyles extends SpacerProperties, DistributiveOmit<SystemStyleObject, keyof SpacerProperties > {}

    interface SpacerPatternFn {
      (styles?: SpacerStyles): string
      raw: (styles?: SpacerStyles) => SystemStyleObject
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
    spacer.raw = getSpacerStyle",
        "name": "spacer",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface SquareProperties {
       size?: PropertyValue<'width'>
    }


    interface SquareStyles extends SquareProperties, DistributiveOmit<SystemStyleObject, keyof SquareProperties > {}

    interface SquarePatternFn {
      (styles?: SquareStyles): string
      raw: (styles?: SquareStyles) => SystemStyleObject
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
    square.raw = getSquareStyle",
        "name": "square",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface CircleProperties {
       size?: PropertyValue<'width'>
    }


    interface CircleStyles extends CircleProperties, DistributiveOmit<SystemStyleObject, keyof CircleProperties > {}

    interface CirclePatternFn {
      (styles?: CircleStyles): string
      raw: (styles?: CircleStyles) => SystemStyleObject
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
    circle.raw = getCircleStyle",
        "name": "circle",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface CenterProperties {
       inline?: ConditionalValue<boolean>
    }


    interface CenterStyles extends CenterProperties, DistributiveOmit<SystemStyleObject, keyof CenterProperties > {}

    interface CenterPatternFn {
      (styles?: CenterStyles): string
      raw: (styles?: CenterStyles) => SystemStyleObject
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
    center.raw = getCenterStyle",
        "name": "center",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface LinkBoxProperties {
       
    }


    interface LinkBoxStyles extends LinkBoxProperties, DistributiveOmit<SystemStyleObject, keyof LinkBoxProperties > {}

    interface LinkBoxPatternFn {
      (styles?: LinkBoxStyles): string
      raw: (styles?: LinkBoxStyles) => SystemStyleObject
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
    linkBox.raw = getLinkBoxStyle",
        "name": "link-box",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface LinkOverlayProperties {
       
    }


    interface LinkOverlayStyles extends LinkOverlayProperties, DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties > {}

    interface LinkOverlayPatternFn {
      (styles?: LinkOverlayStyles): string
      raw: (styles?: LinkOverlayStyles) => SystemStyleObject
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
    linkOverlay.raw = getLinkOverlayStyle",
        "name": "link-overlay",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface AspectRatioProperties {
       ratio?: ConditionalValue<number>
    }


    interface AspectRatioStyles extends AspectRatioProperties, DistributiveOmit<SystemStyleObject, keyof AspectRatioProperties | 'aspectRatio'> {}

    interface AspectRatioPatternFn {
      (styles?: AspectRatioStyles): string
      raw: (styles?: AspectRatioStyles) => SystemStyleObject
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
    aspectRatio.raw = getAspectRatioStyle",
        "name": "aspect-ratio",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface GridProperties {
       gap?: PropertyValue<'gap'>
    	columnGap?: PropertyValue<'gap'>
    	rowGap?: PropertyValue<'gap'>
    	columns?: ConditionalValue<number>
    	minChildWidth?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"width\\"]>
    }


    interface GridStyles extends GridProperties, DistributiveOmit<SystemStyleObject, keyof GridProperties > {}

    interface GridPatternFn {
      (styles?: GridStyles): string
      raw: (styles?: GridStyles) => SystemStyleObject
    }


    export declare const grid: GridPatternFn;
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const gridConfig = {
    transform(props, { map }) {
      const regex = /\\\\d+(cm|in|pt|em|px|rem|vh|vmax|vmin|vw|ch|lh|%)$/;
      const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : \\"10px\\", columns, minChildWidth, ...rest } = props;
      const getValue = (v) => regex.test(v) ? v : \`token(sizes.\${v}, \${v})\`;
      return {
        display: \\"grid\\",
        gridTemplateColumns: columns != null ? map(columns, (v) => \`repeat(\${v}, minmax(0, 1fr))\`) : minChildWidth != null ? map(minChildWidth, (v) => \`repeat(auto-fit, minmax(\${getValue(v)}, 1fr))\`) : void 0,
        gap,
        columnGap,
        rowGap,
        ...rest
      };
    }}

    export const getGridStyle = (styles = {}) => gridConfig.transform(styles, { map: mapObject })

    export const grid = (styles) => css(getGridStyle(styles))
    grid.raw = getGridStyle",
        "name": "grid",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface GridItemProperties {
       colSpan?: ConditionalValue<number>
    	rowSpan?: ConditionalValue<number>
    	colStart?: ConditionalValue<number>
    	rowStart?: ConditionalValue<number>
    	colEnd?: ConditionalValue<number>
    	rowEnd?: ConditionalValue<number>
    }


    interface GridItemStyles extends GridItemProperties, DistributiveOmit<SystemStyleObject, keyof GridItemProperties > {}

    interface GridItemPatternFn {
      (styles?: GridItemStyles): string
      raw: (styles?: GridItemStyles) => SystemStyleObject
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
    gridItem.raw = getGridItemStyle",
        "name": "grid-item",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface WrapProperties {
       gap?: PropertyValue<'gap'>
    	rowGap?: PropertyValue<'gap'>
    	columnGap?: PropertyValue<'gap'>
    	align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    }


    interface WrapStyles extends WrapProperties, DistributiveOmit<SystemStyleObject, keyof WrapProperties > {}

    interface WrapPatternFn {
      (styles?: WrapStyles): string
      raw: (styles?: WrapStyles) => SystemStyleObject
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
    wrap.raw = getWrapStyle",
        "name": "wrap",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface ContainerProperties {
       
    }


    interface ContainerStyles extends ContainerProperties, DistributiveOmit<SystemStyleObject, keyof ContainerProperties > {}

    interface ContainerPatternFn {
      (styles?: ContainerStyles): string
      raw: (styles?: ContainerStyles) => SystemStyleObject
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
    container.raw = getContainerStyle",
        "name": "container",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface DividerProperties {
       orientation?: ConditionalValue<\\"horizontal\\" | \\"vertical\\">
    	thickness?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"borderWidth\\"]>
    	color?: ConditionalValue<Tokens[\\"colors\\"] | Properties[\\"borderColor\\"]>
    }


    interface DividerStyles extends DividerProperties, DistributiveOmit<SystemStyleObject, keyof DividerProperties > {}

    interface DividerPatternFn {
      (styles?: DividerStyles): string
      raw: (styles?: DividerStyles) => SystemStyleObject
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
    divider.raw = getDividerStyle",
        "name": "divider",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface FloatProperties {
       offsetX?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"left\\"]>
    	offsetY?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"top\\"]>
    	offset?: ConditionalValue<Tokens[\\"spacing\\"] | Properties[\\"top\\"]>
    	placement?: ConditionalValue<\\"bottom-end\\" | \\"bottom-start\\" | \\"top-end\\" | \\"top-start\\" | \\"bottom-center\\" | \\"top-center\\" | \\"middle-center\\" | \\"middle-end\\" | \\"middle-start\\">
    }


    interface FloatStyles extends FloatProperties, DistributiveOmit<SystemStyleObject, keyof FloatProperties > {}

    interface FloatPatternFn {
      (styles?: FloatStyles): string
      raw: (styles?: FloatStyles) => SystemStyleObject
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
    float.raw = getFloatStyle",
        "name": "float",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface BleedProperties {
       inline?: PropertyValue<'marginInline'>
    	block?: PropertyValue<'marginBlock'>
    }


    interface BleedStyles extends BleedProperties, DistributiveOmit<SystemStyleObject, keyof BleedProperties > {}

    interface BleedPatternFn {
      (styles?: BleedStyles): string
      raw: (styles?: BleedStyles) => SystemStyleObject
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
    bleed.raw = getBleedStyle",
        "name": "bleed",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types/index';
    import type { Properties } from '../types/csstype';
    import type { PropertyValue } from '../types/prop-type';
    import type { DistributiveOmit } from '../types/system-types';
    import type { Tokens } from '../tokens/index';

    export interface VisuallyHiddenProperties {
       
    }


    interface VisuallyHiddenStyles extends VisuallyHiddenProperties, DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties > {}

    interface VisuallyHiddenPatternFn {
      (styles?: VisuallyHiddenStyles): string
      raw: (styles?: VisuallyHiddenStyles) => SystemStyleObject
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
    visuallyHidden.raw = getVisuallyHiddenStyle",
        "name": "visually-hidden",
      },
    ]
  `)
})
