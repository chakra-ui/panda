import { nanoid } from "nanoid";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

const body = z.object({
  spec: z
    .object({ schemaVersion: z.number(), paths: z.array(z.string()).min(1) })
    .passthrough(),
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
      spec: parsed.data.spec as Prisma.InputJsonValue,
      usage: parsed.data.usage === undefined ? undefined : (parsed.data.usage as Prisma.InputJsonValue),
    },
    select: { slug: true },
  });
  return { slug: spec.slug, url: `/s/${spec.slug}` };
});
