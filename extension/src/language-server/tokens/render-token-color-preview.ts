import { Dict } from '@pandacss/types'
import { type PandaContext } from '@pandacss/node'
import satori from 'satori'
import { Token } from './types'
import { svgToMarkdownLink } from './utils'
import { Roboto } from './render-font-size-preview'

// https://og-playground.vercel.app/?share=5ZTNTsMwDMdfJbLELdI2xHYIgwMfb4DEJZe2cdtAmlRJSqmqvjtNw8ZEGUzihMglsRP_9bMtp4fMCAQGWyFfuCbE-U7hVd-HMyElyqL0jHBYLZdnHGh0t1L4cuYV0tUq6YI_V_i69wfjTlrMvDQ63GZGNZXmEK6HgevrcNgBfEY4rhuVGVm920GKkEnsUG4uGANvEifdR3RYldSPu9TWB5l9U4o5Rlhpkj0X1jRa3BplbIgqLOKY8_5RpCVk8RvgL6BOy-Yk5FQ1eJR4uxiB_0XnOlTKtH-rdRbFj52L-yXXQMHUYTgdsB6m4QZ2vt5QiJDANhcUBKZNASxPlEMKWJkn-dDV4e_w7WSNMrnR_r5KUQDztsGBgk_S8UU5ldBYJWB4Aw
export const renderTokenColorPreview = async (ctx: PandaContext, token: Token) => {
  const colors = [] as [tokenName: string, value: string][]

  // Only bother displaying a preview for multiple colors
  if (token.extensions.conditions) {
    Object.entries(token.extensions.conditions).forEach(([conditionName, value]) => {
      const [tokenRef] = ctx.tokens.getReferences(value)

      colors.push([conditionName, tokenRef.value])
    })
  }
  if (!colors.length) return

  const svg = await satori(
    createDiv(
      {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      },
      colors.map(([conditionName, backgroundColor]) =>
        createDiv(
          { height: '100%', flex: 1, padding: '4px', display: 'flex', justifyContent: 'center', backgroundColor },
          createDiv({ height: '100%', padding: '4px', backgroundColor: 'white', color: 'black' }, conditionName),
        ),
      ),
    ),
    {
      width: 256,
      height: 28 * colors.length,
      fonts: [
        {
          name: 'Roboto',
          data: Roboto,
          weight: 400,
          style: 'normal',
        },
      ],
    },
  )

  return svgToMarkdownLink(svg)
}

type Styles = {
  width: number
  height: number
}

const createDiv = (style: Dict, children?: DivNode) => ({ type: 'div', key: null, props: { style, children } })
type DivLike = {
  type: string
  key: null
  props: {
    style: Dict
    children: any
  }
}
type DivNode = string | DivLike | DivLike[] | null
