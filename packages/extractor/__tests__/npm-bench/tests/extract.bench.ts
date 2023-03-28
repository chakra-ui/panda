import { bench, describe } from 'vitest'

import { extract as extract075 } from '@box-extractor/core-0-7-5'
import { extract as extract080 } from '@box-extractor/core-0-8-0'
import { extract as extract084 } from '@box-extractor/core-0-8-4'
import { extract as extract090 } from '@box-extractor/core-0-9-0'
import { Project, ts } from 'ts-morph'
import { extract } from '../../../src/extract'
// @ts-expect-error
import { default as ExtractSample } from '../../ExtractSample?raw'
import { createProject } from '../../createProject'

const project: Project = createProject()
const sourceFile = project.createSourceFile('aaa.tsx', ExtractSample, { scriptKind: ts.ScriptKind.TSX })

const props = ['color', 'backgroundColor', 'zIndex', 'fontSize', 'display', 'mobile', 'tablet', 'desktop', 'css']
const config = {
  ColorBox: {
    properties: props,
    map: new Map(props.map((prop) => [prop, true])),
    object: Object.fromEntries(props.map((prop) => [prop, true])),
  },
}

const iterations = 3000

describe('extract across versions', () => {
  bench(
    '0.7.5',
    () => {
      extract075({ ast: sourceFile, components: config })
    },
    { iterations },
  )

  bench(
    '0.8.0',
    () => {
      extract080({
        ast: sourceFile,
        components: {
          matchTag: ({ tagName }) => Boolean(config[tagName]),
          matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
        },
      })
    },
    { iterations },
  )

  bench(
    '0.8.4',
    () => {
      extract084({
        ast: sourceFile,
        components: {
          matchTag: ({ tagName }) => Boolean(config[tagName]),
          matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
        },
      })
    },
    { iterations },
  )

  bench(
    '0.9.0',
    () => {
      extract090({
        ast: sourceFile,
        components: {
          matchTag: ({ tagName }) => Boolean(config[tagName]),
          matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
        },
      })
    },
    { iterations },
  )

  bench(
    'local',
    () => {
      extract({
        ast: sourceFile,
        components: {
          matchTag: ({ tagName }) => Boolean(config[tagName]),
          matchProp: ({ tagName, propName }) => config[tagName].map.get(propName),
        },
      })
    },
    { iterations },
  )
})
