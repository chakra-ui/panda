/* eslint-disable */
export type Token = "colors.neutral.50" | "colors.neutral.100" | "colors.neutral.200" | "colors.neutral.300" | "colors.neutral.400" | "colors.neutral.500" | "colors.neutral.600" | "colors.neutral.700" | "colors.neutral.800" | "colors.neutral.900" | "colors.neutral.950" | "assets.check" | "shadows.inset" | "colors.text" | "colors.bg" | "colors.card" | "colors.border" | "colors.accent" | "colors.colorPalette.50" | "colors.colorPalette.100" | "colors.colorPalette.200" | "colors.colorPalette.300" | "colors.colorPalette.400" | "colors.colorPalette.500" | "colors.colorPalette.600" | "colors.colorPalette.700" | "colors.colorPalette.800" | "colors.colorPalette.900" | "colors.colorPalette.950" | "colors.colorPalette"

export type ColorPalette = "neutral" | "text" | "bg" | "card" | "border" | "accent"

export type ColorToken = "neutral.50" | "neutral.100" | "neutral.200" | "neutral.300" | "neutral.400" | "neutral.500" | "neutral.600" | "neutral.700" | "neutral.800" | "neutral.900" | "neutral.950" | "text" | "bg" | "card" | "border" | "accent" | "colorPalette.50" | "colorPalette.100" | "colorPalette.200" | "colorPalette.300" | "colorPalette.400" | "colorPalette.500" | "colorPalette.600" | "colorPalette.700" | "colorPalette.800" | "colorPalette.900" | "colorPalette.950" | "colorPalette"

export type AssetToken = "check"

export type ShadowToken = "inset"

export type Tokens = {
		colors: ColorToken
		assets: AssetToken
		shadows: ShadowToken
} & { [token: string]: never }

export type TokenCategory = "aspectRatios" | "zIndex" | "opacity" | "colors" | "fonts" | "fontSizes" | "fontWeights" | "lineHeights" | "letterSpacings" | "sizes" | "shadows" | "spacing" | "radii" | "borders" | "borderWidths" | "durations" | "easings" | "animations" | "blurs" | "gradients" | "breakpoints" | "assets"