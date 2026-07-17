import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { readPackageIdentity } from '../../src/design-system/package'
import { filterPublishableLibFiles, readPublishFilesField } from '../../src/design-system/publishable-files'
import { test as diskTest, writeFileTree } from './helpers'

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

describe('readPackageIdentity + filterPublishableLibFiles (disk)', () => {
  diskTest('keeps inferred source paths when package.json has no files field', ({ cwd }) => {
    writeFileTree(cwd, {
      'package.json': JSON.stringify({ name: '@acme/ds', version: '1.0.0' }),
      'dist/.gitkeep': '',
    })
    const out = join(cwd, 'dist')

    const identity = readPackageIdentity(out)
    expect(identity.publishFiles).toBeUndefined()

    const inferred = ['../src/button.tsx', './**/*.{js,mjs}']
    expect(
      filterPublishableLibFiles({
        files: inferred,
        packageRoot: cwd,
        outRoot: out,
        publishFiles: identity.publishFiles,
      }),
    ).toEqual({ files: inferred, unpublished: [] })
  })

  diskTest('drops unpublished inferred sources when files is dist-only', ({ cwd }) => {
    writeFileTree(cwd, {
      'package.json': JSON.stringify({ name: '@acme/ds', version: '1.0.0', files: ['dist'] }),
      'dist/.gitkeep': '',
    })
    const out = join(cwd, 'dist')

    const identity = readPackageIdentity(out)
    expect(identity.publishFiles).toEqual(['dist'])

    expect(
      filterPublishableLibFiles({
        files: ['../src/button.tsx', './**/*.{js,mjs}'],
        packageRoot: cwd,
        outRoot: out,
        publishFiles: identity.publishFiles,
      }),
    ).toEqual({
      files: ['./**/*.{js,mjs}'],
      unpublished: ['../src/button.tsx'],
    })
  })
})
