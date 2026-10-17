import { openSpec } from "~/utils/open-spec";
import { droppedFiles } from "~/utils/dropped";
import { parseSpecLink, pickTheme, resolveSpecLink, SpecLinkError } from "~/utils/spec-link";
import { linkLoading, linkPending } from "~/utils/spec-link-state";
import { toaster } from "~/utils/toaster";

export default defineNuxtPlugin((nuxtApp) => {
  const hash = location.hash;
  const parsed = parseSpecLink(hash);
  if (parsed.ok && !parsed.link) return;

  const router = useRouter();
  const mounted = new Promise<void>((resolve) =>
    nuxtApp.hooks.hookOnce("app:suspense:resolve", () => resolve()),
  );

  async function fail(message: string) {
    toaster.create({ title: message, type: "error" });
    await mounted;
    await router.replace("/");
    // Drop the broken link so reloading home doesn't repeat the error.
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    return false;
  }

  // Keep the link in the URL while its system is on screen, so a reload or copy reopens it.
  // The router would drop or re-encode it, so it's restored verbatim after each navigation.
  function keepHashOnView() {
    const stop = router.afterEach((to) => {
      if (to.path !== "/view") return stop();
      if (location.hash !== hash) {
        history.replaceState(history.state, "", location.pathname + location.search + hash);
      }
    });
  }

  async function open(): Promise<boolean> {
    if (!parsed.ok) return fail(parsed.error);
    const link = parsed.link!;
    linkLoading.value =
      link.kind === "url"
        ? `Loading design system from ${link.url.host}…`
        : "Opening design system from link…";
    try {
      const raw = await resolveSpecLink(link);
      await router.isReady();
      const current = router.currentRoute.value;
      droppedFiles.value = [];
      keepHashOnView();
      const result = await nuxtApp.runWithContext(() =>
        openSpec(
          raw,
          (spec) => {
            // A reload on /view keeps whatever theme the reader picked since.
            if (current.path === "/view") return { path: "/view", query: current.query };
            const theme = pickTheme(spec.themes, link.theme);
            return { path: "/view", query: theme ? { theme } : {} };
          },
          { replace: true },
        ),
      );
      if (!result.ok) {
        const where = link.kind === "url" ? `from ${link.url.host}` : "in this link";
        return fail(`Couldn't load the design system ${where}. It isn't a valid spec.`);
      }
      return true;
    } catch (error) {
      return fail(
        error instanceof SpecLinkError
          ? error.message
          : "Couldn't load the design system from this link.",
      );
    } finally {
      linkLoading.value = null;
    }
  }

  linkPending.current = open();
});
