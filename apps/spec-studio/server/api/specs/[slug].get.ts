import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, statusMessage: "Missing slug" });

  const spec = await prisma.spec.findUnique({ where: { slug }, select: { id: true, slug: true, title: true, latest: true } });
  if (!spec) throw createError({ statusCode: 404, statusMessage: "Spec not found" });

  const asked = Number(getQuery(event).v);
  const number = Number.isInteger(asked) && asked > 0 ? asked : spec.latest;

  const version = await prisma.version.findUnique({
    where: { specId_number: { specId: spec.id, number } },
    select: { number: true, code: true, createdAt: true },
  });
  if (!version) throw createError({ statusCode: 404, statusMessage: "Version not found" });

  return { slug: spec.slug, title: spec.title, latest: spec.latest, ...version };
});
