import React from 'react'
import { css } from '../styled-system/css'
import { Button } from './Button'

export default {
  title: 'Button',
}

export const Simple = () => (
  <div className={css({ margin: '40px' })}>
    <Button>Click me</Button>
  </div>
)
