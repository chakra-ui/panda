interface Option {
  name: string
  value: string
}

interface ThemePanelProps {
  colors: Option[]
  activeColor: string
  onColor: (value: string) => void
  fonts: Option[]
  activeFont: string
  onFont: (value: string) => void
  radii: Option[]
  activeRadius: string
  onRadius: (value: string) => void
}

export function ThemePanel(props: ThemePanelProps) {
  const { colors, activeColor, onColor, fonts, activeFont, onFont, radii, activeRadius, onRadius } = props
  return (
    <aside class="pg-theme">
      <div class="pg-theme-head">Theme panel</div>

      <div class="pg-theme-group">
        <div class="pg-theme-label">Color palette</div>
        <div class="pg-swatches">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              title={color.name}
              class={`pg-swatch${color.value === activeColor ? ' pg-on' : ''}`}
              style={{ background: color.value }}
              onClick={() => onColor(color.value)}
            />
          ))}
        </div>
      </div>

      {fonts.length > 0 && (
        <div class="pg-theme-group">
          <div class="pg-theme-label">Font family</div>
          <div class="pg-tiles">
            {fonts.map((font) => (
              <button
                key={font.name}
                type="button"
                class={`pg-tile${font.value === activeFont ? ' pg-on' : ''}`}
                onClick={() => onFont(font.value)}
              >
                <span class="pg-tile-ag" style={{ fontFamily: font.value }}>
                  Ag
                </span>
                <span class="pg-tile-name">{font.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {radii.length > 0 && (
        <div class="pg-theme-group">
          <div class="pg-theme-label">Radius</div>
          <div class="pg-tiles">
            {radii.map((radius) => (
              <button
                key={radius.name}
                type="button"
                class={`pg-tile${radius.value === activeRadius ? ' pg-on' : ''}`}
                onClick={() => onRadius(radius.value)}
              >
                <span class="pg-tile-radius" style={{ borderTopLeftRadius: radius.value }} />
                <span class="pg-tile-name">{radius.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
