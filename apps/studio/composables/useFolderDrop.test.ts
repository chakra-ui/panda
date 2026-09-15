import { describe, expect, it } from "vitest";
import { shouldPrune } from "./useFolderDrop";

describe("shouldPrune", () => {
  it("prunes node_modules and build dirs", () => {
    expect(shouldPrune("park-ui/node_modules/react/index.js")).toBe(true);
    expect(shouldPrune("app/.git/config")).toBe(true);
    expect(shouldPrune("web/dist/bundle.js")).toBe(true);
  });

  it("keeps styled-system and source files", () => {
    expect(shouldPrune("web/styled-system/tokens/index.mjs")).toBe(false);
    expect(shouldPrune("app/components/Button.vue")).toBe(false);
    expect(shouldPrune("tokens.json")).toBe(false);
  });
});
