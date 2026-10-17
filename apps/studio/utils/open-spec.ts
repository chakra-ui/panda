import type { RouteLocationRaw } from "vue-router";
import { parseSpec, type DesignSystemSpec, type ParseResult } from "~/utils/design-system";
import { saveTokens } from "~/utils/idb";

/** The one way a spec gets into Studio: validate, store, then show the view. */
export async function openSpec(
  raw: string,
  to: RouteLocationRaw | ((spec: DesignSystemSpec) => RouteLocationRaw) = "/view",
  options: { replace?: boolean } = {},
): Promise<ParseResult> {
  const result = parseSpec(raw);
  if (!result.ok) return result;
  await saveTokens(raw);
  await navigateTo(typeof to === "function" ? to(result.spec) : to, options);
  return result;
}
