import { describe, expect, it } from "vitest";
import { extractTokens } from "./extract-tokens";

const file = (name: string, body: string) => new File([body], name);

describe("extractTokens", () => {
  it("prefers a tokens.json and pulls the token layer from css", async () => {
    const tokens = '{"data":[{"type":"colors","values":[{"name":"red","value":"#f00"}]}]}';
    const css = "@layer tokens{:where(:root){--colors-red:#f00}}";
    const { tokensJson, css: layer } = await extractTokens([
      file("tokens.json", tokens),
      file("styles.css", css),
    ]);
    expect(tokensJson).toBe(tokens);
    expect(layer).toContain("--colors-red:#f00");
  });

  it("falls back to the generated dictionary when there is no tokens.json", async () => {
    const dict = `const tokens = {"colors.red.500":"#f00"}\nexport {}`;
    const f = file("index.mjs", dict);
    Object.defineProperty(f, "webkitRelativePath", { value: "app/styled-system/tokens/index.mjs" });
    const { tokensJson } = await extractTokens([f]);
    expect(tokensJson).toContain('"type":"colors"');
  });

  it("returns nulls when nothing matches", async () => {
    const { tokensJson, css } = await extractTokens([file("readme.md", "# hi")]);
    expect(tokensJson).toBeNull();
    expect(css).toBeNull();
  });
});
