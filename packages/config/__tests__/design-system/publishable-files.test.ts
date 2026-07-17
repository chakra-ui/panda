import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { filterPublishableLibFiles, readPublishFilesField } from '../../src/design-system/publishable-files'

const packageRoot = join('/repo', 'packages', 'ds')
const outRoot = join(packageRoot, 'dist')

describe('filterPublishableLibFiles', () => {
  test('keeps all paths when package.json has no files field', () => {
    const files = ['../src/button.tsx', './**/*.{js,mjs}']
    expect(filterPublishableLibFiles({ files, packageRoot, outRoot })).toEqual({
      files,
      unpublished: [],
    })
  })

  test('drops source paths outside a dist-only files field', () => {
    expect(
      filterPublishableLibFiles({
        files: ['../src/button.tsx', '../src/card.tsx'],
        packageRoot,
        outRoot,
        publishFiles: ['dist'],
      }),
    ).toEqual({
      files: [],
      unpublished: ['../src/button.tsx', '../src/card.tsx'],
    })
  })

  test('keeps dist-relative globs when dist is published', () => {
    expect(
      filterPublishableLibFiles({
        files: ['./**/*.{js,mjs}', '../src/button.tsx'],
        packageRoot,
        outRoot,
        publishFiles: ['dist'],
      }),
    ).toEqual({
      files: ['./**/*.{js,mjs}'],
      unpublished: ['../src/button.tsx'],
    })
  })

  test('keeps source paths when src is listed in files', () => {
    expect(
      filterPublishableLibFiles({
        files: ['../src/button.tsx'],
        packageRoot,
        outRoot,
        publishFiles: ['dist', 'src'],
      }),
    ).toEqual({
      files: ['../src/button.tsx'],
      unpublished: [],
    })
  })

  test('honors negated package files patterns', () => {
    expect(
      filterPublishableLibFiles({
        files: ['../src/button.tsx', '../src/secret.tsx'],
        packageRoot,
        outRoot,
        publishFiles: ['src', '!src/secret.tsx'],
      }),
    ).toEqual({
      files: ['../src/button.tsx'],
      unpublished: ['../src/secret.tsx'],
    })
  })
})

describe('readPublishFilesField', () => {
  test('returns string arrays and rejects other shapes', () => {
    expect(readPublishFilesField(['dist'])).toEqual(['dist'])
    expect(readPublishFilesField([])).toBeUndefined()
    expect(readPublishFilesField(undefined)).toBeUndefined()
    expect(readPublishFilesField(['dist', 1])).toBeUndefined()
  })
})
