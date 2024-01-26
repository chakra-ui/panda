import { useEffect, useState } from 'react'
import { Profiler } from './components/profiler'
import { RandomizedButtons } from './components/randomized-buttons'

const instances = 1000

export default function App() {
  return (
    <>
      {/* <CvaButtonProfiler /> */}
      <CvaButtonRerenderer />
    </>
  )
}

const CvaButtonProfiler = () => {
  const [key, setKey] = useState(null)
  return (
    <Profiler name="panda" id="panda" onRerender={(newKey: any) => setKey(newKey)}>
      <RandomizedButtons key={key} instances={instances} />
    </Profiler>
  )
}

const CvaButtonRerenderer = () => {
  const [key, setKey] = useState(0)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      setKey(Math.random())
    }, 20)

    return () => {
      clearInterval(interval)
    }
  }, [enabled])

  return (
    <>
      <div style={{ padding: '50px' }}>
        <button onClick={() => setEnabled(!enabled)}>Toggle</button>
      </div>

      <RandomizedButtons key={key} instances={instances} />
    </>
  )
}
