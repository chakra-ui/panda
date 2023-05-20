import { BrightProps, Code } from 'bright'
import { CodeTabs, TabsContent, TabsList } from './code-tabs'
import { codeTabs } from '../styled-system/recipes'

function TitleBarComponent(brightProps: BrightProps) {
  const { subProps, title } = brightProps
  const titles = subProps?.length
    ? subProps.map(subProp => subProp.title)
    : [title]
  return <TabsList titles={titles as string[]} />
}

function Root(brightProps: BrightProps) {
  const { subProps, title } = brightProps

  const titles = subProps?.length
    ? subProps.map(subProp => subProp.title)
    : [title]

  return (
    <CodeTabs defaultValue={titles[0]} className={codeTabs()}>
      {/* @ts-expect-error Server Component */}
      <Code.Root {...brightProps} />
    </CodeTabs>
  )
}

function Content(brightProps: BrightProps) {
  const { subProps } = brightProps
  const propsList = subProps?.length ? subProps : [brightProps]
  return (
    <>
      {propsList.map(props => (
        <TabsContent key={props.title} value={props.title!}>
          {/* @ts-expect-error Server Component */}
          <Code.Pre {...props} />
        </TabsContent>
      ))}
    </>
  )
}

/** @type {import("bright").Extension} */
export const tabs = {
  name: 'tabs',
  Root,
  TitleBarContent: TitleBarComponent,
  Pre: Content
}
