export type Variant = {
  id: string;
  label: string;
  class: string;
  attrs: Record<string, string>;
};

const BASE: Variant = { id: "base", label: "Base", class: "", attrs: {} };

function applicators(selector: string): { classes: string[]; attrs: Record<string, string> } {
  const classes = [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  const attrs: Record<string, string> = {};
  for (const m of selector.matchAll(/\[([\w-]+)\s*=\s*["']?([^"'\]]+)["']?\]/g)) attrs[m[1]] = m[2];
  return { classes, attrs };
}

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

function labelFor(classes: string[], attrs: Record<string, string>): string {
  const theme = attrs["data-panda-theme"] ?? attrs["data-theme"] ?? attrs["data-color-mode"];
  const mode = classes.find((c) => c === "dark" || c === "light");
  const parts = [theme && cap(theme), mode && cap(mode)].filter(Boolean);
  return parts.length ? parts.join(" · ") : cap(classes[0] ?? Object.values(attrs)[0] ?? "Variant");
}

export function discoverVariants(css: string | null): Variant[] {
  if (!css) return [BASE];
  const variants: Variant[] = [BASE];
  const seen = new Set<string>();
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = m[1].trim();
    if (!m[2].includes("--") || selector.startsWith("@")) continue;
    if (/^:where\(:root|^:root|^:host/.test(selector)) continue;
    const { classes, attrs } = applicators(selector);
    if (!classes.length && !Object.keys(attrs).length) continue;
    const id = JSON.stringify([classes.toSorted(), attrs]);
    if (seen.has(id)) continue;
    seen.add(id);
    variants.push({ id, label: labelFor(classes, attrs), class: classes.join(" "), attrs });
  }
  return variants;
}

function balancedBlock(css: string, from: number): string | null {
  const open = css.indexOf("{", from);
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(open, i + 1);
  }
  return null;
}

export function buildThemeLayer(css: string | null): { css: string; variants: Variant[] } {
  if (!css) return { css: "", variants: [BASE] };
  const variants = discoverVariants(css);
  const hasDark = variants.some((v) => v.class.split(" ").includes("dark") || /dark/i.test(v.label));
  if (hasDark) return { css, variants };

  const m = css.match(/@media[^{]*prefers-color-scheme\s*:\s*dark[^{]*\{/);
  if (m?.index === undefined) return { css, variants };
  const block = balancedBlock(css, m.index);
  const decls = block
    ? [...block.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);?/g)].map((d) => `${d[1]}:${d[2].trim()}`)
    : [];
  if (!decls.length) return { css, variants };

  variants.push({ id: "sys-dark", label: "Dark", class: "", attrs: { "data-spec-scheme": "dark" } });
  return { css: `${css}\n[data-spec-scheme="dark"]{${decls.join(";")}}`, variants };
}

export const isSemantic = (value: string) => value.startsWith("var(");
