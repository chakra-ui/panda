import { nanoid } from 'nanoid'
import type { NextApiRequest, NextApiResponse } from 'next'
import { z } from 'zod'
import { prisma } from '../../client/prisma'

const schema = z.object({
  code: z.string(),
  css: z.string(),
  config: z.string(),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed')
  }

  try {
    const data = schema.parse(req.body)
    const id = nanoid(10)
    const session = await prisma.session.create({ data: { id, ...data }, select: { id: true } })
    return res.status(200).json({ success: true, data: session })
  } catch (e) {
    console.log(e)
    return res.status(500).json({ success: false })
  }
}

export default handler
