import CompositionApiDemo from '../components/CompositionApiDemo.vue'
import SetupDemo from '../components/SetupDemo.vue'
import Styled from '../components/Styled.vue'

export default defineComponent(() => {
  return () => (
    <>
      <div>Hello World</div>
      <CompositionApiDemo />
      <SetupDemo />
      <Styled>styled</Styled>
    </>
  )
})
