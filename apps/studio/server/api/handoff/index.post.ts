import { allowHandoff, parseSealed, putHandoff } from '../../utils/handoff'
import { redis } from '../../utils/redis'

export default defineEventHandler(async (event) => {
  const client = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  if (!(await allowHandoff(redis, client))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many handoffs, try again in a minute' })
  }
  const sealed = parseSealed(await readBody(event))
  if (sealed === 'too-large') throw createError({ statusCode: 413, statusMessage: 'Design system too large' })
  if (sealed === 'invalid') throw createError({ statusCode: 400, statusMessage: 'Invalid handoff payload' })
  return { id: await putHandoff(redis, sealed) }
})
