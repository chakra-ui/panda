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
    import type { Tokens } from '../types/token'

    export type StackProperties = {
       align?: PropertyValue<'alignItems'>
    	justify?: PropertyValue<'justifyContent'>
    	direction?: PropertyValue<'flexDirection'>
    	gap?: ConditionalValue<Tokens[\\"spacing\\"]>
    }

            
    type StackOptions = StackProperties & Omit<SystemStyleObject, keyof StackProperties >


    export declare function stack(options?: StackOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const stackConfig = {
    transform(props) {
      const { align = \\"flex-start\\", justify, direction = \\"column\\", gap = \\"10px\\" } = props;
      return {
        display: \\"flex\\",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        minWidth: \\"0\\"
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
    import type { Tokens } from '../types/token'

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
      const { axis } = props;
      return {
        position: \\"absolute\\",
        top: map(axis, (v) => v === \\"x\\" ? \\"auto\\" : \\"50%\\"),
        left: map(axis, (v) => v === \\"y\\" ? \\"auto\\" : \\"50%\\"),
        transform: map(
          axis,
          (v) => v === \\"both\\" ? \\"translate(-50%, -50%)\\" : v === \\"x\\" ? \\"translateX(-50%)\\" : \\"translateY(-50%)\\"
        )
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
    import type { Tokens } from '../types/token'

    export type SimpleGridProperties = {
       gap?: ConditionalValue<Tokens[\\"spacing\\"]>
    	columns?: ConditionalValue<number>
    	minChildWidth?: ConditionalValue<Tokens[\\"sizes\\"] | Properties[\\"width\\"]>
    }

            
    type SimpleGridOptions = SimpleGridProperties & Omit<SystemStyleObject, keyof SimpleGridProperties >


    export declare function simpleGrid(options?: SimpleGridOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const simpleGridConfig = {
    transform(props, { map }) {
      const { gap, columns, minChildWidth } = props;
      return {
        display: \\"grid\\",
        gridGap: gap,
        gridTemplateColumns: columns ? map(columns, (v) => \`repeat(\${v}, minmax(0, 1fr))\`) : map(minChildWidth, (v) => \`repeat(auto-fill, minmax(\${v}, 1fr))\`)
      };
    }}

    export const getSimpleGridStyle = (styles = {}) => simpleGridConfig.transform(styles, { map: mapObject })

    export const simpleGrid = (styles) => css(getSimpleGridStyle(styles))",
        "name": "simple-grid",
      },
      {
        "dts": "import type { SystemStyleObject, ConditionalValue } from '../types'
    import type { PropertyValue } from '../types/prop-type'
    import type { Properties } from '../types/csstype'
    import type { Tokens } from '../types/token'

    export type GridItemProperties = {
       colSpan?: ConditionalValue<number>
    }

            
    type GridItemOptions = GridItemProperties & Omit<SystemStyleObject, keyof GridItemProperties >


    export declare function gridItem(options?: GridItemOptions): string
    ",
        "js": "import { mapObject } from '../helpers.mjs';
    import { css } from '../css/index.mjs';

    const gridItemConfig = {
    transform(props, { map }) {
      const { colSpan } = props;
      return {
        gridColumn: map(colSpan, (v) => v ? \`span \${v}\` : \\"auto\\")
      };
    }}

    export const getGridItemStyle = (styles = {}) => gridItemConfig.transform(styles, { map: mapObject })

    export const gridItem = (styles) => css(getGridItemStyle(styles))",
        "name": "grid-item",
      },
    ]
  `)
})
