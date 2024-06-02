import { fixtureDefaults } from '@pandacss/fixture'
import type { LoadConfigResult } from '@pandacss/types'
import { expect, test } from 'vitest'
import { Generator } from '../src'
import { getPatternsArtifacts } from '../src/artifacts/js/pattern'
import { ArtifactMap } from '../src/artifacts/artifact-map'

const patterns = (config: LoadConfigResult) => {
  const generator = new Generator(config)
  const map = new ArtifactMap()
  getPatternsArtifacts(generator).forEach((artifact) => map.addFile(artifact))
  return map.generate(generator)
}

test('should generate pattern', () => {
  expect(patterns(fixtureDefaults)).toMatchInlineSnapshot(`
    [
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const cqConfig = {
    transform(props) {
      const { name, type, ...rest } = props;
      return {
        containerType: type,
        containerName: name,
        ...rest
      };
    },
    defaultValues:{type:'inline-size'}}

              export const getCqStyle = (styles = {}) => {
                const _styles = getPatternStyles(cqConfig, styles)
                return cqConfig.transform(_styles, patternFns)
              }

              export const cq = (styles) => css(getCqStyle(styles))
              cq.raw = getCqStyle
              ",
        "id": "patterns/cq.js",
        "path": [
          "styled-system",
          "patterns",
          "cq.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface CqProperties {
                 name?: ConditionalValue<Tokens["containerNames"] | Properties["containerName"]>
    	type?: SystemProperties["containerType"]
              }

              
                  interface CqStyles extends CqProperties, DistributiveOmit<SystemStyleObject, keyof CqProperties > {}

                  interface CqPatternFn {
                    (styles?: CqStyles): string
                    raw: (styles?: CqStyles) => SystemStyleObject
                  }

                  
                  export declare const cq: CqPatternFn;
                  

             ",
        "id": "patterns/cq.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "cq.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const visuallyHiddenConfig = {
    transform(props) {
      return {
        srOnly: true,
        ...props
      };
    }}

              export const getVisuallyHiddenStyle = (styles = {}) => {
                const _styles = getPatternStyles(visuallyHiddenConfig, styles)
                return visuallyHiddenConfig.transform(_styles, patternFns)
              }

              export const visuallyHidden = (styles) => css(getVisuallyHiddenStyle(styles))
              visuallyHidden.raw = getVisuallyHiddenStyle
              ",
        "id": "patterns/visually-hidden.js",
        "path": [
          "styled-system",
          "patterns",
          "visually-hidden.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface VisuallyHiddenProperties {
                 
              }

              
                  interface VisuallyHiddenStyles extends VisuallyHiddenProperties, DistributiveOmit<SystemStyleObject, keyof VisuallyHiddenProperties > {}

                  interface VisuallyHiddenPatternFn {
                    (styles?: VisuallyHiddenStyles): string
                    raw: (styles?: VisuallyHiddenStyles) => SystemStyleObject
                  }

                  
                  export declare const visuallyHidden: VisuallyHiddenPatternFn;
                  

             ",
        "id": "patterns/visually-hidden.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "visually-hidden.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const bleedConfig = {
    transform(props, { map, isCssUnit, isCssVar }) {
      const { inline, block, ...rest } = props;
      const valueFn = (v) => isCssUnit(v) || isCssVar(v) ? v : \`token(spacing.\${v}, \${v})\`;
      return {
        "--bleed-x": map(inline, valueFn),
        "--bleed-y": map(block, valueFn),
        marginInline: "calc(var(--bleed-x, 0) * -1)",
        marginBlock: "calc(var(--bleed-y, 0) * -1)",
        ...rest
      };
    },
    defaultValues:{inline:'0',block:'0'}}

              export const getBleedStyle = (styles = {}) => {
                const _styles = getPatternStyles(bleedConfig, styles)
                return bleedConfig.transform(_styles, patternFns)
              }

              export const bleed = (styles) => css(getBleedStyle(styles))
              bleed.raw = getBleedStyle
              ",
        "id": "patterns/bleed.js",
        "path": [
          "styled-system",
          "patterns",
          "bleed.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface BleedProperties {
                 inline?: SystemProperties["marginInline"]
    	block?: SystemProperties["marginBlock"]
              }

              
                  interface BleedStyles extends BleedProperties, DistributiveOmit<SystemStyleObject, keyof BleedProperties > {}

                  interface BleedPatternFn {
                    (styles?: BleedStyles): string
                    raw: (styles?: BleedStyles) => SystemStyleObject
                  }

                  
                  export declare const bleed: BleedPatternFn;
                  

             ",
        "id": "patterns/bleed.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "bleed.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const floatConfig = {
    transform(props, { map }) {
      const { offset, offsetX, offsetY, placement, ...rest } = props;
      return {
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        insetBlockStart: map(placement, (v) => {
          const [side] = v.split("-");
          const map2 = { top: offsetY, middle: "50%", bottom: "auto" };
          return map2[side];
        }),
        insetBlockEnd: map(placement, (v) => {
          const [side] = v.split("-");
          const map2 = { top: "auto", middle: "50%", bottom: offsetY };
          return map2[side];
        }),
        insetInlineStart: map(placement, (v) => {
          const [, align] = v.split("-");
          const map2 = { start: offsetX, center: "50%", end: "auto" };
          return map2[align];
        }),
        insetInlineEnd: map(placement, (v) => {
          const [, align] = v.split("-");
          const map2 = { start: "auto", center: "50%", end: offsetX };
          return map2[align];
        }),
        translate: map(placement, (v) => {
          const [side, align] = v.split("-");
          const mapX = { start: "-50%", center: "-50%", end: "50%" };
          const mapY = { top: "-50%", middle: "-50%", bottom: "50%" };
          return \`\${mapX[align]} \${mapY[side]}\`;
        }),
        ...rest
      };
    },
    defaultValues(props) {
      const offset = props.offset || "0";
      return { offset, offsetX: offset, offsetY: offset, placement: "top-end" };
    }}

              export const getFloatStyle = (styles = {}) => {
                const _styles = getPatternStyles(floatConfig, styles)
                return floatConfig.transform(_styles, patternFns)
              }

              export const float = (styles) => css(getFloatStyle(styles))
              float.raw = getFloatStyle
              ",
        "id": "patterns/float.js",
        "path": [
          "styled-system",
          "patterns",
          "float.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface FloatProperties {
                 offsetX?: ConditionalValue<Tokens["spacing"] | Properties["left"]>
    	offsetY?: ConditionalValue<Tokens["spacing"] | Properties["top"]>
    	offset?: ConditionalValue<Tokens["spacing"] | Properties["top"]>
    	placement?: ConditionalValue<"bottom-end" | "bottom-start" | "top-end" | "top-start" | "bottom-center" | "top-center" | "middle-center" | "middle-end" | "middle-start">
              }

              
                  interface FloatStyles extends FloatProperties, DistributiveOmit<SystemStyleObject, keyof FloatProperties > {}

                  interface FloatPatternFn {
                    (styles?: FloatStyles): string
                    raw: (styles?: FloatStyles) => SystemStyleObject
                  }

                  
                  export declare const float: FloatPatternFn;
                  

             ",
        "id": "patterns/float.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "float.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const dividerConfig = {
    transform(props, { map }) {
      const { orientation, thickness, color, ...rest } = props;
      return {
        "--thickness": thickness,
        width: map(orientation, (v) => v === "vertical" ? void 0 : "100%"),
        height: map(orientation, (v) => v === "horizontal" ? void 0 : "100%"),
        borderBlockEndWidth: map(orientation, (v) => v === "horizontal" ? "var(--thickness)" : void 0),
        borderInlineEndWidth: map(orientation, (v) => v === "vertical" ? "var(--thickness)" : void 0),
        borderColor: color,
        ...rest
      };
    },
    defaultValues:{orientation:'horizontal',thickness:'1px'}}

              export const getDividerStyle = (styles = {}) => {
                const _styles = getPatternStyles(dividerConfig, styles)
                return dividerConfig.transform(_styles, patternFns)
              }

              export const divider = (styles) => css(getDividerStyle(styles))
              divider.raw = getDividerStyle
              ",
        "id": "patterns/divider.js",
        "path": [
          "styled-system",
          "patterns",
          "divider.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface DividerProperties {
                 orientation?: ConditionalValue<"horizontal" | "vertical">
    	thickness?: ConditionalValue<Tokens["sizes"] | Properties["borderWidth"]>
    	color?: ConditionalValue<Tokens["colors"] | Properties["borderColor"]>
              }

              
                  interface DividerStyles extends DividerProperties, DistributiveOmit<SystemStyleObject, keyof DividerProperties > {}

                  interface DividerPatternFn {
                    (styles?: DividerStyles): string
                    raw: (styles?: DividerStyles) => SystemStyleObject
                  }

                  
                  export declare const divider: DividerPatternFn;
                  

             ",
        "id": "patterns/divider.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "divider.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const containerConfig = {
    transform(props) {
      return {
        position: "relative",
        maxWidth: "8xl",
        mx: "auto",
        px: { base: "4", md: "6", lg: "8" },
        ...props
      };
    }}

              export const getContainerStyle = (styles = {}) => {
                const _styles = getPatternStyles(containerConfig, styles)
                return containerConfig.transform(_styles, patternFns)
              }

              export const container = (styles) => css(getContainerStyle(styles))
              container.raw = getContainerStyle
              ",
        "id": "patterns/container.js",
        "path": [
          "styled-system",
          "patterns",
          "container.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface ContainerProperties {
                 
              }

              
                  interface ContainerStyles extends ContainerProperties, DistributiveOmit<SystemStyleObject, keyof ContainerProperties > {}

                  interface ContainerPatternFn {
                    (styles?: ContainerStyles): string
                    raw: (styles?: ContainerStyles) => SystemStyleObject
                  }

                  
                  export declare const container: ContainerPatternFn;
                  

             ",
        "id": "patterns/container.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "container.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const wrapConfig = {
    transform(props) {
      const { columnGap, rowGap, gap = columnGap || rowGap ? void 0 : "10px", align, justify, ...rest } = props;
      return {
        display: "flex",
        flexWrap: "wrap",
        alignItems: align,
        justifyContent: justify,
        gap,
        columnGap,
        rowGap,
        ...rest
      };
    }}

              export const getWrapStyle = (styles = {}) => {
                const _styles = getPatternStyles(wrapConfig, styles)
                return wrapConfig.transform(_styles, patternFns)
              }

              export const wrap = (styles) => css(getWrapStyle(styles))
              wrap.raw = getWrapStyle
              ",
        "id": "patterns/wrap.js",
        "path": [
          "styled-system",
          "patterns",
          "wrap.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface WrapProperties {
                 gap?: SystemProperties["gap"]
    	rowGap?: SystemProperties["gap"]
    	columnGap?: SystemProperties["gap"]
    	align?: SystemProperties["alignItems"]
    	justify?: SystemProperties["justifyContent"]
              }

              
                  interface WrapStyles extends WrapProperties, DistributiveOmit<SystemStyleObject, keyof WrapProperties > {}

                  interface WrapPatternFn {
                    (styles?: WrapStyles): string
                    raw: (styles?: WrapStyles) => SystemStyleObject
                  }

                  
                  export declare const wrap: WrapPatternFn;
                  

             ",
        "id": "patterns/wrap.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "wrap.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const gridItemConfig = {
    transform(props, { map }) {
      const { colSpan, rowSpan, colStart, rowStart, colEnd, rowEnd, ...rest } = props;
      const spanFn = (v) => v === "auto" ? v : \`span \${v}\`;
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

              export const getGridItemStyle = (styles = {}) => {
                const _styles = getPatternStyles(gridItemConfig, styles)
                return gridItemConfig.transform(_styles, patternFns)
              }

              export const gridItem = (styles) => css(getGridItemStyle(styles))
              gridItem.raw = getGridItemStyle
              ",
        "id": "patterns/grid-item.js",
        "path": [
          "styled-system",
          "patterns",
          "grid-item.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

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
        "id": "patterns/grid-item.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "grid-item.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const gridConfig = {
    transform(props, { map, isCssUnit }) {
      const { columnGap, rowGap, gap, columns, minChildWidth, ...rest } = props;
      const getValue = (v) => isCssUnit(v) ? v : \`token(sizes.\${v}, \${v})\`;
      return {
        display: "grid",
        gridTemplateColumns: columns != null ? map(columns, (v) => \`repeat(\${v}, minmax(0, 1fr))\`) : minChildWidth != null ? map(minChildWidth, (v) => \`repeat(auto-fit, minmax(\${getValue(v)}, 1fr))\`) : void 0,
        gap,
        columnGap,
        rowGap,
        ...rest
      };
    },
    defaultValues(props) {
      return { gap: props.columnGap || props.rowGap ? void 0 : "10px" };
    }}

              export const getGridStyle = (styles = {}) => {
                const _styles = getPatternStyles(gridConfig, styles)
                return gridConfig.transform(_styles, patternFns)
              }

              export const grid = (styles) => css(getGridStyle(styles))
              grid.raw = getGridStyle
              ",
        "id": "patterns/grid.js",
        "path": [
          "styled-system",
          "patterns",
          "grid.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface GridProperties {
                 gap?: SystemProperties["gap"]
    	columnGap?: SystemProperties["gap"]
    	rowGap?: SystemProperties["gap"]
    	columns?: ConditionalValue<number>
    	minChildWidth?: ConditionalValue<Tokens["sizes"] | Properties["width"]>
              }

              
                  interface GridStyles extends GridProperties, DistributiveOmit<SystemStyleObject, keyof GridProperties > {}

                  interface GridPatternFn {
                    (styles?: GridStyles): string
                    raw: (styles?: GridStyles) => SystemStyleObject
                  }

                  
                  export declare const grid: GridPatternFn;
                  

             ",
        "id": "patterns/grid.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "grid.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const aspectRatioConfig = {
    transform(props, { map }) {
      const { ratio = 4 / 3, ...rest } = props;
      return {
        position: "relative",
        _before: {
          content: \`""\`,
          display: "block",
          height: "0",
          paddingBottom: map(ratio, (r) => \`\${1 / r * 100}%\`)
        },
        "&>*": {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          position: "absolute",
          inset: "0",
          width: "100%",
          height: "100%"
        },
        "&>img, &>video": {
          objectFit: "cover"
        },
        ...rest
      };
    }}

              export const getAspectRatioStyle = (styles = {}) => {
                const _styles = getPatternStyles(aspectRatioConfig, styles)
                return aspectRatioConfig.transform(_styles, patternFns)
              }

              export const aspectRatio = (styles) => css(getAspectRatioStyle(styles))
              aspectRatio.raw = getAspectRatioStyle
              ",
        "id": "patterns/aspect-ratio.js",
        "path": [
          "styled-system",
          "patterns",
          "aspect-ratio.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

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
        "id": "patterns/aspect-ratio.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "aspect-ratio.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const linkOverlayConfig = {
    transform(props) {
      return {
        _before: {
          content: '""',
          position: "absolute",
          inset: "0",
          zIndex: "0",
          ...props["_before"]
        },
        ...props
      };
    }}

              export const getLinkOverlayStyle = (styles = {}) => {
                const _styles = getPatternStyles(linkOverlayConfig, styles)
                return linkOverlayConfig.transform(_styles, patternFns)
              }

              export const linkOverlay = (styles) => css(getLinkOverlayStyle(styles))
              linkOverlay.raw = getLinkOverlayStyle
              ",
        "id": "patterns/link-overlay.js",
        "path": [
          "styled-system",
          "patterns",
          "link-overlay.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface LinkOverlayProperties {
                 
              }

              
                  interface LinkOverlayStyles extends LinkOverlayProperties, DistributiveOmit<SystemStyleObject, keyof LinkOverlayProperties > {}

                  interface LinkOverlayPatternFn {
                    (styles?: LinkOverlayStyles): string
                    raw: (styles?: LinkOverlayStyles) => SystemStyleObject
                  }

                  
                  export declare const linkOverlay: LinkOverlayPatternFn;
                  

             ",
        "id": "patterns/link-overlay.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "link-overlay.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const centerConfig = {
    transform(props) {
      const { inline, ...rest } = props;
      return {
        display: inline ? "inline-flex" : "flex",
        alignItems: "center",
        justifyContent: "center",
        ...rest
      };
    }}

              export const getCenterStyle = (styles = {}) => {
                const _styles = getPatternStyles(centerConfig, styles)
                return centerConfig.transform(_styles, patternFns)
              }

              export const center = (styles) => css(getCenterStyle(styles))
              center.raw = getCenterStyle
              ",
        "id": "patterns/center.js",
        "path": [
          "styled-system",
          "patterns",
          "center.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

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
        "id": "patterns/center.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "center.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const circleConfig = {
    transform(props) {
      const { size, ...rest } = props;
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        width: size,
        height: size,
        borderRadius: "9999px",
        ...rest
      };
    }}

              export const getCircleStyle = (styles = {}) => {
                const _styles = getPatternStyles(circleConfig, styles)
                return circleConfig.transform(_styles, patternFns)
              }

              export const circle = (styles) => css(getCircleStyle(styles))
              circle.raw = getCircleStyle
              ",
        "id": "patterns/circle.js",
        "path": [
          "styled-system",
          "patterns",
          "circle.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface CircleProperties {
                 size?: SystemProperties["width"]
              }

              
                  interface CircleStyles extends CircleProperties, DistributiveOmit<SystemStyleObject, keyof CircleProperties > {}

                  interface CirclePatternFn {
                    (styles?: CircleStyles): string
                    raw: (styles?: CircleStyles) => SystemStyleObject
                  }

                  
                  export declare const circle: CirclePatternFn;
                  

             ",
        "id": "patterns/circle.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "circle.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const squareConfig = {
    transform(props) {
      const { size, ...rest } = props;
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        width: size,
        height: size,
        ...rest
      };
    }}

              export const getSquareStyle = (styles = {}) => {
                const _styles = getPatternStyles(squareConfig, styles)
                return squareConfig.transform(_styles, patternFns)
              }

              export const square = (styles) => css(getSquareStyle(styles))
              square.raw = getSquareStyle
              ",
        "id": "patterns/square.js",
        "path": [
          "styled-system",
          "patterns",
          "square.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface SquareProperties {
                 size?: SystemProperties["width"]
              }

              
                  interface SquareStyles extends SquareProperties, DistributiveOmit<SystemStyleObject, keyof SquareProperties > {}

                  interface SquarePatternFn {
                    (styles?: SquareStyles): string
                    raw: (styles?: SquareStyles) => SystemStyleObject
                  }

                  
                  export declare const square: SquarePatternFn;
                  

             ",
        "id": "patterns/square.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "square.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const spacerConfig = {
    transform(props, { map }) {
      const { size, ...rest } = props;
      return {
        alignSelf: "stretch",
        justifySelf: "stretch",
        flex: map(size, (v) => v == null ? "1" : \`0 0 \${v}\`),
        ...rest
      };
    }}

              export const getSpacerStyle = (styles = {}) => {
                const _styles = getPatternStyles(spacerConfig, styles)
                return spacerConfig.transform(_styles, patternFns)
              }

              export const spacer = (styles) => css(getSpacerStyle(styles))
              spacer.raw = getSpacerStyle
              ",
        "id": "patterns/spacer.js",
        "path": [
          "styled-system",
          "patterns",
          "spacer.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface SpacerProperties {
                 size?: ConditionalValue<Tokens["spacing"]>
              }

              
                  interface SpacerStyles extends SpacerProperties, DistributiveOmit<SystemStyleObject, keyof SpacerProperties > {}

                  interface SpacerPatternFn {
                    (styles?: SpacerStyles): string
                    raw: (styles?: SpacerStyles) => SystemStyleObject
                  }

                  
                  export declare const spacer: SpacerPatternFn;
                  

             ",
        "id": "patterns/spacer.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "spacer.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const hstackConfig = {
    transform(props) {
      const { justify, gap, ...rest } = props;
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        gap,
        flexDirection: "row",
        ...rest
      };
    },
    defaultValues:{gap:'10px'}}

              export const getHstackStyle = (styles = {}) => {
                const _styles = getPatternStyles(hstackConfig, styles)
                return hstackConfig.transform(_styles, patternFns)
              }

              export const hstack = (styles) => css(getHstackStyle(styles))
              hstack.raw = getHstackStyle
              ",
        "id": "patterns/hstack.js",
        "path": [
          "styled-system",
          "patterns",
          "hstack.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface HstackProperties {
                 justify?: SystemProperties["justifyContent"]
    	gap?: SystemProperties["gap"]
              }

              
                  interface HstackStyles extends HstackProperties, DistributiveOmit<SystemStyleObject, keyof HstackProperties > {}

                  interface HstackPatternFn {
                    (styles?: HstackStyles): string
                    raw: (styles?: HstackStyles) => SystemStyleObject
                  }

                  
                  export declare const hstack: HstackPatternFn;
                  

             ",
        "id": "patterns/hstack.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "hstack.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const vstackConfig = {
    transform(props) {
      const { justify, gap, ...rest } = props;
      return {
        display: "flex",
        alignItems: "center",
        justifyContent: justify,
        gap,
        flexDirection: "column",
        ...rest
      };
    },
    defaultValues:{gap:'10px'}}

              export const getVstackStyle = (styles = {}) => {
                const _styles = getPatternStyles(vstackConfig, styles)
                return vstackConfig.transform(_styles, patternFns)
              }

              export const vstack = (styles) => css(getVstackStyle(styles))
              vstack.raw = getVstackStyle
              ",
        "id": "patterns/vstack.js",
        "path": [
          "styled-system",
          "patterns",
          "vstack.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface VstackProperties {
                 justify?: SystemProperties["justifyContent"]
    	gap?: SystemProperties["gap"]
              }

              
                  interface VstackStyles extends VstackProperties, DistributiveOmit<SystemStyleObject, keyof VstackProperties > {}

                  interface VstackPatternFn {
                    (styles?: VstackStyles): string
                    raw: (styles?: VstackStyles) => SystemStyleObject
                  }

                  
                  export declare const vstack: VstackPatternFn;
                  

             ",
        "id": "patterns/vstack.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "vstack.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const stackConfig = {
    transform(props) {
      const { align, justify, direction, gap, ...rest } = props;
      return {
        display: "flex",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        ...rest
      };
    },
    defaultValues:{direction:'column',gap:'10px'}}

              export const getStackStyle = (styles = {}) => {
                const _styles = getPatternStyles(stackConfig, styles)
                return stackConfig.transform(_styles, patternFns)
              }

              export const stack = (styles) => css(getStackStyle(styles))
              stack.raw = getStackStyle
              ",
        "id": "patterns/stack.js",
        "path": [
          "styled-system",
          "patterns",
          "stack.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface StackProperties {
                 align?: SystemProperties["alignItems"]
    	justify?: SystemProperties["justifyContent"]
    	direction?: SystemProperties["flexDirection"]
    	gap?: SystemProperties["gap"]
              }

              
                  interface StackStyles extends StackProperties, DistributiveOmit<SystemStyleObject, keyof StackProperties > {}

                  interface StackPatternFn {
                    (styles?: StackStyles): string
                    raw: (styles?: StackStyles) => SystemStyleObject
                  }

                  
                  export declare const stack: StackPatternFn;
                  

             ",
        "id": "patterns/stack.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "stack.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const flexConfig = {
    transform(props) {
      const { direction, align, justify, wrap: wrap2, basis, grow, shrink, ...rest } = props;
      return {
        display: "flex",
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

              export const getFlexStyle = (styles = {}) => {
                const _styles = getPatternStyles(flexConfig, styles)
                return flexConfig.transform(_styles, patternFns)
              }

              export const flex = (styles) => css(getFlexStyle(styles))
              flex.raw = getFlexStyle
              ",
        "id": "patterns/flex.js",
        "path": [
          "styled-system",
          "patterns",
          "flex.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface FlexProperties {
                 align?: SystemProperties["alignItems"]
    	justify?: SystemProperties["justifyContent"]
    	direction?: SystemProperties["flexDirection"]
    	wrap?: SystemProperties["flexWrap"]
    	basis?: SystemProperties["flexBasis"]
    	grow?: SystemProperties["flexGrow"]
    	shrink?: SystemProperties["flexShrink"]
              }

              
                  interface FlexStyles extends FlexProperties, DistributiveOmit<SystemStyleObject, keyof FlexProperties > {}

                  interface FlexPatternFn {
                    (styles?: FlexStyles): string
                    raw: (styles?: FlexStyles) => SystemStyleObject
                  }

                  
                  export declare const flex: FlexPatternFn;
                  

             ",
        "id": "patterns/flex.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "flex.d.ts",
        ],
      },
      {
        "content": "import { css } from '../css/index.mjs'
    import { getPatternStyles, patternFns } from '../helpers.mjs'

              

              const boxConfig = {
    transform(props) {
      return props;
    }}

              export const getBoxStyle = (styles = {}) => {
                const _styles = getPatternStyles(boxConfig, styles)
                return boxConfig.transform(_styles, patternFns)
              }

              export const box = (styles) => css(getBoxStyle(styles))
              box.raw = getBoxStyle
              ",
        "id": "patterns/box.js",
        "path": [
          "styled-system",
          "patterns",
          "box.mjs",
        ],
      },
      {
        "content": "/* eslint-disable */
    import type { Tokens } from '../tokens/index.d.ts'
    import type { Properties } from '../types/csstype.d.ts'
    import type { ConditionalValue, SystemStyleObject } from '../types/index.d.ts'
    import type { SystemProperties } from '../types/style-props.d.ts'
    import type { DistributiveOmit } from '../types/system-types.d.ts'

              export interface BoxProperties {
                 
              }

              
                  interface BoxStyles extends BoxProperties, DistributiveOmit<SystemStyleObject, keyof BoxProperties > {}

                  interface BoxPatternFn {
                    (styles?: BoxStyles): string
                    raw: (styles?: BoxStyles) => SystemStyleObject
                  }

                  
                  export declare const box: BoxPatternFn;
                  

             ",
        "id": "patterns/box.d.ts",
        "path": [
          "styled-system",
          "patterns",
          "box.d.ts",
        ],
      },
    ]
  `)
})
