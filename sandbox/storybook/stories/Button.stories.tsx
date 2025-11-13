import { css } from 'styled-system/css'
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Button',
  component: Button,
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
    children: 'Click me',
  },
  render: (args) => (
    <div className={css({ margin: '40px' })}>
      <Button {...args} />
    </div>
  ),
}
