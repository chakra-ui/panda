import { parseSealed, putHandoff } from "../../utils/handoff";
import { redis } from "../../utils/redis";

export default defineEventHandler(async (event) => {
  const sealed = parseSealed(await readBody(event));
  if (sealed === "too-large") throw createError({ statusCode: 413, statusMessage: "Design system too large" });
  if (sealed === "invalid") throw createError({ statusCode: 400, statusMessage: "Invalid handoff payload" });
  return { id: await putHandoff(redis, sealed) };
});
