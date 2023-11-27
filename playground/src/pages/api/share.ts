import { nanoid } from 'nanoid'
import type { NextApiRequest, NextApiResponse } from 'next'
import { match } from 'ts-pattern'
import { z } from 'zod'
import { prisma } from '../../client/prisma'

const schema = z.object({
  code: z.string(),
  css: z.string(),
  config: z.string(),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  match(req)
    .with({ method: 'POST' }, async () => {
      try {
        const data = schema.parse(req.body)
        const id = nanoid(10)
        const session = await prisma.session.create({ data: { id, ...data }, select: { id: true } })
        return res.status(200).json({ success: true, data: session })
      } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false })
      }
    })
    .otherwise(() => res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed'))

export default handler
