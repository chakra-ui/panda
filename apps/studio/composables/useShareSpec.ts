import { ref } from "vue";
import type { TokensFile } from "~/utils/tokens";
import { toaster } from "~/utils/toaster";

type Status = "idle" | "sharing";

type ShareOptions = {
  title?: string;
  usage?: unknown;
  path?: "s" | "a";
};

export function useShareSpec() {
  const status = ref<Status>("idle");
  const url = ref<string | null>(null);

  async function share(file: TokensFile, css: string | null, options: ShareOptions = {}) {
    status.value = "sharing";
    const started = Date.now();
    try {
      const { slug } = await $fetch<{ slug: string }>("/api/specs", {
        method: "POST",
        body: { tokens: file, css, title: options.title, usage: options.usage },
      });
      const full = new URL(`/${options.path ?? "s"}/${slug}`, location.origin).href;
      url.value = full;
      await navigator.clipboard.writeText(full);
      const elapsed = Date.now() - started;
      if (elapsed < 550) await new Promise((r) => setTimeout(r, 550 - elapsed));
      toaster.create({ title: "Link copied to clipboard", type: "success" });
    } catch {
      toaster.create({ title: "Couldn't create the link", type: "error" });
    } finally {
      status.value = "idle";
    }
  }

  return { status, url, share };
}
