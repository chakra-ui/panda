import { ref } from "vue";
import { index, parseSpec, type DesignSystemIndex } from "~/utils/design-system";
import { extractSpec } from "~/utils/extract-tokens";
import { saveTokens } from "~/utils/idb";
import {
  analyzeUsage,
  isSourceFile,
  isIgnoredPath,
  MAX_FILE_BYTES,
  MAX_FILES,
  type CategoryUsage,
} from "~/utils/analyze";
import { summarizeTokenUsage } from "@pandacss/compiler-shared";
import { useFolderDrop } from "~/composables/useFolderDrop";

const pathOf = (f: File) =>
  (f as File & { webkitRelativePath?: string }).webkitRelativePath || f.name;

export function useAnalyze() {
  const ds = ref<DesignSystemIndex | null>(null);
  const report = ref<CategoryUsage[] | null>(null);
  const scannedCount = ref(0);
  const empty = ref(false);
  const mode = ref<"heuristic" | "precise">("heuristic");
  const analyzing = ref(false);
  const preciseFailed = ref(false);
  const preciseError = ref("");

  async function analyzeFiles(input: File[]) {
    const raw = await extractSpec(input);
    if (raw) {
      const parsed = parseSpec(raw);
      if (parsed.ok) {
        ds.value = index(parsed.spec);
        await saveTokens(raw);
      }
    }

    if (!ds.value) return;
    const textFiles = input
      .filter((f) => {
        const path = pathOf(f);
        if (isIgnoredPath(path) || f.size > MAX_FILE_BYTES) return false;
        return isSourceFile(f.name) || /panda\.config\.|\.(ts|tsx|js|jsx|mjs|cjs|json)$/.test(f.name);
      })
      .slice(0, MAX_FILES);

    analyzing.value = true;
    preciseFailed.value = false;
    preciseError.value = "";
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const filesMap = new Map<string, string>();
    const sources: { name: string; text: string }[] = [];
    await Promise.all(
      textFiles.map(async (f) => {
        const path = pathOf(f);
        const text = await f.text();
        filesMap.set(path, text);
        if (isSourceFile(f.name)) sources.push({ name: path, text });
      }),
    );
    scannedCount.value = sources.length;
    empty.value = sources.length === 0;
    if (!sources.length) {
      report.value = null;
      analyzing.value = false;
      return;
    }

    const { findConfig, analyzePrecise } = await import("~/utils/analyze-compiler");
    const configPath = findConfig(filesMap);
    if (configPath && import.meta.client) {
      try {
        const rep = await analyzePrecise({ configPath, files: filesMap, sources });
        report.value = summarizeTokenUsage(rep as never);
        mode.value = "precise";
        analyzing.value = false;
        return;
      } catch (e) {
        preciseFailed.value = true;
        const raw = e instanceof Error ? e.message : String(e);
        preciseError.value = raw
          .replace(/\s+at\s+\S.*$/s, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);
        console.error("[studio] precise analyze failed:", e);
      }
    }
    mode.value = "heuristic";
    report.value = analyzeUsage(ds.value, sources);
    analyzing.value = false;
  }

  function reset() {
    report.value = null;
    scannedCount.value = 0;
    empty.value = false;
    mode.value = "heuristic";
    preciseFailed.value = false;
  }

  const drop = useFolderDrop(analyzeFiles);

  return {
    ds,
    report,
    scannedCount,
    empty,
    mode,
    analyzing,
    preciseFailed,
    preciseError,
    analyzeFiles,
    reset,
    ...drop,
  };
}
