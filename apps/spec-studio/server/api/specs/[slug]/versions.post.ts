import { z } from "zod";
import { prisma } from "../../../utils/prisma";
import { tokenMatches } from "../../../utils/edit-token";

const body = z.object({ code: z.string().min(1) });

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const key = getQuery(event).k;
  if (!slug || typeof key !== "string") throw createError({ statusCode: 400, statusMessage: "Missing slug or edit key" });

  const parsed = body.safeParse(await readBody(event));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid share payload" });

  const spec = await prisma.spec.findUnique({ where: { slug }, select: { id: true, latest: true, editToken: true } });
  if (!spec) throw createError({ statusCode: 404, statusMessage: "Spec not found" });
  if (!tokenMatches(key, spec.editToken)) throw createError({ statusCode: 403, statusMessage: "Invalid edit key" });

  const number = spec.latest + 1;
  await prisma.$transaction([
    prisma.version.create({ data: { specId: spec.id, number, code: parsed.data.code } }),
    prisma.spec.update({ where: { id: spec.id }, data: { latest: number } }),
  ]);
  return { slug, version: number, viewUrl: `/s/${slug}@${number}` };
});
