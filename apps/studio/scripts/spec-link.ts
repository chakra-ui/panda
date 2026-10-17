/**
 * Prints Studio links for a spec file: an embedded `#spec=gz:` link and a hosted `#url=` link.
 *   pnpm --filter studio spec-link [path/to/spec.json] [--origin http://localhost:3000]
 */
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { encodeSpecPayload } from "../utils/spec-link";

const args = process.argv.slice(2);
const flag = args.indexOf("--origin");
const origin = (flag === -1 ? "http://localhost:3000" : args.splice(flag, 2)[1]).replace(/\/$/, "");
const file = resolve(
  args[0] ?? new URL("../public/sample-design-system.json", import.meta.url).pathname,
);

const json = JSON.stringify(JSON.parse(readFileSync(file, "utf8")));
const spec = `${origin}/#spec=${await encodeSpecPayload(json)}`;
const url = `${origin}/#url=${encodeURIComponent(`${origin}/${basename(file)}`)}`;

console.log(`#spec link (${spec.length} chars):\n${spec}\n`);
console.log(`#url link (serves ${basename(file)} from public/):\n${url}`);
