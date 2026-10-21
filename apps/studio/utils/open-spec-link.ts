import type { NuxtApp } from '#app'
import type { Router } from 'vue-router'
import { droppedFiles } from '~/utils/dropped'
import { openSpec } from '~/utils/open-spec'
import { pickTheme, resolveSpecLink, SpecLinkError, specLinkHash, type SpecLink } from '~/utils/spec-link'

export type OpenLinkResult = { ok: true } | { ok: false; error: string }

// Query edits on /view drop the hash; put it back so the page stays shareable.
function keepHashOnView(router: Router, hash: string) {
  const stop = router.afterEach((to) => {
    if (to.path !== '/view') return stop()
    if (location.hash !== hash) {
      history.replaceState(history.state, '', location.pathname + location.search + hash)
    }
  })
}

export async function openSpecLink(
  link: SpecLink,
  {
    router,
    nuxtApp,
    replace = false,
  }: {
    router: Router
    nuxtApp: Pick<NuxtApp, 'runWithContext'>
    replace?: boolean
  },
): Promise<OpenLinkResult> {
  let raw: string
  try {
    raw = await resolveSpecLink(link)
  } catch (error) {
    return {
      ok: false,
      error: error instanceof SpecLinkError ? error.message : "Couldn't load the design system from this link.",
    }
  }

  await router.isReady()
  const current = router.currentRoute.value
  droppedFiles.value = []
  keepHashOnView(router, specLinkHash(link))

  const result = await nuxtApp.runWithContext(() =>
    openSpec(
      raw,
      (spec) => {
        if (current.path === '/view') return { path: '/view', query: current.query }
        const theme = pickTheme(spec.themes, link.theme)
        return { path: '/view', query: theme ? { theme } : {} }
      },
      { replace },
    ),
  )
  if (result.ok) return { ok: true }
  const where = link.kind === 'url' ? `from ${link.url.host}` : 'in this link'
  return { ok: false, error: `The file ${where} isn't a design-system.json. Check the URL and try again.` }
}
