type ColorsProps = {
  colors: Map<string, any>
}

export function Colors(props: ColorsProps) {
  const { colors } = props

  const renderColors = (colors: ColorsProps['colors']) => {
    const values = Array.from(colors.values()).filter((color) => !color.isConditional && !color.extensions.isVirtual)

    return values?.map((color, i) => {
      return (
        <div className="shade" key={i}>
          <div className="color-box" style={{ background: color.value }} />
          <div className="shade-value">{color.value}</div>
          <div className="shade-value">{color.extensions.prop}</div>
          <div className="shade-value">{color.extensions.varRef}</div>
        </div>
      )
    })
  }

  return (
    <div className="token-group">
      <div className="token-content">
        <div className="color-wrapper">
          <div className="shades">{renderColors(colors)}</div>
        </div>
      </div>
    </div>
  )
}
