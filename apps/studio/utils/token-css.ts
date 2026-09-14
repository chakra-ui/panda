export function extractTokenLayer(css: string): string | null {
  const marker = css.match(/@layer\s+tokens\s*\{/);
  if (marker?.index === undefined) return null;
  const open = marker.index + marker[0].length - 1;
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) {
      const body = css.slice(open, i + 1);
      return body.includes("--colors-") ? `@layer tokens ${body}` : null;
    }
  }
  return null;
}
