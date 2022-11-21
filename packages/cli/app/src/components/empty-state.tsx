type EmptyStateProps = {
  title: string
  children: React.ReactNode
  icon: React.ReactElement
}

export function EmptyState({ title, children, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        placeItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        gap: '20px',
        minHeight: '40vh',
      }}
    >
      <span style={{ fontSize: '3em' }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', opacity: 0.8 }}>
        <div style={{ fontWeight: '600' }}>{title}</div>
        <p>{children}</p>
      </div>
    </div>
  )
}
