import prettier, { type Options } from "prettier";
import parserTypescript from "prettier/parser-typescript";

/** @see https://github.dev/stephenh/ts-poet/blob/5ea0dbb3c9f1f4b0ee51a54abb2d758102eda4a2/src/Code.ts#L231 */
export function maybePretty(input: string, options?: Options | null): string {
  try {
    return prettier.format(input.trim(), {
      parser: "typescript",
      plugins: [parserTypescript],
      ...options,
    });
  } catch {
    return input; // assume it's invalid syntax and ignore
  }
}
