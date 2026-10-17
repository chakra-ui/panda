import { openSpec } from "~/utils/open-spec";
import { droppedFiles } from "~/utils/dropped";
import {
  parseSpecLink,
  pickTheme,
  resolveSpecLink,
  SpecLinkError,
  type LinkParse,
} from "~/utils/spec-link";
import { linkLoading, linkPending } from "~/utils/spec-link-state";
import { toaster } from "~/utils/toaster";

export default defineNuxtPlugin((nuxtApp) => {
  const hash = location.hash;
  const parsed = parseSpecLink(hash);
  if (!parsed) return;

  const router = useRouter();
  const mounted = new Promise<void>((resolve) =>
    nuxtApp.hooks.hookOnce("app:suspense:resolve", () => resolve()),
  );

  async function fail(message: string) {
    toaster.create({ title: message, type: "error" });
    await mounted;
    await router.replace("/");
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    return false;
  }

  function keepHashOnView() {
    const stop = router.afterEach((to) => {
      if (to.path !== "/view") return stop();
      if (location.hash !== hash) {
        history.replaceState(history.state, "", location.pathname + location.search + hash);
      }
    });
  }

  async function open(parsed: LinkParse): Promise<boolean> {
    if (!parsed.ok) return fail(parsed.error);
    const { link } = parsed;
    const message =
      link.kind === "url"
        ? `Loading design system from ${link.url.host}…`
        : "Opening design system from link…";
    let done = false;
    void mounted.then(() => {
      if (!done) linkLoading.value = message;
    });
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
      done = true;
      linkLoading.value = null;
    }
  }

  linkPending.value = open(parsed);
});
