import { panda, Stack, Grid, HStack } from '../../styled-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'
import { ColorWrapper } from '../components/color-wrapper'
import { useColorDocs } from '../hooks/use-color-docs'

const UNCATEGORIZED_ID = 'uncategorized' as const

// remove initial underscore
const cleanCondition = (condition: string) => condition.replace(/^_/, '')

function SemanticColorDisplay(props: { value: string; condition: string }) {
  const { value, condition } = props
  return (
    <ColorWrapper height="12" style={{ background: value }}>
      <panda.span
        fontWeight="medium"
        fontSize="sm"
        minW="5"
        bg="neutral.800"
        px="1"
        py="1"
        roundedBottomRight="sm"
        borderWidth="1px"
        borderColor="neutral.700"
      >
        {cleanCondition(condition)}
      </panda.span>
    </ColorWrapper>
  )
}

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
          <ColorWrapper
            style={{
              background: color.value,
            }}
          />
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
        <Stack gap="10">
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
        </Stack>
      </TokenContent>
    </TokenGroup>
  )
}
