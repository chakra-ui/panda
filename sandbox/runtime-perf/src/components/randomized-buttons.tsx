import { Button } from './button'

const tones = ['brand', 'critical', 'neutral'] as const
const sizes = ['sm', 'md', 'lg'] as const

const between = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

export const RandomizedButtons = ({ instances }: { instances: number }) => (
  <>
    {[...Array(instances).keys()].map((key) => (
      <Button key={key} size={sizes[between(0, sizes.length - 1)]} tone={tones[between(0, tones.length - 1)]}>
        Button
      </Button>
    ))}
  </>
)
