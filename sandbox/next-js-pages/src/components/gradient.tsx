import { css } from '../../styled-system/css'
import { stack } from '../../styled-system/patterns'

export const RadialGradient = () => {
  return (
    <div className={stack({ fontSize: '2xl', fontWeight: 'bold', padding: '4' })}>
      <div
        className={css({
          boxSize: '20',
          rounded: 'full',
          bgRadial: 'in srgb',
          gradientFrom: 'pink.400',
          gradientFromPosition: '40%',
          gradientTo: 'fuchsia.700',
        })}
      />
      <div
        className={css({
          boxSize: '20',
          rounded: 'full',
          bgRadial: 'at 50% 75%',
          gradientFrom: 'sky.200',
          gradientVia: 'blue.400',
          gradientTo: 'indigo.900',
          gradientToPosition: '90%',
        })}
      />
      <div
        className={css({
          boxSize: '20',
          rounded: 'full',
          bgRadial: 'at 25% 25%',
          gradientFrom: 'white',
          gradientTo: 'zinc.900',
          gradientToPosition: '75%',
        })}
      />
    </div>
  )
}

export const LinearGradient = () => {
  return (
    <div>
      <div className={stack({ fontSize: '2xl', fontWeight: 'bold', padding: '4' })}>
        <div
          className={css({
            height: '14',
            bgLinear: 'to-r',
            gradientFrom: 'cyan.500',
            gradientTo: 'blue.500',
          })}
        />
        <div
          className={css({
            height: '14',
            bgLinear: 'to-t',
            gradientFrom: 'sky.500',
            gradientTo: 'indigo.500',
          })}
        />
        <div
          className={css({
            height: '14',
            bgLinear: 'to-bl',
            gradientFrom: 'violet.500',
            gradientTo: 'fuchsia.500',
          })}
        />
        <div
          className={css({
            height: '14',
            bgLinear: '65deg',
            gradientFrom: 'purple.500',
            gradientTo: 'pink.500',
          })}
        />
      </div>
    </div>
  )
}

export const ConicGradient = () => {
  return (
    <div className={stack({ fontSize: '2xl', fontWeight: 'bold', padding: '4' })}>
      <div
        className={css({
          boxSize: '24',
          rounded: 'full',
          bgConic: 'in srgb',
          gradientFrom: 'blue.600',
          gradientTo: 'sky.400',
          gradientToPosition: '50%',
        })}
      />
      <div
        className={css({
          boxSize: '24',
          rounded: 'full',
          bgConic: 'from 180deg',
          gradientFrom: 'blue.600',
          gradientVia: 'blue.50',
          gradientTo: 'blue.600',
        })}
      />
      <div
        className={css({
          boxSize: '24',
          rounded: 'full',
          bgConic: 'in oklch decreasing hue',
          gradientFrom: 'violet.700',
          gradientVia: 'lime.300',
          gradientTo: 'violet.700',
        })}
      />
    </div>
  )
}
