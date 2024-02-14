'use client'

import { useState } from 'react'
import { css } from '../../styled-system/css/index.js'

export const Counter = () => {
  const [count, setCount] = useState(0)

  const handleIncrement = () => setCount((c) => c + 1)

  return (
    <section
      className={css({
        borderWidth: '1px',
        borderColor: 'blue.400',
        mx: '-4',
        mt: '4',
        rounded: 'md',
        borderStyle: 'dashed',
      })}
    >
      <div>Count: {count}</div>
      <button
        onClick={handleIncrement}
        className={css({
          rounded: 'sm',
          bg: 'black',
          px: '2',
          py: '0.5',
          textStyle: 'sm',
          color: 'white',
        })}
      >
        Increment
      </button>
    </section>
  )
}
