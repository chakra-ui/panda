import { fixtureDefaults } from '@pandacss/fixture'
import type { StaticCssOptions } from '@pandacss/types'
import { bench, describe } from 'vitest'
import { Context } from '../src/context'

describe('static-css real-world performance', () => {
  // Real-world token configuration from user's scenario
  const fontSizes = {
    '1': { value: '0.5em' },
    '2': { value: '0.75em' },
    '3': { value: '0.875em' },
    '4': { value: '1em' },
    '5': { value: '1.125em' },
    '6': { value: '1.25em' },
    '7': { value: '1.5em' },
    '8': { value: '1.875em' },
    '9': { value: '2.25em' },
    '10': { value: '3em' },
    '11': { value: '3.75em' },
    '12': { value: '4.5em' },
    '13': { value: '6em' },
    '14': { value: '8em' },
    '15': { value: '10em' },
    '16': { value: '12em' },
    '17': { value: '14em' },
    '18': { value: '16em' },
    '19': { value: '18em' },
    '20': { value: '20em' },
    '21': { value: '22em' },
    '22': { value: '24em' },
    '23': { value: '26em' },
    '24': { value: '28em' },
    '25': { value: '30em' },
    '26': { value: '32em' },
    '27': { value: '34em' },
    '28': { value: '36em' },
    '29': { value: '38em' },
    '30': { value: '40em' },
    '31': { value: '42em' },
    '32': { value: '44em' },
    '33': { value: '46em' },
    '34': { value: '48em' },
    '35': { value: '50em' },
  }

  const fontSizeOptions = Object.keys(fontSizes)

  const sizesWithNumbers = {
    auto: { value: 'auto' },
    full: { value: '100%' },
    '1/2': { value: '50%' },
    '1/3': { value: '33.333333%' },
    '2/3': { value: '66.666667%' },
    '1/4': { value: '25%' },
    '3/4': { value: '75%' },
    '1/5': { value: '20%' },
    '2/5': { value: '40%' },
    '3/5': { value: '60%' },
    '4/5': { value: '80%' },
    '1/6': { value: '16.666667%' },
    '5/6': { value: '83.333333%' },
    '0': { value: '0' },
    '1': { value: '0.25em' },
    '2': { value: '0.5em' },
    '3': { value: '0.75em' },
    '4': { value: '1em' },
    '5': { value: '1.25em' },
    '6': { value: '1.5em' },
    '7': { value: '1.75em' },
    '8': { value: '2em' },
    '9': { value: '2.25em' },
    '10': { value: '2.5em' },
    '11': { value: '2.75em' },
    '12': { value: '3em' },
    '13': { value: '3.25em' },
    '14': { value: '3.5em' },
    '15': { value: '3.75em' },
    '16': { value: '4em' },
    '17': { value: '4.25em' },
    '18': { value: '4.5em' },
    '19': { value: '4.75em' },
    '20': { value: '5em' },
    '21': { value: '5.25em' },
    '22': { value: '5.5em' },
    '23': { value: '5.75em' },
    '24': { value: '6em' },
    '25': { value: '6.25em' },
    '26': { value: '6.5em' },
    '27': { value: '6.75em' },
    '28': { value: '7em' },
    '29': { value: '7.25em' },
    '30': { value: '7.5em' },
    '31': { value: '7.75em' },
    '32': { value: '8em' },
    '33': { value: '8.25em' },
    '34': { value: '8.5em' },
    '35': { value: '8.75em' },
    '36': { value: '9em' },
    '37': { value: '9.25em' },
    '38': { value: '9.5em' },
    '39': { value: '9.75em' },
    '40': { value: '10em' },
    '41': { value: '10.25em' },
    '42': { value: '10.5em' },
    '43': { value: '10.75em' },
    '44': { value: '11em' },
    '45': { value: '11.25em' },
    '46': { value: '11.5em' },
    '47': { value: '11.75em' },
    '48': { value: '12em' },
    '49': { value: '12.25em' },
    '50': { value: '12.5em' },
    '51': { value: '12.75em' },
    '52': { value: '13em' },
    '53': { value: '13.25em' },
    '54': { value: '13.5em' },
    '55': { value: '13.75em' },
    '56': { value: '14em' },
    '57': { value: '14.25em' },
    '58': { value: '14.5em' },
    '59': { value: '14.75em' },
    '60': { value: '15em' },
    '61': { value: '15.25em' },
    '62': { value: '15.5em' },
    '63': { value: '15.75em' },
    '64': { value: '16em' },
    '65': { value: '16.25em' },
    '66': { value: '16.5em' },
    '67': { value: '16.75em' },
    '68': { value: '17em' },
    '69': { value: '17.25em' },
    '70': { value: '17.5em' },
    '71': { value: '17.75em' },
    '72': { value: '18em' },
    '73': { value: '18.25em' },
    '74': { value: '18.5em' },
    '75': { value: '18.75em' },
    '76': { value: '19em' },
    '77': { value: '19.25em' },
    '78': { value: '19.5em' },
    '79': { value: '19.75em' },
    '80': { value: '20em' },
    '81': { value: '20.25em' },
    '82': { value: '20.5em' },
    '83': { value: '20.75em' },
    '84': { value: '21em' },
    '85': { value: '21.25em' },
    '86': { value: '21.5em' },
    '87': { value: '21.75em' },
    '88': { value: '22em' },
    '89': { value: '22.25em' },
    '90': { value: '22.5em' },
    '91': { value: '22.75em' },
    '92': { value: '23em' },
    '93': { value: '23.25em' },
    '94': { value: '23.5em' },
    '95': { value: '23.75em' },
    '96': { value: '24em' },
    '97': { value: '24.25em' },
    '98': { value: '24.5em' },
    '99': { value: '24.75em' },
    '100': { value: '25em' },
    '101': { value: '25.25em' },
    '102': { value: '25.5em' },
    '103': { value: '25.75em' },
    '104': { value: '26em' },
    '105': { value: '26.25em' },
    '106': { value: '26.5em' },
    '107': { value: '26.75em' },
    '108': { value: '27em' },
    '109': { value: '27.25em' },
    '110': { value: '27.5em' },
    '111': { value: '27.75em' },
    '112': { value: '28em' },
    '113': { value: '28.25em' },
    '114': { value: '28.5em' },
    '115': { value: '28.75em' },
    '116': { value: '29em' },
    '117': { value: '29.25em' },
    '118': { value: '29.5em' },
    '119': { value: '29.75em' },
    '120': { value: '30em' },
  }

  const colors = {
    red: { 500: { value: 'red500' }, 600: { value: 'red600' } },
    blue: { 500: { value: 'blue500' }, 600: { value: 'blue600' } },
    green: { 500: { value: 'green500' }, 600: { value: 'green600' } },
  }

  const { hooks, ...defaults } = fixtureDefaults
  const conf = {
    hooks,
    ...defaults,
    config: {
      ...defaults.config,
      theme: {
        ...defaults.config.theme,
        containerNames: ['pb'],
        containerSizes: {
          sm: '24rem',
          md: '28rem',
          lg: '32rem',
          xl: '36rem',
        },
        tokens: {
          ...defaults.config.theme?.tokens,
          fontSizes,
          sizes: sizesWithNumbers,
          spacing: sizesWithNumbers,
          colors,
        },
      },
    },
  } as typeof fixtureDefaults

  const ctx = new Context(conf)

  // Real-world staticCss config from user
  const realWorldConfig: StaticCssOptions = {
    css: [
      // First rule set: Container queries with specific values
      {
        responsive: false,
        conditions: ['@pb/sm', '@pb/md', '@pb/lg', '@pb/xl'],
        properties: {
          fontSize: fontSizeOptions,
          display: ['inline', 'inline-block', 'block', 'flex', 'grid', 'none'],
          position: ['relative', 'absolute', 'fixed', 'sticky'],
          flexDirection: ['row', 'column'],
          alignItems: ['start', 'center', 'flex-start', 'flex-end'],
          alignSelf: ['stretch', 'auto'],
          justifyContent: ['center', 'flex-start', 'flex-end', 'space-between'],
          padding: Object.keys(sizesWithNumbers),
          paddingTop: Object.keys(sizesWithNumbers),
          paddingBottom: Object.keys(sizesWithNumbers),
          paddingLeft: Object.keys(sizesWithNumbers),
          paddingRight: Object.keys(sizesWithNumbers),
          paddingX: Object.keys(sizesWithNumbers),
          paddingY: Object.keys(sizesWithNumbers),
          margin: Object.keys(sizesWithNumbers),
          marginTop: Object.keys(sizesWithNumbers),
          marginBottom: Object.keys(sizesWithNumbers),
          marginLeft: Object.keys(sizesWithNumbers),
          marginRight: Object.keys(sizesWithNumbers),
          marginX: Object.keys(sizesWithNumbers),
          marginY: Object.keys(sizesWithNumbers),
          gap: Object.keys(sizesWithNumbers),
          gridTemplateColumns: [
            'repeat(1, minmax(0, 1fr))',
            'repeat(2, minmax(0, 1fr))',
            'repeat(3, minmax(0, 1fr))',
            'repeat(4, minmax(0, 1fr))',
            'repeat(5, minmax(0, 1fr))',
            'repeat(6, minmax(0, 1fr))',
            'repeat(7, minmax(0, 1fr))',
            'repeat(8, minmax(0, 1fr))',
            'repeat(9, minmax(0, 1fr))',
            'repeat(10, minmax(0, 1fr))',
            'repeat(11, minmax(0, 1fr))',
            'repeat(12, minmax(0, 1fr))',
          ],
          objectFit: ['cover', 'contain', 'fill', 'none'],
          top: Object.keys(sizesWithNumbers),
          left: Object.keys(sizesWithNumbers),
          right: Object.keys(sizesWithNumbers),
          bottom: Object.keys(sizesWithNumbers),
          inset: ['0', 'auto'],
          overflow: ['hidden', 'auto', 'scroll', 'visible'],
          overflowX: ['hidden', 'auto', 'scroll', 'visible'],
          overflowY: ['hidden', 'auto', 'scroll', 'visible'],
          cursor: ['pointer', 'default', 'not-allowed'],
          transform: ['none', 'translateX(0)', 'translateY(0)', 'scale(1)', 'rotate(0deg)'],
          translate: ['0', '50%', '100%'],
          transition: ['all'],
          transitionDuration: ['100', '200', '300', '400', '500'],
          boxShadow: ['none', 'sm', 'md', 'lg', 'xl'],
          visibility: ['visible', 'hidden'],
          backdropFilter: ['blur(4px)', 'none'],
          backdropBlur: ['sm', 'md', 'lg'],
          transformOrigin: ['top', 'bottom', 'left', 'right'],
          scale: ['0', '0.95', '1', '1.05'],
        },
      },
      // Second rule set: Interactive states with wildcards
      {
        responsive: false,
        conditions: ['_groupHover', '_hover', '_focus', '_active', '_disabled'],
        properties: {
          fontSize: fontSizeOptions,
          color: ['*'],
          backgroundColor: ['*'],
          opacity: ['*'],
          width: ['*'],
          minWidth: ['*'],
          maxWidth: ['*'],
          height: ['*'],
          minHeight: ['*'],
          maxHeight: ['*'],
          stroke: ['*'],
          strokeWidth: ['none', 'thin', 'medium', 'thick'],
          borderRadius: ['*'],
          border: ['*'],
          borderWidth: ['*'],
          borderColor: ['*'],
          borderStyle: ['*'],
          borderTop: ['*'],
          borderBottom: ['*'],
          borderLeft: ['*'],
          borderRight: ['*'],
          textDecoration: ['underline', 'none'],
          ringColor: ['*'],
          ringWidth: ['0', '1', '2', '4', '8'],
          ringOpacity: ['0', '0.2', '0.4', '0.6', '0.8', '1'],
          ringOffsetWidth: ['0', '1', '2', '4'],
          ringOffsetColor: ['*'],
          transitionProperty: ['all', 'opacity', 'transform'],
          transitionTimingFunction: ['ease-in', 'ease-out', 'ease-in-out'],
          visibility: ['visible', 'hidden'],
          backdropFilter: ['blur(4px)', 'none'],
          backdropBlur: ['sm', 'md', 'lg'],
          transformOrigin: ['top', 'bottom', 'left', 'right'],
          scale: ['0', '0.95', '1', '1.05'],
          translate: ['0', '50%', '100%'],
        },
      },
      // Third rule set: Base styles without conditions
      {
        responsive: false,
        conditions: [],
        properties: {
          fontWeight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
          zIndex: ['auto', '0', '10', '20', '30', '40', '50'],
          pointerEvents: ['none', 'auto'],
          userSelect: ['none', 'text'],
        },
      },
    ],
  }

  bench(
    'real-world config: initial processing (cold cache)',
    () => {
      // Fresh clone for each iteration to ensure cold cache
      const staticCss = ctx.staticCss.clone()
      staticCss.process(realWorldConfig)
    },
    { warmupIterations: 1, iterations: 5 },
  )

  bench(
    'real-world config: subsequent processing (warm cache)',
    () => {
      // Reuse same instance to test wildcard memoization benefit
      ctx.staticCss.process(realWorldConfig)
    },
    { warmupIterations: 2, iterations: 10 },
  )

  bench(
    'real-world config: rule set 1 only (container queries + specific values)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [realWorldConfig.css![0]],
      })
    },
    { warmupIterations: 2, iterations: 10 },
  )

  bench(
    'real-world config: rule set 2 only (interactive states + wildcards)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [realWorldConfig.css![1]],
      })
    },
    { warmupIterations: 1, iterations: 5 },
  )

  bench(
    'real-world config: rule set 3 only (base styles)',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [realWorldConfig.css![2]],
      })
    },
    { warmupIterations: 5, iterations: 20 },
  )

  // Test wildcard memoization specifically
  bench(
    'wildcard memoization benefit: 3 consecutive calls',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({ css: [realWorldConfig.css![1]] })
      staticCss.process({ css: [realWorldConfig.css![1]] })
      staticCss.process({ css: [realWorldConfig.css![1]] })
    },
    { warmupIterations: 2, iterations: 10 },
  )

  // Test container query performance
  bench(
    'container queries: @pb/sm, @pb/md, @pb/lg, @pb/xl',
    () => {
      const staticCss = ctx.staticCss.clone()
      staticCss.process({
        css: [
          {
            conditions: ['@pb/sm', '@pb/md', '@pb/lg', '@pb/xl'],
            properties: {
              fontSize: fontSizeOptions,
              padding: Object.keys(sizesWithNumbers).slice(0, 20), // Subset for speed
            },
          },
        ],
      })
    },
    { warmupIterations: 3, iterations: 15 },
  )

  // Measure CSS output size
  bench(
    'full real-world config with CSS generation',
    () => {
      const staticCss = ctx.staticCss.clone()
      const result = staticCss.process(realWorldConfig)
      const css = result.sheet.toCss()
      // Force evaluation
      css.length
    },
    { warmupIterations: 1, iterations: 3 },
  )
})
