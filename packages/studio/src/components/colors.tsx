import { Grid, HStack, Stack, panda } from '../../styled-system/jsx'
import { ColorWrapper } from '../components/color-wrapper'
import { TokenContent } from '../components/token-content'
import { TokenGroup } from '../components/token-group'
import { useColorDocs } from '../lib/use-color-docs'
import { Input } from './input'
import { SemanticColorDisplay } from './semantic-color'

const UNCATEGORIZED_ID = 'uncategorized' as const

export function Colors() {
  const { filterQuery, setFilterQuery, semanticTokens, hasResults, uncategorizedColors, categorizedColors } =
    useColorDocs()

  const renderSemanticTokens = () => {
    return semanticTokens.map(([name, colors], i) => {
      return (
        <Stack gap="1" key={i} width="full">
          <HStack gap="1">
            <SemanticColorDisplay
              value={colors[colors.extensions.condition].value}
              condition={colors.extensions.condition}
            />
            <SemanticColorDisplay value={colors.base.value} condition="base" />
          </HStack>

          <panda.span fontWeight="medium">{name}</panda.span>
        </Stack>
      )
    })
  }
  const renderColors = (values: any[]) => {
    return values?.map((color, i) => {
      return (
        <Stack gap="1" key={i}>
          <ColorWrapper style={{ background: color.value }} />
          <Stack mt="2" gap="0.5">
            <panda.div fontWeight="medium">{color.extensions.prop}</panda.div>
            <panda.div opacity="0.7" fontSize="sm" textTransform="uppercase">
              {color.value}
            </panda.div>
          </Stack>
        </Stack>
      )
    })
  }

  return (
    <TokenGroup>
      <panda.div mb="3.5" position="sticky" top="0" zIndex="1">
        <Input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tokens by text, property or value"
        />
      </panda.div>
      <TokenContent>
        <Stack gap="10">
          {!!categorizedColors.length &&
            categorizedColors.map(([category, colors]) => (
              <div key={category}>
                <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                  {category}
                </panda.span>

                <Grid gap="4" minChildWidth="13rem" my="5" mx="0" key={category}>
                  {renderColors(colors)}
                </Grid>
              </div>
            ))}
          {!!uncategorizedColors?.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                {UNCATEGORIZED_ID}
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" my="5" mx="0">
                {renderColors(uncategorizedColors)}
              </Grid>
            </div>
          )}
          {!!semanticTokens.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                Semantic tokens
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" my="5" mx="0">
                {renderSemanticTokens()}
              </Grid>
            </div>
          )}
          {!hasResults && <div>No result found! 🐼</div>}
        </Stack>
      </TokenContent>
    </TokenGroup>
  )
}
