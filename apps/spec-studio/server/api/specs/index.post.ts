import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

function sanitizeCss(css: string): string {
  return css
    .replace(/@import\b[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\([^)]*\)/gi, "none")
    .slice(0, 500_000);
}

const body = z.object({
  tokens: z.object({ data: z.array(z.unknown()).min(1) }).passthrough(),
  css: z.string().nullish(),
  title: z.string().max(120).nullish(),
  usage: z.unknown().optional(),
});

export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid spec payload" });

  const spec = await prisma.spec.create({
    data: {
      slug: nanoid(10),
      title: parsed.data.title ?? null,
      tokens: parsed.data.tokens as Prisma.InputJsonValue,
      css: parsed.data.css ? sanitizeCss(parsed.data.css) : null,
      usage: parsed.data.usage === undefined ? undefined : (parsed.data.usage as Prisma.InputJsonValue),
    },
    select: { slug: true },
  });
  return { slug: spec.slug, url: `/s/${spec.slug}` };
});
