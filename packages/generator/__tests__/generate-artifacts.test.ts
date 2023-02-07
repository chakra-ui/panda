import { expect, test } from 'vitest'
import { createGenerator } from '../src'
import { loadConfigResult } from './fixture'

test('getArtifacts', () => {
  const ctx = createGenerator(loadConfigResult)
  const artifacts = ctx.getArtifacts()
  artifacts.forEach((artifact) => {
    expect(artifact).toMatchSnapshot()
  })
})
