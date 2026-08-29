import { styled } from '../../styled-system/jsx'

const One = styled('div', {
  base: {
    display: 'flex',
    width: '300px',
    border: '1px solid black',
    justifyContent: 'center',
    '--test': '4px',
  },
})

const Two = styled(One, {
  base: {
    justifyContent: 'flex-start',
    marginTop: 'var(--test)',
  },
})

export default function Home() {
  return (
    <div>
      <One>one</One>
      <Two>two</Two>
    </div>
  )
}
