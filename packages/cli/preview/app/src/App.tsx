import './App.css'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@css-panda/token-dictionary'
import { navItems, NavKeys } from './utils/constants'
import { useState } from 'react'
import { Colors } from './components/colors'
import { FontTokens } from './components/font-tokens'
import { Sizes } from './components/sizes'
import { TypographyPlayground } from './components/typography-playground'

function App() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  const [page, setPage] = useState(NavKeys.COLORS)

  return (
    <main>
      <aside>
        <span className="title">🐼 Panda</span>
        <ul>
          {navItems.map((themeKey) => (
            <li
              key={themeKey.id}
              data-active={page === themeKey.id ? '' : undefined}
              onClick={() => {
                setPage(themeKey.id)
              }}
            >
              {themeKey.label}
            </li>
          ))}
        </ul>
      </aside>
      <div className="content">
        {page === NavKeys.COLORS && <Colors colors={tokens.colors} />}

        {page === NavKeys.LETTER_SPACINGS && (
          <FontTokens
            fontTokens={tokens.letterSpacings}
            token="letterSpacing"
            text="The quick brown fox jumps over the lazy dog."
          />
        )}
        {page === NavKeys.LINE_HEIGHTS && (
          <FontTokens
            fontTokens={tokens.lineHeights}
            token="lineHeight"
            largeText
            text="So I started to walk into the water. I won't lie to you boys, I was terrified. But I pressed on, and as I made my way past the breakers a strange calm came over me. I don't know if it was divine intervention or the kinship of all living things but I tell you Jerry at that moment, I was a marine biologist."
          />
        )}
        {page === NavKeys.FONT_WEIGHTS && <FontTokens fontTokens={tokens.fontWeights} token="fontWeight" />}
        {page === NavKeys.FONT_SIZES && <FontTokens fontTokens={tokens.fontSizes} token="fontSize" />}
        {page === NavKeys.SIZES && <Sizes sizes={tokens.sizes} />}
        <hr />
        {/* {page === NavKeys.TYPOGRAPHY_PLAYGROUND && <TypographyPlayground config={config} />} */}
        {/* {page === NavKeys.SPACING_PLAYGROUND && <SpacingPlayground sizes={tokens.sizes} />} */}
        {/* {page === NavKeys.CONTRAST_CHECKER && <ContrastChecker colors={tokens.colors} />} */}
      </div>
    </main>
  )
}

export default App
