import { css } from '../styled-system/css'

const subject = {
  height: '180px',
  rounded: 'xl',
  backgroundImage: 'url(https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
} as const

export function MaskDemo() {
  return (
    <section
      id="mask-demo"
      className={css({
        padding: '5',
        borderWidth: '1px',
        display: 'grid',
        gap: '5',
        background: 'white',
        color: 'gray.900',
      })}
    >
      <p className={css({ fontWeight: 'semibold' })}>Mask utilities</p>
      <div
        className={css({
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '4',
        })}
      >
        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div data-mask-case="none" className={css(subject)} />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>no mask</figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div data-mask-case="bottom" className={css({ ...subject, maskBottomFrom: '40%' })} />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskBottomFrom 40%
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div
            data-mask-case="bottom-stops"
            className={css({ ...subject, maskBottomFrom: '20%', maskBottomTo: '80%' })}
          />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskBottomFrom 20% + maskBottomTo 80%
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div data-mask-case="x" className={css({ ...subject, maskXFrom: '12%', maskXTo: '88%' })} />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskXFrom 12% + maskXTo 88%
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div data-mask-case="y" className={css({ ...subject, maskYFrom: '15%', maskYTo: '85%' })} />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskYFrom 15% + maskYTo 85%
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div
            data-mask-case="edges"
            className={css({
              ...subject,
              maskTopFrom: '12%',
              maskRightFrom: '12%',
              maskBottomFrom: '12%',
              maskLeftFrom: '12%',
            })}
          />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>four edges</figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div data-mask-case="linear" className={css({ ...subject, maskLinear: '45', maskLinearFrom: '30%' })} />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskLinear 45 + maskLinearFrom 30%
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div
            data-mask-case="radial"
            className={css({ ...subject, maskRadialFrom: '20%', maskRadialAt: 'center' })}
          />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskRadialFrom 20% + maskRadialAt center
          </figcaption>
        </figure>

        <figure className={css({ display: 'grid', gap: '2', margin: '0' })}>
          <div
            data-mask-case="stack"
            className={css({ ...subject, maskBottomFrom: '50%', maskRadialFrom: '35%' })}
          />
          <figcaption className={css({ fontSize: 'sm', color: 'gray.600', fontFamily: 'mono' })}>
            maskBottomFrom 50% + maskRadialFrom 35%
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
