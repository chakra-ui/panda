'use client'

import { Marquee } from '@ark-ui/react/marquee'
import { marquee } from '@/styled-system/recipes'

const features = [
  'Style props',
  'TypeScript based',
  'Design Tokens',
  'Cascade Layers',
  'Utility Classes',
  'Recipes',
  'Just-in-Time',
  'Variants'
]

const classes = marquee()

export const FeatureMarqueeSection = () => {
  return (
    <Marquee.Root className={classes.root} speed={40} spacing="0.5rem" autoFill>
      <Marquee.Viewport className={classes.viewport}>
        <Marquee.Content className={classes.content}>
          {features.map(feature => (
            <Marquee.Item key={feature} className={classes.item}>
              <span>{feature}</span>
              <span aria-hidden>•</span>
            </Marquee.Item>
          ))}
        </Marquee.Content>
      </Marquee.Viewport>
    </Marquee.Root>
  )
}
