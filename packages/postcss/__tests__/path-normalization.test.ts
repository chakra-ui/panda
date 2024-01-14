import { expect, it, vi } from 'vitest'

import { pandacss } from '../src/index'
import type postcss from 'postcss'

const MOCK_DEPS = [
  { dir: 'C:/Users/test/Documents/panda-css-app/app', glob: '**/*.{js,jsx,ts,tsx}', type: 'dir-dependency' },
  { file: 'C:/Users/test/Documents/panda-css-app/panda.config.ts', type: 'dependency' },
  { file: 'C:/Users/test/Documents/panda-css-app/node_modules/@pandacss/dev/dist/index.d.ts', type: 'dependency' },
]

vi.mock('@pandacss/node', () => {
  class FakeBuilder {
    /* eslint-disable @typescript-eslint/no-empty-function */
    constructor() {}
    async emit() {}
    extract() {}
    isValidRoot() {
      return true
    }
    registerDependency(fn: (dep: (typeof MOCK_DEPS)[number]) => void) {
      MOCK_DEPS.forEach(fn)
    }
    async setup() {}
    write() {}
    /* eslint-enable @typescript-eslint/no-empty-function */
  }

  return { Builder: FakeBuilder }
})

it('can normalize win32 paths for webpack compatibility', async () => {
  const {
    plugins: [plugin],
  } = pandacss() as postcss.Processor

  const result = {
    messages: [],
    opts: {
      from: 'C:\\Users\\test\\Documents\\panda-css-app\\app\\global.css',
    },
  }

  const root = {
    source: {},
    walk: vi.fn(),
  }

  // @ts-expect-error
  await plugin(root, result)

  expect(result.messages).toStrictEqual([
    {
      dir: 'C:\\Users\\test\\Documents\\panda-css-app\\app',
      glob: '**/*.{js,jsx,ts,tsx}',
      parent: result.opts.from,
      plugin: 'pandacss',
      type: 'dir-dependency',
    },
    {
      file: 'C:\\Users\\test\\Documents\\panda-css-app\\panda.config.ts',
      parent: result.opts.from,
      plugin: 'pandacss',
      type: 'dependency',
    },
    {
      file: 'C:\\Users\\test\\Documents\\panda-css-app\\node_modules\\@pandacss\\dev\\dist\\index.d.ts',
      parent: result.opts.from,
      plugin: 'pandacss',
      type: 'dependency',
    },
  ])
})
