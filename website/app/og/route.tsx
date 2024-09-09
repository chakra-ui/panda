import { ImageResponse } from 'next/og'
import { Logo } from './logo'
import { Yums } from './mascot'

const monaSans = fetch(
  new URL('../../styles/Mona-Sans-Bold.ttf', import.meta.url)
).then(res => res.arrayBuffer())

const upperFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

export const runtime = 'edge'

interface Params {
  category: string
  title: string
}

const getFontSize = (title: string) => {
  if (title.length < 14) return '120px'
  if (title.length < 28) return '82px'
  return '64px'
}

export async function GET(_req: Request, context: { params: Params }) {
  try {
    const category = context.params.category
    const title = context.params.title || 'Build time, type safe, CSS-in-JS'

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            backgroundColor: '#F6E458',
            color: '#000000',
            padding: '80px'
          }}
        >
          <Logo style={{ marginBottom: '56px' }} />
          <div style={{ display: 'flex', gap: '0px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '72%',
                flex: '1'
              }}
            >
              {category && (
                <div
                  style={{
                    display: 'flex',
                    fontFamily: 'Mona Sans',
                    color: '#7B722C',
                    fontSize: '24px',
                    marginBottom: '16px'
                  }}
                >
                  🐼 / {upperFirst(category)}
                </div>
              )}
              <div
                style={{
                  fontSize: getFontSize(title),
                  fontFamily: 'Mona Sans',
                  fontWeight: 700,
                  letterSpacing: '-1.5px'
                }}
              >
                {upperFirst(title)}
              </div>
              {!category && (
                <div
                  style={{
                    marginTop: '40px',
                    fontSize: '40px',
                    fontFamily: 'Mona Sans',
                    fontWeight: 700,
                    letterSpacing: '-1.5px',
                    color: '#000000',
                    borderRadius: '12px',
                    backgroundColor: '#FFF',
                    padding: '12px 24px',
                    border: '6px solid #000000',
                    boxShadow: '4px 3px 0px 0px #000',
                    alignSelf: 'flex-start'
                  }}
                >
                  npm i -D @pandacss/dev
                </div>
              )}
            </div>
            <Yums
              style={{
                width: '275px',
                height: '355px'
              }}
            />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Mona Sans',
            data: await monaSans,
            style: 'normal',
            weight: 700
          }
        ]
      }
    )
  } catch (error) {
    console.log(error.message)
    return new Response('Failed to generate the image', { status: 500 })
  }
}
