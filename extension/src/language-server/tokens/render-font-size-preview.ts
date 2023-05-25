import fs from 'fs'
import path from 'path'
import satori from 'satori'

// __dirname = extension/out
export const Roboto = fs.readFileSync(path.resolve(__dirname, '../Roboto-Medium.ttf'))

// https://og-playground.vercel.app/?share=bZBBT4QwEIX_SjPG7KWJuCqHZvWyMdGzJnvhUugUupaWtEVEwn-3BS9kd04z873My7wJKisQGByE-i4MIT6MGp-nKfWENKjqJjCyu8-y2x1dl2sNSoTmKhHKd5qPkUmNP1vGtarNe8DWR1yhCei2gnPvg5Lj0UZkkvM1Ucmrr9rZ3oij1dZF1Y2UcquR8cKH-kVGHvYX4PT_V55lC5vnwryk5g21tpScrNOiMIe7mErcAwXbBWWNBzbB8jmw_VNOYQ0IWP5IQWDZ18Ak1x4pYGvP6nPsUrhhWKZ4Jpm_tiUKYMH1OFMIvIyKJvkOyRXmPw
export const renderFontSizePreview = (
  text: string,
  fontSize: string,
  options?: {
    width: number
    height: number
  },
) => {
  return satori(
    {
      type: 'div',
      key: null,
      props: {
        children: text,
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontSize: fontSize,
        },
      },
    },
    {
      width: 264,
      height: 64,
      ...options,
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
}
