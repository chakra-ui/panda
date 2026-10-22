import { openSpecLink } from '~/utils/open-spec-link'
import { parseSpecLink, type LinkParse } from '~/utils/spec-link'
import { linkLoading, linkPending } from '~/utils/spec-link-state'
import { toaster } from '~/utils/toaster'

export default defineNuxtPlugin((nuxtApp) => {
  const parsed = parseSpecLink(location.hash)
  if (!parsed) return

  const router = useRouter()
  const mounted = new Promise<void>((resolve) => nuxtApp.hooks.hookOnce('app:suspense:resolve', () => resolve()))

  async function fail(message: string) {
    toaster.create({ title: message, type: 'error' })
    await mounted
    await router.replace('/')
    if (location.hash) history.replaceState(history.state, '', location.pathname + location.search)
    return false
  }

  async function open(parsed: LinkParse): Promise<boolean> {
    if (!parsed.ok) return fail(parsed.error)
    const { link } = parsed
    const message =
      link.kind === 'url' ? `Loading design system from ${link.url.host}…` : 'Opening design system from link…'
    let done = false
    void mounted.then(() => {
      if (!done) linkLoading.value = message
    })
    try {
      const result = await openSpecLink(link, { router, nuxtApp, replace: true })
      return result.ok || fail(result.error)
    } finally {
      done = true
      linkLoading.value = null
    }
  }

  linkPending.value = open(parsed)
})
