import type { Artifact, ArtifactId } from '@pandacss/types'
import type { Context } from '../engines'
import { setupArtifacts, setupDesignTokens } from './setup-artifacts'

/**
 * Generate all the artifacts
 * Can opt-in to filter them if a list of ArtifactId is provided
 */
export const generateArtifacts = (ctx: Context, ids?: ArtifactId[]): Artifact[] => {
  if (ctx.config.emitTokensOnly) {
    return [setupDesignTokens(ctx)]
  }

  return setupArtifacts(ctx, ids)
}
