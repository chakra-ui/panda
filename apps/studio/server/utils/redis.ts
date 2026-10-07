import { memoryRedis, type Redis } from './handoff'

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

const upstash: Redis = async (command) => {
  const res = await fetch(url!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw createError({ statusCode: 503, statusMessage: 'Handoff store unavailable' })
  return ((await res.json()) as { result: unknown }).result
}

const missing: Redis = async () => {
  throw createError({ statusCode: 503, statusMessage: 'Handoff store not configured' })
}

export const redis: Redis = url && token ? upstash : process.env.NODE_ENV === 'production' ? missing : memoryRedis()
