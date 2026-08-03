import { useState } from 'preact/hooks'
import { byShade, GRID_KIND, groupFamilies, SAMPLE, scaleRows, shadeOf, type StudioToken, typeStyle } from './helpers'

export function PandaMark() {
  return (
    <svg class="logo" viewBox="0 0 15 15" width={20} height={20} fill="currentColor">
      <path d="M10.7608 0.390669C9.38613 -0.0126127 7.98396 -0.067426 6.55506 0.0630881C5.75542 0.147945 4.98667 0.310054 4.24518 0.594509C2.64244 1.20936 1.43903 2.27424 0.72147 3.87754C0.207033 5.02698 0.0211109 6.24802 0.0017347 7.50081C-0.0187424 8.8248 0.143717 10.1305 0.401862 11.4249C0.635852 12.5983 0.947463 13.7487 1.39249 14.8591C1.43477 14.9646 1.48743 15.0002 1.60028 15C3.0078 14.9969 4.41533 14.9969 5.82286 14.9969C6.23955 14.9969 6.65623 14.9969 7.07292 14.9968C7.10483 14.9968 7.13673 14.995 7.17342 14.993C7.19215 14.9919 7.21213 14.9908 7.23399 14.9898C7.22553 14.9693 7.21796 14.9504 7.21087 14.9327C7.19692 14.8979 7.18479 14.8676 7.17125 14.838C7.06947 14.6156 6.96558 14.3942 6.86169 14.1728C6.63635 13.6924 6.41101 13.2121 6.20721 12.7224C5.5891 11.2373 5.11575 9.7082 4.9713 8.08959C4.90756 7.37541 4.91641 6.66531 5.11044 5.96941C5.33222 5.17396 5.80814 4.6124 6.59715 4.37763C7.32168 4.16204 8.05629 4.16346 8.77688 4.40144C9.42 4.61383 9.8393 5.06248 10.0176 5.73423C10.1546 6.25013 10.1546 6.77159 10.051 7.29169C9.97115 7.69214 9.81051 8.05756 9.52137 8.34988C9.00271 8.87423 8.35495 8.9948 7.6599 8.95462C7.53624 8.94747 7.41295 8.93362 7.28592 8.91936C7.22642 8.91267 7.16609 8.9059 7.10452 8.89968C7.10629 8.91977 7.10727 8.93828 7.10819 8.95562C7.10999 8.98973 7.11156 9.01931 7.11843 9.04755C7.14805 9.16913 7.17627 9.29115 7.2045 9.41319C7.27249 9.70715 7.3405 10.0012 7.42793 10.289C7.59961 10.8542 7.79925 11.4058 8.02556 11.9443C9.63883 11.8158 11.1248 11.4062 12.7019 10.4393C12.7256 10.4241 12.7471 10.4103 12.7686 10.3966C13.4461 9.96587 13.9944 9.40712 14.3725 8.68563C14.9848 7.51725 15.1042 6.26777 14.9223 4.97808C14.7345 3.64712 14.1497 2.52993 13.1429 1.6536C12.4446 1.0458 11.6371 0.647746 10.7608 0.390669Z" />
    </svg>
  )
}

export function GridPreview({ category, value }: { category: string; value: string }) {
  const kind = GRID_KIND[category]
  if (kind === 'radius') return <div class="chip" style={{ background: 'var(--swatch)', borderRadius: value }} />
  if (kind === 'border') return <div class="chip" style={{ border: value }} />
  if (kind === 'blur')
    return (
      <div
        class="chip"
        style={{ background: 'linear-gradient(135deg, var(--accent), #ec4899)', filter: `blur(${value})` }}
      />
    )
  if (kind === 'ratio')
    return (
      <div style={{ height: 64, aspectRatio: value, maxWidth: '100%', background: 'var(--swatch)', borderRadius: 6 }} />
    )
  if (kind === 'animation') return <div class="anim-box" style={{ animation: value }} />
  if (kind === 'easing')
    return (
      <div class="ease-track">
        <div class="ease-dot" style={{ animationTimingFunction: value }} />
      </div>
    )
  if (kind === 'duration')
    return (
      <div class="ease-track">
        <div class="ease-dot" style={{ animationDuration: value, animationTimingFunction: 'linear' }} />
      </div>
    )
  return null
}

export function Card({ token }: { token: StudioToken }) {
  return (
    <div class="card">
      <div class="preview">
        <GridPreview category={token.category} value={token.value} />
      </div>
      <div class="name">{token.name}</div>
      <div class="value">{token.value}</div>
    </div>
  )
}

export function ShadowCard({ token }: { token: StudioToken }) {
  return (
    <div class="card">
      <div class="preview preview-shadow">
        <div class="shadow-pair">
          <div class="shadow-cell force-light">
            <div class="chip" style={{ boxShadow: token.value }} />
          </div>
          <div class="shadow-cell force-dark">
            <div class="chip" style={{ boxShadow: token.value }} />
          </div>
        </div>
      </div>
      <div class="name">{token.name}</div>
      <div class="value">{token.value}</div>
    </div>
  )
}

export function Palette({ items }: { items: StudioToken[] }) {
  return (
    <>
      {groupFamilies(items).map(([family, shades]) => (
        <div class="palette" key={family}>
          <div class="palette-name">{family}</div>
          <div class="shades">
            {shades
              .slice()
              .sort(byShade)
              .map((token) => (
                <div key={token.path}>
                  <div class="shade-chip" style={{ background: token.value }} title={token.value} />
                  <div class="shade-name">{shadeOf(token.name)}</div>
                  <div class="shade-value">{token.value}</div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </>
  )
}

export function TypeList({ category, items }: { category: string; items: StudioToken[] }) {
  return (
    <div class="type-list">
      {items.map((token) => (
        <div key={token.path}>
          <div class="type-meta">
            <span class="type-name">{token.name}</span>
            <span class="type-value">{token.value}</span>
          </div>
          <div class="type-sample" style={typeStyle(category, token.value)}>
            {category === 'lineHeights' ? `${SAMPLE}. ${SAMPLE}.` : SAMPLE}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Scale({ items }: { items: StudioToken[] }) {
  const [sort, setSort] = useState<'asc' | 'desc' | 'token'>('asc')
  return (
    <>
      <div class="sort-control">
        <label>
          Sort
          <select value={sort} onChange={(e) => setSort((e.currentTarget as HTMLSelectElement).value as typeof sort)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
            <option value="token">Token order</option>
          </select>
        </label>
      </div>
      <div class="scale">
        {scaleRows(items, sort).map(({ token, px, width }) => (
          <>
            <div class="s-name">{token.name}</div>
            <div class="s-value">{token.value}</div>
            <div class="s-px">{Math.round(px)}px</div>
            <div class="s-track">
              <div class="s-bar" style={{ width: `${width}%` }} />
            </div>
          </>
        ))}
      </div>
    </>
  )
}

export function Semantic({ items }: { items: StudioToken[] }) {
  const byCategory = new Map<string, StudioToken[]>()
  for (const token of items) {
    if (!byCategory.has(token.category)) byCategory.set(token.category, [])
    byCategory.get(token.category)!.push(token)
  }
  const multi = byCategory.size > 1
  return (
    <>
      {[...byCategory.entries()].map(([category, group]) => (
        <>
          {multi && <h3 class="semantic-sub">{category}</h3>}
          {category === 'colors' ? (
            group.map((token) => (
              <div class="palette" key={token.path}>
                <div class="palette-name">{token.name}</div>
                <div class="shades">
                  {Object.entries(token.conditions ?? {}).map(([label, value]) => (
                    <div key={label}>
                      <div class="shade-chip" style={{ background: value }} title={value} />
                      <div class="shade-name">{label}</div>
                      <div class="shade-value">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div class="semantic">
              {group.map((token) => (
                <div class="semantic-card" key={token.path}>
                  <div class="semantic-name">{token.name}</div>
                  <div class="semantic-conds">
                    {Object.entries(token.conditions ?? {}).map(([label, value]) => (
                      <div class="semantic-cond" key={label}>
                        <span class="label">{label}</span>
                        <span class="cv">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ))}
    </>
  )
}
