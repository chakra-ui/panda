<script>
  import { css } from 'styled-system/css'

  let style = css({ color: 'green.400' })
</script>

<h1 class={style}>using class binding css</h1>
<div
class={css({
    padding: '40px',
    color: 'red.700',
    fontSize: '3xl',
})}
>
It works in Svelte, using inline styles
</div>
