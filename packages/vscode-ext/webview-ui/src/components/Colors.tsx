import type { Colors as ColorsType } from '../types';

type ColorsProps = {
  colors: ColorsType;
};

export function Colors(props: ColorsProps) {
  const { colors } = props;

  const renderShades = (shadesOrValue: ColorsType[keyof ColorsType]) => {
    if (typeof shadesOrValue === 'string') {
      return (
        <div className="shade">
          <div className="color-box" style={{ background: shadesOrValue }} />
          <div className="shade-value">{shadesOrValue}</div>
        </div>
      );
    }
    return Object.entries(shadesOrValue).map(([shade, value]) => (
      <div className="shade">
        <div className="color-box" style={{ background: value }} />
        <div className="shade-label">{shade}</div>
        <div className="shade-value">{value}</div>
      </div>
    ));
  };

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
  );
}
