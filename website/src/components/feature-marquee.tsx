import Marquee from 'react-fast-marquee'
import { css } from '@/styled-system/css'
import { HStack, panda } from '@/styled-system/jsx'

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

export const FeatureMarquee = () => {
  return (
    <panda.div bg="bg.inverted" py="5" textStyle="2xl" fontWeight="semibold">
      <Marquee
        className={css({
          listStyleType: 'none',
          _motionReduce: {
            '& .rfm-marquee': {
              animation: 'none!'
            }
          }
        })}
        autoFill
      >
        {features.map((feature, index) => (
          <panda.li key={index} mx="2">
            <HStack gap="4">
              <panda.span letterSpacing="tight">{feature}</panda.span>
              <span>•</span>
            </HStack>
          </panda.li>
        ))}
      </Marquee>
    </panda.div>
  )
}
