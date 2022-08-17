import type { Config } from '@css-panda/types'

export type Colors = NonNullable<Config['tokens']>['colors']

type ColorsProps = {
  colors: Colors
}

export function Colors(props: ColorsProps) {
  const { colors } = props

  const renderShades = (shadesOrValue: Colors) => {
    if (typeof shadesOrValue === 'string') {
      return (
        <div className="shade">
          <div className="color-box" style={{ background: shadesOrValue }} />
          <div className="shade-value">{shadesOrValue}</div>
        </div>
      )
    }
    return Object.entries(shadesOrValue).map(([shade, value]) => (
      <div className="shade">
        <div className="color-box" style={{ background: value as string }} />
        <div className="shade-label">{shade}</div>
        <div className="shade-value">{value}</div>
      </div>
    ))
  }

  return (
    <div className="token-group">
      <div className="token-content">
        {Object.entries(colors).map(([color, shadesOrValue]) => (
          <div className="color-wrapper">
            <span className="title">{color}</span>
            <div className="shades">{renderShades(shadesOrValue)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
