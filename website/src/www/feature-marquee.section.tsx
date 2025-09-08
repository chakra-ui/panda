import { sva } from '@/styled-system/css'
import Marquee from 'react-fast-marquee'

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

const recipe = sva({
  slots: ['root', 'marquee', 'item', 'itemText'],
  base: {
    root: {
      bg: 'bg.inverted',
      py: '5',
      textStyle: '2xl',
      fontWeight: 'semibold'
    },
    marquee: {
      listStyleType: 'none',
      _motionReduce: {
        '& .rfm-marquee': {
          animation: 'none!'
        }
      }
    },
    item: {
      mx: '2',
      display: 'flex',
      alignItems: 'center',
      gap: '2'
    },
    itemText: {
      letterSpacing: 'tight'
    }
  }
})

export const FeatureMarqueeSection = () => {
  const root = recipe()
  return (
    <div className={root.root}>
      <Marquee className={root.marquee} autoFill>
        {features.map((feature, index) => (
          <div key={index} className={root.item}>
            <span className={root.itemText}>{feature}</span>
            <span>•</span>
          </div>
        ))}
      </Marquee>
    </div>
  )
}
