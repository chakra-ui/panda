const tokens = {
  "fonts.heading": {
    "value": "-apple-system, BlinkMacSystemFont",
    "variable": "var(--pd-fonts-heading)"
  },
  "fonts.body": {
    "value": "Helvetica, Arial, sans-serif",
    "variable": "var(--pd-fonts-body)"
  },
  "fonts.mono": {
    "value": "SFMono-Regular, Menlo, Monaco",
    "variable": "var(--pd-fonts-mono)"
  },
  "colors.current": {
    "value": "currentColor",
    "variable": "var(--pd-colors-current)"
  },
  "colors.gray.50": {
    "value": "#FAFAFA",
    "variable": "var(--pd-colors-gray\\.50)"
  },
  "colors.gray.100": {
    "value": "#F5F5F5",
    "variable": "var(--pd-colors-gray\\.100)"
  },
  "colors.gray.200": {
    "value": "#E5E5E5",
    "variable": "var(--pd-colors-gray\\.200)"
  },
  "colors.gray.300": {
    "value": "#D4D4D4",
    "variable": "var(--pd-colors-gray\\.300)"
  },
  "colors.gray.400": {
    "value": "#A3A3A3",
    "variable": "var(--pd-colors-gray\\.400)"
  },
  "colors.gray.500": {
    "value": "#737373",
    "variable": "var(--pd-colors-gray\\.500)"
  },
  "colors.gray.600": {
    "value": "#525252",
    "variable": "var(--pd-colors-gray\\.600)"
  },
  "colors.gray.700": {
    "value": "#333333",
    "variable": "var(--pd-colors-gray\\.700)"
  },
  "colors.gray.800": {
    "value": "#121212",
    "variable": "var(--pd-colors-gray\\.800)"
  },
  "colors.gray.900": {
    "value": "#0A0A0A",
    "variable": "var(--pd-colors-gray\\.900)"
  },
  "colors.green.50": {
    "value": "#F0FFF4",
    "variable": "var(--pd-colors-green\\.50)"
  },
  "colors.green.100": {
    "value": "#C6F6D5",
    "variable": "var(--pd-colors-green\\.100)"
  },
  "colors.green.200": {
    "value": "#9AE6B4",
    "variable": "var(--pd-colors-green\\.200)"
  },
  "colors.green.300": {
    "value": "#68D391",
    "variable": "var(--pd-colors-green\\.300)"
  },
  "colors.green.400": {
    "value": "#48BB78",
    "variable": "var(--pd-colors-green\\.400)"
  },
  "colors.green.500": {
    "value": "#38A169",
    "variable": "var(--pd-colors-green\\.500)"
  },
  "colors.green.600": {
    "value": "#2F855A",
    "variable": "var(--pd-colors-green\\.600)"
  },
  "colors.green.700": {
    "value": "#276749",
    "variable": "var(--pd-colors-green\\.700)"
  },
  "colors.green.800": {
    "value": "#22543D",
    "variable": "var(--pd-colors-green\\.800)"
  },
  "colors.green.900": {
    "value": "#1C4532",
    "variable": "var(--pd-colors-green\\.900)"
  },
  "colors.red.50": {
    "value": "#FEF2F2",
    "variable": "var(--pd-colors-red\\.50)"
  },
  "colors.red.100": {
    "value": "#FEE2E2",
    "variable": "var(--pd-colors-red\\.100)"
  },
  "colors.red.200": {
    "value": "#FECACA",
    "variable": "var(--pd-colors-red\\.200)"
  },
  "colors.red.300": {
    "value": "#FCA5A5",
    "variable": "var(--pd-colors-red\\.300)"
  },
  "colors.red.400": {
    "value": "#F87171",
    "variable": "var(--pd-colors-red\\.400)"
  },
  "colors.red.500": {
    "value": "#EF4444",
    "variable": "var(--pd-colors-red\\.500)"
  },
  "colors.red.600": {
    "value": "#DC2626",
    "variable": "var(--pd-colors-red\\.600)"
  },
  "colors.red.700": {
    "value": "#B91C1C",
    "variable": "var(--pd-colors-red\\.700)"
  },
  "colors.red.800": {
    "value": "#991B1B",
    "variable": "var(--pd-colors-red\\.800)"
  },
  "colors.red.900": {
    "value": "#7F1D1D",
    "variable": "var(--pd-colors-red\\.900)"
  },
  "fontSizes.sm": {
    "value": "0.5rem",
    "variable": "var(--pd-font-sizes-sm)"
  },
  "fontSizes.xs": {
    "value": "0.75rem",
    "variable": "var(--pd-font-sizes-xs)"
  },
  "fontSizes.md": {
    "value": "0.875rem",
    "variable": "var(--pd-font-sizes-md)"
  },
  "fontSizes.lg": {
    "value": "1.125rem",
    "variable": "var(--pd-font-sizes-lg)"
  },
  "fontSizes.xl": {
    "value": "1.25rem",
    "variable": "var(--pd-font-sizes-xl)"
  },
  "lineHeights.normal": {
    "value": "normal",
    "variable": "var(--pd-line-heights-normal)"
  },
  "lineHeights.none": {
    "value": "1",
    "variable": "var(--pd-line-heights-none)"
  },
  "lineHeights.shorter": {
    "value": "1.25",
    "variable": "var(--pd-line-heights-shorter)"
  },
  "lineHeights.short": {
    "value": "1.375",
    "variable": "var(--pd-line-heights-short)"
  },
  "lineHeights.base": {
    "value": "1.5",
    "variable": "var(--pd-line-heights-base)"
  },
  "lineHeights.tall": {
    "value": "1.625",
    "variable": "var(--pd-line-heights-tall)"
  },
  "lineHeights.taller": {
    "value": "2",
    "variable": "var(--pd-line-heights-taller)"
  },
  "fontWeights.normal": {
    "value": "400",
    "variable": "var(--pd-font-weights-normal)"
  },
  "fontWeights.medium": {
    "value": "500",
    "variable": "var(--pd-font-weights-medium)"
  },
  "fontWeights.semibold": {
    "value": "600",
    "variable": "var(--pd-font-weights-semibold)"
  },
  "fontWeights.bold": {
    "value": "700",
    "variable": "var(--pd-font-weights-bold)"
  },
  "letterSpacings.tighter": {
    "value": "-0.05em",
    "variable": "var(--pd-letter-spacings-tighter)"
  },
  "letterSpacings.tight": {
    "value": "-0.025em",
    "variable": "var(--pd-letter-spacings-tight)"
  },
  "letterSpacings.normal": {
    "value": "0",
    "variable": "var(--pd-letter-spacings-normal)"
  },
  "letterSpacings.wide": {
    "value": "0.025em",
    "variable": "var(--pd-letter-spacings-wide)"
  },
  "letterSpacings.wider": {
    "value": "0.05em",
    "variable": "var(--pd-letter-spacings-wider)"
  },
  "letterSpacings.widest": {
    "value": "0.1em",
    "variable": "var(--pd-letter-spacings-widest)"
  },
  "radii.none": {
    "value": "0",
    "variable": "var(--pd-radii-none)"
  },
  "radii.sm": {
    "value": "0.125rem",
    "variable": "var(--pd-radii-sm)"
  },
  "radii.base": {
    "value": "0.25rem",
    "variable": "var(--pd-radii-base)"
  },
  "radii.md": {
    "value": "0.375rem",
    "variable": "var(--pd-radii-md)"
  },
  "radii.lg": {
    "value": "0.5rem",
    "variable": "var(--pd-radii-lg)"
  },
  "radii.xl": {
    "value": "0.75rem",
    "variable": "var(--pd-radii-xl)"
  },
  "radii.2xl": {
    "value": "1rem",
    "variable": "var(--pd-radii-2xl)"
  },
  "radii.3xl": {
    "value": "1.5rem",
    "variable": "var(--pd-radii-3xl)"
  },
  "radii.full": {
    "value": "9999px",
    "variable": "var(--pd-radii-full)"
  },
  "shadows.xs": {
    "value": "0 0 0 1px rgba(0, 0, 0, 0.05)",
    "variable": "var(--pd-shadows-xs)"
  },
  "shadows.sm": {
    "value": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "variable": "var(--pd-shadows-sm)"
  },
  "shadows.base": {
    "value": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "variable": "var(--pd-shadows-base)"
  },
  "shadows.md": {
    "value": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "variable": "var(--pd-shadows-md)"
  },
  "dropShadows.sm": {
    "value": "drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))",
    "variable": "var(--pd-drop-shadows-sm)"
  },
  "dropShadows.md": {
    "value": "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))",
    "variable": "var(--pd-drop-shadows-md)"
  },
  "spacing.1": {
    "value": "0.25rem",
    "variable": "var(--pd-spacing-1)"
  },
  "spacing.-1": {
    "value": "-0.25rem",
    "variable": "calc(var(--pd-spacing-1) * -1)"
  },
  "spacing.2": {
    "value": "0.5rem",
    "variable": "var(--pd-spacing-2)"
  },
  "spacing.-2": {
    "value": "-0.5rem",
    "variable": "calc(var(--pd-spacing-2) * -1)"
  },
  "spacing.3": {
    "value": "0.75rem",
    "variable": "var(--pd-spacing-3)"
  },
  "spacing.-3": {
    "value": "-0.75rem",
    "variable": "calc(var(--pd-spacing-3) * -1)"
  },
  "spacing.4": {
    "value": "1rem",
    "variable": "var(--pd-spacing-4)"
  },
  "spacing.-4": {
    "value": "-1rem",
    "variable": "calc(var(--pd-spacing-4) * -1)"
  },
  "spacing.5": {
    "value": "1.25rem",
    "variable": "var(--pd-spacing-5)"
  },
  "spacing.-5": {
    "value": "-1.25rem",
    "variable": "calc(var(--pd-spacing-5) * -1)"
  },
  "spacing.6": {
    "value": "1.5rem",
    "variable": "var(--pd-spacing-6)"
  },
  "spacing.-6": {
    "value": "-1.5rem",
    "variable": "calc(var(--pd-spacing-6) * -1)"
  },
  "spacing.0.5": {
    "value": "0.125rem",
    "variable": "var(--pd-spacing-0\\.5)"
  },
  "spacing.-0.5": {
    "value": "-0.125rem",
    "variable": "calc(var(--pd-spacing-0\\.5) * -1)"
  },
  "spacing.1.5": {
    "value": "0.375rem",
    "variable": "var(--pd-spacing-1\\.5)"
  },
  "spacing.-1.5": {
    "value": "-0.375rem",
    "variable": "calc(var(--pd-spacing-1\\.5) * -1)"
  },
  "spacing.2.5": {
    "value": "0.625rem",
    "variable": "var(--pd-spacing-2\\.5)"
  },
  "spacing.-2.5": {
    "value": "-0.625rem",
    "variable": "calc(var(--pd-spacing-2\\.5) * -1)"
  },
  "spacing.3.5": {
    "value": "0.875rem",
    "variable": "var(--pd-spacing-3\\.5)"
  },
  "spacing.-3.5": {
    "value": "-0.875rem",
    "variable": "calc(var(--pd-spacing-3\\.5) * -1)"
  },
  "sizes.1": {
    "value": "0.25rem",
    "variable": "var(--pd-sizes-1)"
  },
  "sizes.2": {
    "value": "0.5rem",
    "variable": "var(--pd-sizes-2)"
  },
  "sizes.3": {
    "value": "0.75rem",
    "variable": "var(--pd-sizes-3)"
  },
  "sizes.4": {
    "value": "1rem",
    "variable": "var(--pd-sizes-4)"
  },
  "sizes.5": {
    "value": "1.25rem",
    "variable": "var(--pd-sizes-5)"
  },
  "sizes.6": {
    "value": "1.5rem",
    "variable": "var(--pd-sizes-6)"
  },
  "sizes.0.5": {
    "value": "0.125rem",
    "variable": "var(--pd-sizes-0\\.5)"
  },
  "sizes.1.5": {
    "value": "0.375rem",
    "variable": "var(--pd-sizes-1\\.5)"
  },
  "sizes.2.5": {
    "value": "0.625rem",
    "variable": "var(--pd-sizes-2\\.5)"
  },
  "sizes.3.5": {
    "value": "0.875rem",
    "variable": "var(--pd-sizes-3\\.5)"
  },
  "largeSizes.xs": {
    "value": "20rem",
    "variable": "var(--pd-large-sizes-xs)"
  },
  "largeSizes.sm": {
    "value": "24rem",
    "variable": "var(--pd-large-sizes-sm)"
  },
  "largeSizes.md": {
    "value": "28rem",
    "variable": "var(--pd-large-sizes-md)"
  },
  "largeSizes.lg": {
    "value": "32rem",
    "variable": "var(--pd-large-sizes-lg)"
  },
  "largeSizes.xl": {
    "value": "36rem",
    "variable": "var(--pd-large-sizes-xl)"
  },
  "animations.none": {
    "value": "none",
    "variable": "var(--pd-animations-none)"
  },
  "animations.spin": {
    "value": "spin 1s linear infinite",
    "variable": "var(--pd-animations-spin)"
  },
  "animations.ping": {
    "value": "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
    "variable": "var(--pd-animations-ping)"
  },
  "animations.pulse": {
    "value": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    "variable": "var(--pd-animations-pulse)"
  },
  "animations.bounce": {
    "value": "bounce 1s infinite",
    "variable": "var(--pd-animations-bounce)"
  },
  "opacity.0": {
    "value": "0",
    "variable": "var(--pd-opacity-0)"
  },
  "opacity.25": {
    "value": "0.25",
    "variable": "var(--pd-opacity-25)"
  },
  "opacity.50": {
    "value": "0.5",
    "variable": "var(--pd-opacity-50)"
  },
  "opacity.75": {
    "value": "0.75",
    "variable": "var(--pd-opacity-75)"
  },
  "opacity.100": {
    "value": "1",
    "variable": "var(--pd-opacity-100)"
  },
  "easings.ease-in": {
    "value": "cubic-bezier(0.4, 0, 1, 1)",
    "variable": "var(--pd-easings-ease-in)"
  },
  "easings.ease-out": {
    "value": "cubic-bezier(0, 0, 0.2, 1)",
    "variable": "var(--pd-easings-ease-out)"
  },
  "easings.ease-in-out": {
    "value": "cubic-bezier(0.4, 0, 0.2, 1)",
    "variable": "var(--pd-easings-ease-in-out)"
  },
  "durations.75": {
    "value": "75ms",
    "variable": "var(--pd-durations-75)"
  },
  "durations.100": {
    "value": "100ms",
    "variable": "var(--pd-durations-100)"
  },
  "durations.150": {
    "value": "150ms",
    "variable": "var(--pd-durations-150)"
  },
  "transitionProperties.all": {
    "value": "all",
    "variable": "var(--pd-transition-properties-all)"
  },
  "transitionProperties.none": {
    "value": "none",
    "variable": "var(--pd-transition-properties-none)"
  },
  "transitionProperties.opacity": {
    "value": "opacity",
    "variable": "var(--pd-transition-properties-opacity)"
  },
  "transitionProperties.shadow": {
    "value": "box-shadow",
    "variable": "var(--pd-transition-properties-shadow)"
  },
  "transitionProperties.transform": {
    "value": "transform",
    "variable": "var(--pd-transition-properties-transform)"
  },
  "transitionProperties.base": {
    "value": "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter",
    "variable": "var(--pd-transition-properties-base)"
  },
  "transitionProperties.background": {
    "value": "background, background-color",
    "variable": "var(--pd-transition-properties-background)"
  },
  "transitionProperties.colors": {
    "value": "color, background-color, border-color, text-decoration-color, fill, stroke",
    "variable": "var(--pd-transition-properties-colors)"
  },
  "colors.primary": {
    "value": "var(--pd-colors-primary)",
    "variable": "var(--pd-colors-primary)"
  },
  "colors.secondary": {
    "value": "var(--pd-colors-secondary)",
    "variable": "var(--pd-colors-secondary)"
  },
  "spacing.gutter": {
    "value": "var(--pd-spacing-gutter)",
    "variable": "var(--pd-spacing-gutter)"
  },
  "spacing.-gutter": {
    "value": "calc(var(--pd-spacing-gutter) * -1)",
    "variable": "calc(var(--pd-spacing-gutter) * -1)"
  }
}

function getToken(path) {
  const { value } = tokens[path] || {}
  return value
}

function getTokenVar(path) {
  const { variable } = tokens[path] || {}
  return variable
}