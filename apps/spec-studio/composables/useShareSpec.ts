import { ref } from "vue";
import type { TokensFile } from "~/utils/tokens";

type Status = "idle" | "sharing" | "copied" | "error";

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
    try {
      const { slug } = await $fetch<{ slug: string }>("/api/specs", {
        method: "POST",
        body: { tokens: file, css, title: options.title, usage: options.usage },
      });
      const full = new URL(`/${options.path ?? "s"}/${slug}`, location.origin).href;
      url.value = full;
      await navigator.clipboard.writeText(full);
      status.value = "copied";
      setTimeout(() => (status.value = "idle"), 2000);
    } catch {
      status.value = "error";
      setTimeout(() => (status.value = "idle"), 2000);
    }
  }

  return { status, url, share };
}
