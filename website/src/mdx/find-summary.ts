import { Children, cloneElement, isValidElement } from 'react'
import { Details } from './details'
import { Summary } from './summary'

export const findSummary = (children: React.ReactNode) => {
  let summary: React.ReactNode = null
  const childNodes: React.ReactNode[] = []

  Children.forEach(children, (child, index) => {
    if (isValidElement(child) && child.type === Summary) {
      summary ||= child
      return
    }

    let c = child

    if (
      !summary &&
      isValidElement<React.PropsWithChildren>(child) &&
      child.type !== Details &&
      'props' in child &&
      child.props
    ) {
      const result = findSummary(child.props.children)
      summary = result[0]
      c = cloneElement(child, {
        ...child.props,
        children: result[1]?.length ? result[1] : undefined,
        key: index
      })
    }

    childNodes.push(c)
  })

  return [summary, childNodes]
}
