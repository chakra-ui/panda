import { EXAMPLES } from '@/components/examples/data'
import { prisma } from '../../../prisma'

export async function GET({ params }: { params: { id: string } }) {
  const id = params.id

  if (import.meta.env.DEV) {
    const picked = EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]
    return new Response(JSON.stringify(picked), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const initialState = await prisma.session.findFirst({
    where: { id },
    select: { code: true, config: true },
  })

  return new Response(JSON.stringify(initialState), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
