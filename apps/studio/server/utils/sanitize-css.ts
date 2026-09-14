export function sanitizeCss(css: string): string {
  return css
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "none")
    .slice(0, 500_000);
}
