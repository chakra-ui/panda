import type { ComponentChildren } from 'preact'

export function Section({ children }: { children: ComponentChildren }) {
  return <section class="pg-section">{children}</section>
}

export function SectionTitle({ children }: { children: ComponentChildren }) {
  return (
    <div class="pg-section-title">
      <span>{children}</span>
      <span class="pg-docs">Reference</span>
    </div>
  )
}

export function SectionContent({ children }: { children: ComponentChildren }) {
  return <div class="pg-section-content">{children}</div>
}

export function Row({ children }: { children: ComponentChildren }) {
  return <div class="pg-row">{children}</div>
}

export function DemoList({ items }: { items: Array<{ label: string; node: ComponentChildren }> }) {
  return (
    <div class="pg-demo-list">
      {items.map((item) => (
        <div class="pg-demo" key={item.label}>
          <span class="pg-demo-label">{item.label}</span>
          {item.node}
        </div>
      ))}
    </div>
  )
}
