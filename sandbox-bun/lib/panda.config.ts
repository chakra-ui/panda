export default {
  include: ['src/**/*.ts'],
  exclude: [],
  outdir: 'styled-system',
  theme: {
    tokens: {
      colors: {
        brand: { value: '#2563eb' },
        ink: { value: '#111827' },
        muted: { value: '#6b7280' },
        surface: { value: '#ffffff' },
      },
    },
  },
  utilities: {
    display: { className: 'd' },
    flexDirection: { className: 'flex' },
    alignItems: { className: 'items' },
    gap: { className: 'gap' },
    padding: { className: 'p' },
    borderRadius: { className: 'rounded' },
    fontSize: { className: 'fs' },
    fontWeight: { className: 'font' },
    backgroundColor: { className: 'bg', values: 'colors' },
    color: { className: 'text', values: 'colors' },
  },
}
