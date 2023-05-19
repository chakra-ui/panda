import { Code } from 'bright'
import { TabsRoot, TabsContent, TabsList } from './client'

/** @type {import("bright").BrightProps["TitleBarContent"]} */
function TitleBarComponent(brightProps) {
  const { subProps, title, Tab } = brightProps
  const titles = subProps?.length
    ? subProps.map(subProp => subProp.title)
    : [title]
  const childProps = subProps?.length ? subProps : [brightProps]
  return (
    <TabsList titles={titles}>
      {titles.map((title, i) => (
        <Tab key={title} {...childProps[i]} />
      ))}
    </TabsList>
  )
}

/** @type {import("bright").BrightProps["Root"]} */
function Root(brightProps) {
  const { subProps, title } = brightProps

  const titles = subProps?.length
    ? subProps.map(subProp => subProp.title)
    : [title]

  return (
    <TabsRoot defaultValue={titles[0]}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
[data-bright-tab][data-state="inactive"]{
  --tab-background: var(--inactive-tab-background);
  --tab-color: var(--inactive-tab-color);;
  --tab-bottom-border: transparent;
  --tab-top-border: transparent;
}`
        }}
      />
      {/* @ts-expect-error Server Component */}
      <Code.Root {...brightProps} />
    </TabsRoot>
  )
}

/** @type {import("bright").BrightProps["Pre"]} */
function Content(brightProps) {
  const { subProps } = brightProps
  const propsList = subProps?.length ? subProps : [brightProps]
  return (
    <>
      {propsList.map(props => (
        <TabsContent key={props.title} value={props.title}>
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
