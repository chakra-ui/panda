import { takeHandoff } from "../../utils/handoff";
import { redis } from "../../utils/redis";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "no-store");
  const sealed = await takeHandoff(redis, getRouterParam(event, "id") ?? "");
  if (!sealed) throw createError({ statusCode: 404, statusMessage: "Handoff expired" });
  return sealed;
});
