import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { sanitizeCss } from "../../utils/sanitize-css";

const body = z.object({
  usage: z.unknown().optional(),
  css: z.string().nullish(),
});

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "Missing slug" });

  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid payload" });

  try {
    const spec = await prisma.spec.update({
      where: { slug },
      data: {
        usage:
          parsed.data.usage === undefined ? undefined : (parsed.data.usage as Prisma.InputJsonValue),
        css: parsed.data.css ? sanitizeCss(parsed.data.css) : undefined,
      },
      select: { slug: true },
    });
    return { slug: spec.slug };
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Spec not found" });
  }
});
