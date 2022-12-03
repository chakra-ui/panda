import { panda, Stack, Grid } from '../../design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'
import { ColorWrapper } from '../components/color-wrapper'
import { useColorDocs } from '../hooks/use-color-docs'

const UNCATEGORIZED_ID = 'uncategorized' as const

const extractColor = (col: string) => {
  const format = /{colors.(.*)}/
  const result = col.match(format)
  return `colors.${result?.[1]}`
}

export function Colors() {
  const { filterQuery, setFilterQuery, semanticTokens, hasResults, uncategorizedColors, categorizedColors } =
    useColorDocs()

  const renderSemanticTokens = () => {
    return semanticTokens.map(([name, colors], i) => {
      return (
        <Stack gap="1" key={i}>
          <ColorWrapper height="40" borderRadius="xl" style={{ background: colors[colors.extensions.condition].value }}>
            <panda.span
              position="absolute"
              top="50%"
              right="2"
              textTransform="uppercase"
              fontWeight="semibold"
              fontSize="medium"
              writingMode="vertical-lr"
              transform="rotate(180deg)"
              minW="5"
            >
              {colors.extensions.condition}
            </panda.span>
            <ColorWrapper height="40" width="80%" borderRadius="lg" style={{ background: colors.base.value }}>
              <panda.span
                position="absolute"
                top="50%"
                right="2"
                textTransform="uppercase"
                fontWeight="semibold"
                fontSize="medium"
                writingMode="vertical-lr"
                transform="rotate(180deg)"
                minW="5"
              >
                Base
              </panda.span>
            </ColorWrapper>
          </ColorWrapper>
          <span>
            <panda.span textTransform="capitalize" fontWeight="semibold">
              {name}
            </panda.span>
          </span>
          {Object.entries<string>(colors.extensions.conditions).map(([cond, val]) => {
            const isLinked = colors[cond].isReference
            return (
              <div key={cond}>
                <span>
                  <span>{`${cond}: ${extractColor(val)}`}</span>
                  {isLinked && (
                    <panda.span
                      fontSize="small"
                      borderRadius="lg"
                      paddingX="2"
                      paddingY="0.5"
                      marginLeft="3"
                      background="card"
                      color="white"
                    >
                      🔗 alias
                    </panda.span>
                  )}
                </span>
              </div>
            )
          })}
        </Stack>
      )
    })
  }
  const renderColors = (values: any[]) => {
    return values?.map((color, i) => {
      return (
        <Stack gap="1" key={i}>
          <ColorWrapper
            style={{
              background: color.value,
            }}
          />
          <panda.div opacity="0.7">{color.value}</panda.div>
          <panda.div opacity="0.7">{color.extensions.prop}</panda.div>
          <panda.div opacity="0.7">{color.extensions.varRef}</panda.div>
        </Stack>
      )
    })
  }

  return (
    <TokenGroup>
      <panda.div marginBottom="3.5" position="sticky" top="0" boxShadow="lg" zIndex="1">
        <panda.input
          background="card"
          width="full"
          padding="1"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tokens by text, property or value"
        />
      </panda.div>
      <TokenContent>
        <div>
          {!!categorizedColors.length &&
            categorizedColors.map(([category, colors]) => (
              <div key={category}>
                <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                  {category}
                </panda.span>

                <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0" key={category}>
                  {renderColors(colors)}
                </Grid>
              </div>
            ))}
          {!!uncategorizedColors?.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                {UNCATEGORIZED_ID}
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0">
                {renderColors(uncategorizedColors)}
              </Grid>
            </div>
          )}
          {!!semanticTokens.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                Semantic tokens
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0">
                {renderSemanticTokens()}
              </Grid>
            </div>
          )}
          {!hasResults && <div>No result found! 🐼</div>}
        </div>
      </TokenContent>
    </TokenGroup>
  )
}
