import { styled } from '../../styled-system/jsx'

const One = styled.div`
  display: flex;
  width: 300px;
  border: 1px solid black;
  justify-content: center;
  --test: 4px;
`

const Two = styled(One)`
  justify-content: flex-start;
  margin-top: var(--test);
`

export default function Home() {
  return (
    <div>
      <One>one</One>
      <Two>two</Two>
    </div>
  )
}
