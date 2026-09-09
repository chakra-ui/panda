import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../../utils/prisma";

const body = z.object({
  code: z.string().min(1),
  title: z.string().max(120).optional(),
});

export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid share payload" });

  const spec = await prisma.spec.create({
    data: { slug: nanoid(10), ...parsed.data },
    select: { slug: true },
  });
  return { slug: spec.slug, url: `/s/${spec.slug}` };
});
