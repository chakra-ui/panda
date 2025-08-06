import { css } from '../../styled-system/css'

export const Gradient = () => {
  return (
    <div class={css({ display: 'flex', gap: '4', p: '4' })}>
      <div class={css({ boxSize: '100px', bgLinear: 'simple' })} />
      <div class={css({ boxSize: '100px', bgLinear: 'primary' })} />
      <div
        class={css({
          boxSize: '100px',
          bgGradient: 'to-r',
          gradientFrom: 'red.200',
          gradientTo: 'blue.200',
        })}
      />
      <h1 class={css({ textGradient: 'simple' })}>Hello</h1>
      <h1 class={css({ textGradient: 'to-r', gradientFrom: 'red.200', gradientTo: 'blue.200' })}>Hello</h1>
    </div>
  )
}
