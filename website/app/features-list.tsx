import { css } from '../styled-system/css'
import { panda } from '../styled-system/jsx'
import Marquee from 'react-fast-marquee'

export const FeaturesList = () => {
  return (
    <panda.div
      bgColor="panda.bg.inverted"
      px="30px"
      py="20px"
      fontSize="24px"
      lineHeight="32px"
      fontWeight="semibold"
    >
      <Marquee
        className={css({ listStyleType: 'none', letterSpacing: 'tight' })}
        autoFill
      >
        <panda.li mx="2">Style props</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">TypeScript based</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Design Tokens</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Cascade Layers</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Utility Classes</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Recipes</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Just-in-Time</panda.li>
        <panda.li mx="2">•</panda.li>
        <panda.li mx="2">Fast</panda.li>
      </Marquee>
    </panda.div>
  )
}
