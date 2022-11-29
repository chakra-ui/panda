import { panda } from 'design-system/jsx'

type EmptyStateProps = {
  title: string
  children: React.ReactNode
  icon: React.ReactElement
}

export function EmptyState({ title, children, icon }: EmptyStateProps) {
  return (
    <panda.div
      display="flex"
      flexDirection="column"
      placeItems="center"
      justifyContent="center"
      height="full"
      textAlign="center"
      gap="5"
      minHeight="40vh"
    >
      <panda.span fontSize="12">{icon}</panda.span>
      <panda.div display="flex" flexDirection="column" opacity="0.8">
        <panda.div fontWeight="600">{title}</panda.div>
        <p>{children}</p>
      </panda.div>
    </panda.div>
  )
}
