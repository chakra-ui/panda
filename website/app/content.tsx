import { HTMLPandaProps, panda } from '../styled-system/jsx'
import { cx } from '../styled-system/css'
import { content } from '../styled-system/recipes'

export const Content = ({ className, ...props }: HTMLPandaProps<'div'>) => {
  const [recipeProps, rest] = content.splitVariantProps(props)
  return <panda.div {...rest} className={cx(content(recipeProps), className)} />
}
