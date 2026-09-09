import { transform } from "sucrase";
import { mergeConfigs } from "@pandacss/config/merge";
import { createConfigSnapshot } from "@pandacss/config/serialize";
import { createUsageReport, type UsageReport } from "@pandacss/compiler-shared";
import presetBase from "@pandacss/preset-base";
import presetPanda from "@pandacss/preset-panda";

export interface Source {
  name: string;
  text: string;
}

const PRESETS: Record<string, unknown> = {
  "@pandacss/preset-base": presetBase,
  "@pandacss/preset-panda": presetPanda,
};

function evalConfigModule(entry: string, files: Map<string, string>): Record<string, unknown> {
  const cache = new Map<string, Record<string, unknown>>();

  const resolve = (from: string, spec: string): string | null => {
    const base = from.slice(0, from.lastIndexOf("/") + 1);
    const raw = spec.startsWith(".") ? normalize(base + spec) : spec;
    for (const p of [
      raw,
      `${raw}.ts`,
      `${raw}.tsx`,
      `${raw}.js`,
      `${raw}/index.ts`,
      `${raw}/index.js`,
    ]) {
      if (files.has(p)) return p;
    }
    return null;
  };

  const run = (path: string): Record<string, unknown> => {
    const cached = cache.get(path);
    if (cached) return cached;
    const src = files.get(path) ?? "";
    const { code } = transform(src, { transforms: ["typescript", "imports"], filePath: path });
    const module = { exports: {} as Record<string, unknown> };
    const require = (spec: string): unknown => {
      if (spec === "@pandacss/dev")
        return { defineConfig: (c: unknown) => c, definePreset: (p: unknown) => p };
      if (spec in PRESETS) return { default: PRESETS[spec], ...(PRESETS[spec] as object) };
      const rel = resolve(path, spec);
      if (rel) return run(rel);
      return {};
    };
    new Function("exports", "require", "module", code)(module.exports, require, module);
    cache.set(path, module.exports);
    return module.exports;
  };

  const out = run(entry);
  return (out.default as Record<string, unknown>) ?? out;
}

function normalize(path: string): string {
  const parts: string[] = [];
  for (const seg of path.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

function resolvePresets(presets: unknown): unknown[] {
  if (!Array.isArray(presets)) return [presetBase, presetPanda];
  return presets.map((p) => (typeof p === "string" ? (PRESETS[p] ?? {}) : p));
}

let wasmModule: unknown | null = null;
async function loadWasmModule(): Promise<unknown> {
  if (wasmModule) return wasmModule;
  const [{ default: init, ...mod }, wasmUrl] = await Promise.all([
    import("@pandacss/compiler-wasm/pkg-web/compiler_wasm.js"),
    import("@pandacss/compiler-wasm/pkg-web/compiler_wasm_bg.wasm?url").then((m) => m.default),
  ]);
  await init(wasmUrl);
  wasmModule = mod;
  return mod;
}

export interface PreciseInput {
  configPath: string;
  files: Map<string, string>;
  sources: Source[];
}

export async function analyzePrecise(input: PreciseInput): Promise<UsageReport> {
  const { build } = await import("@pandacss/compiler-wasm/web");
  const mod = await loadWasmModule();

  const userConfig = evalConfigModule(input.configPath, input.files);
  const presets = resolvePresets(userConfig.presets);
  const merged = mergeConfigs([...presets, { ...userConfig, presets: undefined }]);
  const snapshot = createConfigSnapshot(merged as never);

  const compiler = (build as (m: unknown, c: unknown, cb: unknown, h?: unknown) => never)(
    mod,
    (snapshot as { config: unknown }).config,
    (snapshot as { callbacks?: unknown }).callbacks ?? {},
    (snapshot as { hooks?: unknown }).hooks,
  ) as {
    inspectFiles: (f: { path: string; source: string }[]) => unknown;
    spec: () => unknown;
  };

  const batch = compiler.inspectFiles(input.sources.map((s) => ({ path: s.name, source: s.text })));
  return createUsageReport(batch as never, { scope: "all", spec: compiler.spec() as never });
}

export function findConfig(files: Map<string, string>): string | null {
  for (const p of files.keys()) {
    if (/(^|\/)panda\.config\.(ts|js|mjs|cts|mts)$/.test(p)) return p;
  }
  return null;
}
