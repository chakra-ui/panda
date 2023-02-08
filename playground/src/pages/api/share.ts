import { nanoid } from 'nanoid'
import type { NextApiRequest, NextApiResponse } from 'next'
import { match } from 'ts-pattern'
import { z } from 'zod'
import { prisma } from '../../client/prisma'

const schema = z.object({
  code: z.string(),
  theme: z.string(),
  view: z.enum(['code', 'config']).optional(),
})

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  match(req)
    .with({ method: 'POST' }, async () => {
      try {
        const { code, theme } = schema.parse(req.body)
        const id = nanoid(10)
        await prisma.session.create({ data: { id, code, theme } })
        return res.status(200).json({ id })
      } catch (e) {
        console.log(e)
        return res.status(500).json({ success: false })
      }
    })
    .otherwise(() => res.setHeader('Allow', 'POST').status(405).end('Method Not Allowed'))

export default handler
