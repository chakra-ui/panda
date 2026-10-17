import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";
import { encodeSpecPayload } from "../utils/spec-link";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    origin: { type: "string", default: "http://localhost:3000" },
    share: { type: "boolean", default: false },
  },
});
const origin = values.origin.replace(/\/$/, "");
const file = resolve(
  positionals[0] ?? new URL("../public/sample-design-system.json", import.meta.url).pathname,
);

const json = JSON.stringify(JSON.parse(readFileSync(file, "utf8")));

if (values.share) {
  const res = await fetch(`${origin}/api/specs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ spec: JSON.parse(json) }),
  });
  if (!res.ok) throw new Error(`${origin}/api/specs answered ${res.status}`);
  const { slug } = (await res.json()) as { slug: string };
  console.log(`${origin}/s/${slug}`);
} else {
  const spec = `${origin}/#spec=${await encodeSpecPayload(json)}`;
  const url = `${origin}/#url=${encodeURIComponent(`${origin}/${basename(file)}`)}`;
  console.log(`#spec link (${spec.length} chars):\n${spec}\n`);
  console.log(`#url link (serves ${basename(file)} from public/):\n${url}`);
  console.log(`\nFor a short public link, add --share.`);
}
