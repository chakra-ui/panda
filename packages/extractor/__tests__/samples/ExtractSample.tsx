/* eslint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
import { PropsWithChildren, useState } from 'react'
import { ColorSprinkles, colorSprinkles } from './colors.css'
// import { DessertBox } from "../theme/DessertBox";

const staticColor = 'gray.100' as const
const staticColor2 = 'gray.200' as any
const staticColor3 = 'gray.300' as any

const dynamicColorName = 'something'
const nestedReference = { ref: 'gray.800' } as const
const deepReference = nestedReference.ref

const dynamicElement = 'staticColor'
const dynamicPart1 = 'static'
const dynamicPart2 = 'Color'
const dynamicPartsAsTemplateString = `${dynamicPart1}${dynamicPart2}` as const
const withDynamicPart = {
  dynamicPart1,
  dynamicPart2: dynamicPart2,
}

const dynamicName = 'dynamicColor'
const dynamicLiteralColor = 'gray.900'

const colorMap = {
  staticColor,
  literalColor: 'gray.600',
  [dynamicColorName]: 'gray.700',
  deepReference,
  [dynamicName]: dynamicLiteralColor,
}

const secondRef = 'secondLevel'
const wrapperMap = {
  [secondRef]: dynamicElement,
  thirdRef: withDynamicPart.dynamicPart1,
  fourthRef: withDynamicPart['dynamicPart2'],
}
const dynamicAttribute = 'borderColor'
const objectWithAttributes = { color: 'blackAlpha.400' } as any
const anotherObject = { color: 'blackAlpha.500' }

const dynamicColor = colorMap[dynamicElement]
const array = ['pink.100']
const strIndex = '0'
const numberIndex = 0

const getColorConfig = () => ({ color: 'twitter.100', backgroundColor: 'twitter.200' })

export const Demo = () => {
  const [isShown, setIsShown] = useState(false)

  // const [controlledColor, setControlledColor] = useState("gray.400" as any);
  // const [dynamicVarColor, setDynamicVarColor] = useState("gray.500" as any);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', margin: 'auto' }}>
        <div style={{ textAlign: 'center', fontSize: '50px' }}>Ready to go</div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1>{isShown ? 'Shown' : 'Hidden'}</h1>
          <div>
            <input type="checkbox" onChange={() => setIsShown((current) => !current)} />
          </div>
          {/* <DessertBox>box</DessertBox> */}
          <div className={colorSprinkles({ color: 'blue.100' })}>blue100 without ColorBox</div>
          <div {...{ className: colorSprinkles({ color: 'blue.200' }) }}>blue200 without ColorBox</div>
          <div {...{ ...{ className: colorSprinkles({ color: 'blue.300' }) } }}>blue300 without ColorBox</div>
          <div {...{ ...{ className: colorSprinkles(anotherObject as any) } }}>blue400 without ColorBox</div>
          {/* self closing */}
          <ColorBox color="red.200" />

          {/* jsxopeningelement */}
          <ColorBox color="yellow.300" backgroundColor="blackAlpha.100">
            yellow.300 with children
          </ColorBox>
          <ColorBox color={isShown ? 'cyan.400' : 'cyan.500'}>ternary</ColorBox>
          <ColorBox color={'facebook.400'}>string in expression</ColorBox>
          <ColorBox color={staticColor}>staticColor</ColorBox>
          <ColorBox color={1 === 1 ? 'facebook.500' : staticColor3}>staticColor ternary</ColorBox>
          <ColorBox color={isShown ? 'facebook.600' : staticColor2}>staticColor ternary</ColorBox>
          {/* gray200/gray300 */}
          <ColorBox color={isShown ? staticColor2 : staticColor3}>staticColor ternary</ColorBox>
          {/* gray100 */}
          <ColorBox color={colorMap.staticColor}>colorMap dot staticColor</ColorBox>
          <ColorBox color={{ staticColor: 'facebook.900' }['staticColor']}>colorMap bracket staticColor</ColorBox>
          <ColorBox color={['facebook.900'][0]}></ColorBox>
          <ColorBox color={array[0]}></ColorBox>
          <ColorBox color={array[strIndex]}></ColorBox>
          <ColorBox color={array[numberIndex]}></ColorBox>
          <ColorBox color={(array as any)?.[0] as any}></ColorBox>
          <ColorBox color={[array[0]]![0]}></ColorBox>
          <ColorBox color={[{ staticColor: 'facebook.900' }][0]['staticColor']}></ColorBox>
          <ColorBox color={[{ staticColor: 'facebook.900' }]?.[0]?.['staticColor']}></ColorBox>
          <ColorBox color={([{ staticColor: 'facebook.900' }]! as any)[0]!['staticColor']}></ColorBox>
          <ColorBox color={colorMap['staticColor']}>colorMap bracket staticColor</ColorBox>
          <ColorBox color={colorMap['static' + 'Color'] as any}>
            colorMap bracket binary expression with 2 string literal
          </ColorBox>
          <ColorBox color={colorMap['static' + `${'Color'}`] as any}>
            colorMap bracket binary expression with 1 string literal & 1 template string using string literal
          </ColorBox>
          <ColorBox color={colorMap['static' + `${dynamicPart2}`] as any}>
            colorMap bracket binary expression with 1 string literal & 1 template string using identifier
          </ColorBox>
          <ColorBox color={colorMap[`${dynamicPartsAsTemplateString}`]}>
            colorMap bracket template string using nested template string
          </ColorBox>
          <ColorBox color={colorMap[('static' as any) + `${withDynamicPart['dynamicPart2']}`] as any}>
            colorMap bracket binary expression with 1 string literal & as expression & 1 template string using
            identifier
          </ColorBox>
          <ColorBox color={colorMap[dynamicPart1 + 'Color']!}>
            colorMap bracket binary expression with 1 string literal & 1 identifier and exclamation mark
          </ColorBox>
          <ColorBox color={colorMap[dynamicPart1 + dynamicPart2]}>
            colorMap bracket binary expression with 2 identifier
          </ColorBox>
          {/* gray100 */}
          <ColorBox color={colorMap[dynamicElement]}>colorMap bracket var</ColorBox>
          <ColorBox color={colorMap[wrapperMap[secondRef]]}>colorMap bracket var</ColorBox>
          <ColorBox color={colorMap[wrapperMap.thirdRef + wrapperMap['fourthRef']]}>colorMap bracket var</ColorBox>
          {/* gray600/gray700 */}
          <ColorBox color={colorMap[isShown ? ('literalColor' as const) : 'deepReference'] as any}>
            colorMap bracket conditonal access with ref and literal wrapped with as any
          </ColorBox>
          {/* gray700/gray100 */}
          <ColorBox color={(isShown ? colorMap?.[dynamicColorName] : dynamicColor) as any}>
            conditional colorMap bracket with optional dynamic access and fallback to ref
          </ColorBox>
          {/* gray100 */}
          <ColorBox color={colorMap?.staticColor}>colorMap dot optional staticColor</ColorBox>

          {/* spread */}
          <ColorBox {...{ color: 'facebook.100' }}>spread</ColorBox>
          {/* color.blackAlpha400 */}
          <ColorBox {...objectWithAttributes}>var spread</ColorBox>
          {/* color.blackAlpha400 */}
          <ColorBox {...(isShown ? objectWithAttributes : null)}>conditional var spread</ColorBox>
          {/* color.facebook.200 / backgroundColor.blackAlpha.100 / borderColor.blackAlpha.300 */}
          <ColorBox
            {...{
              color: 'facebook.200',
              backgroundColor: 'blackAlpha.100',
              [dynamicAttribute]: 'blackAlpha.300',
            }}
          >
            multiple spread
          </ColorBox>
          <ColorBox {...(isShown ? { color: 'facebook.200' } : undefined)}>spread ternary</ColorBox>
          <ColorBox {...(isShown && { color: 'facebook.300' })}>spread &&</ColorBox>
          {/* color.twitter.100 / backgroundColor.twitter.200 */}
          <ColorBox {...getColorConfig()}>spread fn result</ColorBox>
          {/* backgroundColor.twitter.200 / color.orange.100 */}
          <ColorBox {...{ ...getColorConfig(), color: 'orange.100' }}>nested spread fn result and override</ColorBox>
          {/* color.orange.200 / backgroundColor.twitter.200 */}
          <ColorBox
            {...{
              ...(isShown ? getColorConfig() : { color: 'never.150' }),
              color: 'orange.200',
            }}
          >
            nested spread conditional fn result and override
          </ColorBox>
          {/* backgroundColor.twitter.200 / color.orange.400 */}
          <ColorBox
            {...{
              ...(!isShown ? (getColorConfig() as any) : ({ [dynamicAttribute]: 'orange.300' } as any)),
              color: 'orange.400',
            }}
          >
            nested spread conditional fn result and override with object literal expression and dynamic attribute
          </ColorBox>
          <ColorBox
            {...{
              ...{
                color: 'telegram.100',
                backgroundColor: 'telegram.200',
              },
              color: 'telegram.300',
              backgroundColor: 'telegram.400',
            }}
          >
            spread with nested spread and override
          </ColorBox>

          {/* conditional properties */}
          <ColorBox color={{ default: 'red.100', hover: 'green.100', focus: 'blue.100' }}>conditional rgb</ColorBox>
          <ColorBox backgroundColor={{ default: 'orange.800', hover: 'telegram.200', focus: 'yellow.700' }}>
            conditional rgb
          </ColorBox>

          {/* unlikely this will ever be supported (unless ezno delivers) */}
          {/* <ColorBox color={controlledColor}>controlledColor</ColorBox>
                    <div onClick={() => setDynamicVarColor("gray.600")}>
                        <ColorBox color={dynamicVarColor}>dynamicVarColor</ColorBox>
                    </div> */}
          {/* uncomment to import the big theme sprinkles */}
          {/* <DessertBox color="blackAlpha.200"></DessertBox>
                    <DessertBox color="blackAlpha.300"></DessertBox>
                    <DessertBox color="blackAlpha.400"></DessertBox> */}
        </div>
      </div>
    </div>
  )
}

const ColorBox = ({ children, ...props }: PropsWithChildren<ColorSprinkles>) => {
  return <div className={colorSprinkles(props)} children={children} />
}

// const Box = ColorBox

function Wrapper(props) {
  return (
    <ColorBox {...props} color="facebook.900">
      wrapper
    </ColorBox>
  )
}

const UsingWrapper = () => <Wrapper color="facebook.800" />
const UsingWrapperWithSpread = (props) => <Wrapper {...props} color="facebook.700" />

const Another = function (anotherProps) {
  return (
    <ColorBox color="facebook.900" {...anotherProps}>
      <ColorBox color="facebook.900">another</ColorBox>
    </ColorBox>
  )
}

const UsingAnother = () => <Another color="facebook.600" />
const UsingAnotherWithSpread = (props) => <Another {...props} color="facebook.500" />

const ref = 'RefSomething'
const componentsMap = {
  ArrowSomething: (props) => (
    <ColorBox color="red.100" {...props}>
      aaa
    </ColorBox>
  ),
  ArrowWithBlockSomething: (props) => {
    return (
      <ColorBox color="red.100" {...props}>
        aaa
      </ColorBox>
    )
  },
  FunctionExpressionSomething: function NamedFn(props) {
    return <ColorBox color="green.100" {...props} />
  },
  AnonymousFunctionExpression: function (props) {
    return <ColorBox color="blue.100" {...props} />
  },
  [ref]: (props) => <ColorBox color="yellow.100" {...props} />,
  // prettier-ignore
  "LiteralRef": (props) => <ColorBox color="orange.100" {...props} />,
  ['ComputedLiteralRef']: (props) => <ColorBox color="orange.300" {...props} />,
}

const { ObjectBindingSomething } = { ObjectBindingSomething: (props) => <ColorBox color="red.100" {...props} /> }
const [RandomName] = [(props) => <ColorBox color="orange.400" {...props} />]

const UsingArrowSomething = () => <componentsMap.ArrowSomething color="red.200" />
const UsingArrowSomethingWithSpread = (props) => <componentsMap.ArrowSomething {...props} color="red.200" />
const LevelThreeUsingArrowSomethingWithSpread = (props) => <UsingArrowSomethingWithSpread {...props} color="red.200" />

const UsingArrowWithBlockSomething = () => <componentsMap.ArrowWithBlockSomething color="red.300" />
const UsingArrowWithBlockSomethingWithSpread = (props) => (
  <componentsMap.ArrowWithBlockSomething {...props} color="red.300" />
)
const LevelThreeUsingArrowWithBlockSomethingWithSpread = (props) => (
  <UsingArrowWithBlockSomethingWithSpread {...props} color="red.300" />
)

const UsingFunctionExpressionSomething = () => <componentsMap.FunctionExpressionSomething color="green.200" />
const UsingFunctionExpressionSomethingWithSpread = (props) => (
  <componentsMap.FunctionExpressionSomething {...props} color="green.200" />
)
const LevelThreeUsingFunctionExpressionSomethingWithSpread = (props) => (
  <UsingFunctionExpressionSomethingWithSpread {...props} color="green.200" />
)

const UsingAnonymousFunctionExpression = () => <componentsMap.AnonymousFunctionExpression color="blue.200" />
const UsingAnonymousFunctionExpressionWithSpread = (props) => (
  <componentsMap.AnonymousFunctionExpression {...props} color="blue.200" />
)

const UsingObjectBindingSomething = () => <ObjectBindingSomething color="red.400" />
const UsingObjectBindingSomethingWithSpread = (props) => <ObjectBindingSomething {...props} color="red.400" />

const UsingRandomName = () => <RandomName color="orange.500" />
const UsingRandomNameWithSpread = (props) => <RandomName {...props} color="orange.500" />

const UsingRef = () => <componentsMap.RefSomething color="yellow.200" />
const UsingRefWithSpread = (props) => <componentsMap.RefSomething {...props} color="yellow.200" />

const UsingLiteralRef = () => <componentsMap.LiteralRef color="orange.200" />
const UsingLiteralRefWithSpread = (props) => <componentsMap.LiteralRef {...props} color="orange.200" />

const UsingComputedLiteralRef = () => <componentsMap.ComputedLiteralRef color="orange.300" />
const UsingComputedLiteralRefWithSpread = (props) => <componentsMap.ComputedLiteralRef {...props} color="orange.500" />

const LevelThreeComponent = (props) => <UsingWrapperWithSpread {...props} color="pink.900" />
const LevelFourComponent = () => <LevelThreeComponent color="pink.800" />
const LevelFourComponentWithSpread = (props) => <LevelThreeComponent {...props} color="pink.800" />
