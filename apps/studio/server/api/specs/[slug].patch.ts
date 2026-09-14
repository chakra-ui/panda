import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

const body = z.object({
  usage: z.unknown().optional(),
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
      },
      select: { slug: true },
    });
    return { slug: spec.slug };
  } catch {
    throw createError({ statusCode: 404, statusMessage: "Spec not found" });
  }
});
