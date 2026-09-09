import { ref } from "vue";
import { encodeSpec, SHARE_VERSION } from "~/utils/share";
import type { TokensFile } from "~/utils/tokens";

type Status = "idle" | "sharing" | "copied" | "error";

export function useShareSpec() {
  const status = ref<Status>("idle");
  const url = ref<string | null>(null);

  async function share(file: TokensFile, css: string | null, title?: string) {
    status.value = "sharing";
    try {
      const code = await encodeSpec({ v: SHARE_VERSION, tokens: file, css, title });
      const res = await $fetch<{ viewUrl: string }>("/api/specs", { method: "POST", body: { code, title } });
      const full = new URL(res.viewUrl, location.origin).href;
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
