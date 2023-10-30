import { nanoid } from 'nanoid'
import { z } from 'zod'
import { prisma } from '@/prisma'
import type { APIRoute } from 'astro'

const schema = z.object({ code: z.string(), config: z.string() })

export const POST: APIRoute = async ({ request }) => {
  const id = nanoid(10)
  const body = await request.json()
  const data = schema.parse(body)

  if (import.meta.env.DEV) {
    return new Response(
      JSON.stringify({ success: true, data: { id, ...data } }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  try {
    const session = await prisma.session.create({
      data: { id, ...data },
      select: { id: true },
    })
    return new Response(JSON.stringify({ success: true, data: session }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.log(e)
    return new Response(JSON.stringify({ success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
