export function LayoutGrid(props) {
    const { count = 12, margin, gutter = '24px', maxWidth } = props
    const hasMaxWidth = maxWidth != null;
    return (
      <div
        style={{
          display: 'grid',
          gap: gutter,
          gridTemplateColumns: `repeat(${count}, 1fr)`,
          height: '100%',
          width: '100%',
          position: 'absolute',
          inset: '0',
          pointerEvents: 'none',
          maxWidth: hasMaxWidth ? maxWidth : 'initial',
          marginInline: hasMaxWidth ? 'auto' : undefined,
          paddingInline: !hasMaxWidth ? margin : undefined,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            style={{
              display: 'flex',
              background: 'rgba(255, 0, 0, 0.1)',
              height: '100%',
            }}
          />
        ))}
      </div>
    );
  }