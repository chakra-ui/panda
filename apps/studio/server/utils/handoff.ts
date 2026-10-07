import { nanoid } from 'nanoid'

export type Redis = (command: (string | number)[]) => Promise<unknown>
export interface Sealed {
  iv: string
  data: string
}

export const HANDOFF_TTL_SECONDS = 120
export const MAX_HANDOFF_DATA = 1_000_000
export const HANDOFF_LIMIT_PER_MINUTE = 20

const BASE64URL = /^[\w-]+$/
const ID = /^[\w-]{16}$/

export function parseSealed(body: unknown): Sealed | 'invalid' | 'too-large' {
  if (!body || typeof body !== 'object') return 'invalid'
  const { iv, data } = body as Record<string, unknown>
  if (typeof iv !== 'string' || typeof data !== 'string') return 'invalid'
  if (data.length > MAX_HANDOFF_DATA) return 'too-large'
  if (!BASE64URL.test(iv) || !BASE64URL.test(data)) return 'invalid'
  return { iv, data }
}

export async function putHandoff(redis: Redis, sealed: Sealed): Promise<string> {
  const id = nanoid(16)
  await redis(['SET', `handoff:${id}`, JSON.stringify(sealed), 'EX', HANDOFF_TTL_SECONDS])
  return id
}

export async function takeHandoff(redis: Redis, id: string): Promise<Sealed | null> {
  if (!ID.test(id)) return null
  const value = await redis(['GETDEL', `handoff:${id}`])
  return typeof value === 'string' ? (JSON.parse(value) as Sealed) : null
}

export async function allowHandoff(redis: Redis, client: string): Promise<boolean> {
  const key = `handoff-rate:${client}`
  await redis(['SET', key, 0, 'EX', 60, 'NX'])
  return Number(await redis(['INCR', key])) <= HANDOFF_LIMIT_PER_MINUTE
}

export function memoryRedis(now: () => number = Date.now): Redis {
  const store = new Map<string, { value: string; expires: number }>()
  const live = (key: string) => {
    const entry = store.get(key)
    if (entry && entry.expires <= now()) store.delete(key)
    return store.get(key)
  }
  return async ([command, key, value, , seconds, mode]) => {
    const name = String(key)
    if (command === 'SET') {
      if (mode === 'NX' && live(name)) return null
      store.set(name, { value: String(value), expires: now() + Number(seconds) * 1000 })
      return 'OK'
    }
    if (command === 'INCR') {
      const entry = live(name)
      const count = Number(entry?.value ?? 0) + 1
      store.set(name, { value: String(count), expires: entry?.expires ?? Infinity })
      return count
    }
    const entry = live(name)
    store.delete(name)
    return entry ? entry.value : null
  }
}
