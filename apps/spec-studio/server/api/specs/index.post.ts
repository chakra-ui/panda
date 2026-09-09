import { nanoid } from "nanoid";
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { hashToken } from "../../utils/edit-token";

const body = z.object({
  code: z.string().min(1),
  title: z.string().max(120).optional(),
});

export default defineEventHandler(async (event) => {
  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid share payload" });

  const editToken = nanoid(24);
  const spec = await prisma.spec.create({
    data: {
      slug: nanoid(10),
      title: parsed.data.title,
      editToken: hashToken(editToken),
      versions: { create: { number: 1, code: parsed.data.code } },
    },
    select: { slug: true },
  });

  // The edit URL carries the capability secret — return it once, on create.
  return {
    slug: spec.slug,
    version: 1,
    viewUrl: `/s/${spec.slug}`,
    editUrl: `/s/${spec.slug}?k=${editToken}`,
  };
});
