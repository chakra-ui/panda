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

export const FeatureMarqueeSection = () => {
  return (
    <Marquee.Root className={marquee()} speed={40}>
      <Marquee.Viewport>
        <Marquee.Content>
          {features.map(feature => (
            <Marquee.Item key={feature}>
              <span>{feature}</span>
              <span aria-hidden>•</span>
            </Marquee.Item>
          ))}
        </Marquee.Content>
      </Marquee.Viewport>
    </Marquee.Root>
  )
}
