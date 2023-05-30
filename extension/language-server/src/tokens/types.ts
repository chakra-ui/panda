import { type PandaContext } from '@pandacss/node'

export type Token = NonNullable<ReturnType<PandaContext['tokens']['getByName']>>
