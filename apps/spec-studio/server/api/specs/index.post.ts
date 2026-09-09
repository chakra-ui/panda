import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

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
      tokens: parsed.data.tokens,
      css: parsed.data.css ?? null,
      usage: parsed.data.usage === undefined ? undefined : (parsed.data.usage as object),
    },
    select: { slug: true },
  });
  return { slug: spec.slug, url: `/s/${spec.slug}` };
});
