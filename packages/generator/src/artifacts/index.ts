import type { Context } from '@pandacss/core'
import type { Artifact, ArtifactId } from '@pandacss/types'
import { setupArtifacts, setupDesignTokens } from './setup-artifacts'

/**
 * Generate all the artifacts
 * Can opt-in to filter them if a list of ArtifactId is provided
 */
export const generateArtifacts = (ctx: Context, ids?: ArtifactId[]): Artifact[] => {
  if (ctx.config.emitTokensOnly) {
    return [setupDesignTokens(ctx)].filter(Boolean) as Artifact[]
  }

  return setupArtifacts(ctx, ids)
}
