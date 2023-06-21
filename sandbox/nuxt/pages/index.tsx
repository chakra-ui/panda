import CompositionApiDemo from '../components/CompositionApiDemo.vue'
import SetupDemo from '../components/SetupDemo.vue'

export default defineComponent(() => {
  return () => (
    <>
      <div>Hello World</div>
      <CompositionApiDemo />
      <SetupDemo />
    </>
  )
})
