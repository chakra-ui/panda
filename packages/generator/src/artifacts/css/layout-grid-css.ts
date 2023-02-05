import { outdent } from 'outdent'

const css = String.raw

export const layoutGrid = css`
  .panda-layout-grid {
    display: grid;
    gap: var(--gutter);
    grid-template-columns: repeat(var(--count), 1fr);
    height: 100%;
    width: 100%;
    position: absolute;
    inset: 0;
    pointer-events: none;
    max-width: var(--max-width);
    margin-inline: var(--margin-x);
    padding-inline: var(--padding-x);
  }
  .panda-layout-grid__item {
    display: flex;
    --color: rgba(255, 0, 0, 0.1);
    height: 100%;
  }
  .panda-layout-grid__item[data-variant='bg'] {
    background: var(--color);
  }
  .panda-layout-grid__item[data-variant='outline'] {
    border-inline: 1px solid var(--color);
  }
`

export function generateLayoutGridCss() {
  return outdent`
  @layer base {
      ${layoutGrid}
  }`
}
