import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "Missing slug" });

  const spec = await prisma.spec.findUnique({
    where: { slug },
    select: { slug: true, title: true, tokens: true, css: true, usage: true, createdAt: true },
  });
  if (!spec) throw createError({ statusCode: 404, statusMessage: "Spec not found" });
  return spec;
});
