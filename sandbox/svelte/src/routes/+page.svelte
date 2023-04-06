<script>
  import { css } from 'panda/css'

  const paddingY = '25px'
  const className = css({ padding: paddingY, fontSize: paddingY ? '2xl' : '4xl' })
  console.log({ className })
</script>

<div class={css({ paddingY: '40px', debug: true })}>wow</div>
