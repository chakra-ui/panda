/* eslint-disable */
import type { AnySelector, Selectors } from './selectors';

export interface Conditions {
	/** `&:is(:hover, [data-hover])` */
	"_hover": string
	/** `&:is(:focus, [data-focus])` */
	"_focus": string
	/** `&:focus-within` */
	"_focusWithin": string
	/** `&:is(:focus-visible, [data-focus-visible])` */
	"_focusVisible": string
	/** `&:is(:disabled, [disabled], [data-disabled])` */
	"_disabled": string
	/** `&:is(:active, [data-active])` */
	"_active": string
	/** `&:visited` */
	"_visited": string
	/** `&:target` */
	"_target": string
	/** `&:is(:read-only, [data-read-only])` */
	"_readOnly": string
	/** `&:read-write` */
	"_readWrite": string
	/** `&:is(:empty, [data-empty])` */
	"_empty": string
	/** `&:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"])` */
	"_checked": string
	/** `&:enabled` */
	"_enabled": string
	/** `&:is([aria-expanded=true], [data-expanded], [data-state="expanded"])` */
	"_expanded": string
	/** `&[data-highlighted]` */
	"_highlighted": string
	/** `&::before` */
	"_before": string
	/** `&::after` */
	"_after": string
	/** `&::first-letter` */
	"_firstLetter": string
	/** `&::first-line` */
	"_firstLine": string
	/** `&::marker` */
	"_marker": string
	/** `&::selection` */
	"_selection": string
	/** `&::file-selector-button` */
	"_file": string
	/** `&::backdrop` */
	"_backdrop": string
	/** `&:first-child` */
	"_first": string
	/** `&:last-child` */
	"_last": string
	/** `&:only-child` */
	"_only": string
	/** `&:nth-child(even)` */
	"_even": string
	/** `&:nth-child(odd)` */
	"_odd": string
	/** `&:first-of-type` */
	"_firstOfType": string
	/** `&:last-of-type` */
	"_lastOfType": string
	/** `&:only-of-type` */
	"_onlyOfType": string
	/** `.peer:is(:focus, [data-focus]) ~ &` */
	"_peerFocus": string
	/** `.peer:is(:hover, [data-hover]) ~ &` */
	"_peerHover": string
	/** `.peer:is(:active, [data-active]) ~ &` */
	"_peerActive": string
	/** `.peer:focus-within ~ &` */
	"_peerFocusWithin": string
	/** `.peer:is(:focus-visible, [data-focus-visible]) ~ &` */
	"_peerFocusVisible": string
	/** `.peer:is(:disabled, [disabled], [data-disabled]) ~ &` */
	"_peerDisabled": string
	/** `.peer:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) ~ &` */
	"_peerChecked": string
	/** `.peer:is(:invalid, [data-invalid], [aria-invalid=true]) ~ &` */
	"_peerInvalid": string
	/** `.peer:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) ~ &` */
	"_peerExpanded": string
	/** `.peer:placeholder-shown ~ &` */
	"_peerPlaceholderShown": string
	/** `.group:is(:focus, [data-focus]) &` */
	"_groupFocus": string
	/** `.group:is(:hover, [data-hover]) &` */
	"_groupHover": string
	/** `.group:is(:active, [data-active]) &` */
	"_groupActive": string
	/** `.group:focus-within &` */
	"_groupFocusWithin": string
	/** `.group:is(:focus-visible, [data-focus-visible]) &` */
	"_groupFocusVisible": string
	/** `.group:is(:disabled, [disabled], [data-disabled]) &` */
	"_groupDisabled": string
	/** `.group:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"]) &` */
	"_groupChecked": string
	/** `.group:is([aria-expanded=true], [data-expanded], [data-state="expanded"]) &` */
	"_groupExpanded": string
	/** `.group:invalid &` */
	"_groupInvalid": string
	/** `&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed], [data-state="indeterminate"])` */
	"_indeterminate": string
	/** `&:is(:required, [data-required], [aria-required=true])` */
	"_required": string
	/** `&:is(:valid, [data-valid])` */
	"_valid": string
	/** `&:is(:invalid, [data-invalid])` */
	"_invalid": string
	/** `&:autofill` */
	"_autofill": string
	/** `&:in-range` */
	"_inRange": string
	/** `&:out-of-range` */
	"_outOfRange": string
	/** `&::placeholder, &[data-placeholder]` */
	"_placeholder": string
	/** `&:is(:placeholder-shown, [data-placeholder-shown])` */
	"_placeholderShown": string
	/** `&:is([aria-pressed=true], [data-pressed])` */
	"_pressed": string
	/** `&:is([aria-selected=true], [data-selected])` */
	"_selected": string
	/** `&:default` */
	"_default": string
	/** `&:optional` */
	"_optional": string
	/** `&:is([open], [data-open], [data-state="open"])` */
	"_open": string
	/** `&:is([closed], [data-closed], [data-state="closed"])` */
	"_closed": string
	/** `&:fullscreen` */
	"_fullscreen": string
	/** `&:is([data-loading], [aria-busy=true])` */
	"_loading": string
	/** `&[aria-current=page]` */
	"_currentPage": string
	/** `&[aria-current=step]` */
	"_currentStep": string
	/** `@media (prefers-reduced-motion: reduce)` */
	"_motionReduce": string
	/** `@media (prefers-reduced-motion: no-preference)` */
	"_motionSafe": string
	/** `@media print` */
	"_print": string
	/** `@media (orientation: landscape)` */
	"_landscape": string
	/** `@media (orientation: portrait)` */
	"_portrait": string
	/** ` &.dark, .dark &` */
	"_dark": string
	/** ` &.light, .light &` */
	"_light": string
	/** `@media (prefers-color-scheme: dark)` */
	"_osDark": string
	/** `@media (prefers-color-scheme: light)` */
	"_osLight": string
	/** `@media (forced-colors: active)` */
	"_highContrast": string
	/** `@media (prefers-contrast: less)` */
	"_lessContrast": string
	/** `@media (prefers-contrast: more)` */
	"_moreContrast": string
	/** `[dir=ltr] &` */
	"_ltr": string
	/** `[dir=rtl] &` */
	"_rtl": string
	/** `&::-webkit-scrollbar` */
	"_scrollbar": string
	/** `&::-webkit-scrollbar-thumb` */
	"_scrollbarThumb": string
	/** `&::-webkit-scrollbar-track` */
	"_scrollbarTrack": string
	/** `&[data-orientation=horizontal]` */
	"_horizontal": string
	/** `&[data-orientation=vertical]` */
	"_vertical": string
	/** `@media screen and (min-width: 40rem)` */
	"sm": string
	/** `@media screen and (min-width: 40rem) and (max-width: 47.9975rem)` */
	"smOnly": string
	/** `@media screen and (max-width: 39.9975rem)` */
	"smDown": string
	/** `@media screen and (min-width: 48rem)` */
	"md": string
	/** `@media screen and (min-width: 48rem) and (max-width: 63.9975rem)` */
	"mdOnly": string
	/** `@media screen and (max-width: 47.9975rem)` */
	"mdDown": string
	/** `@media screen and (min-width: 64rem)` */
	"lg": string
	/** `@media screen and (min-width: 64rem) and (max-width: 79.9975rem)` */
	"lgOnly": string
	/** `@media screen and (max-width: 63.9975rem)` */
	"lgDown": string
	/** `@media screen and (min-width: 80rem)` */
	"xl": string
	/** `@media screen and (min-width: 80rem) and (max-width: 95.9975rem)` */
	"xlOnly": string
	/** `@media screen and (max-width: 79.9975rem)` */
	"xlDown": string
	/** `@media screen and (min-width: 96rem)` */
	"2xl": string
	/** `@media screen and (min-width: 96rem)` */
	"2xlOnly": string
	/** `@media screen and (max-width: 95.9975rem)` */
	"2xlDown": string
	/** `@media screen and (min-width: 40rem) and (max-width: 47.9975rem)` */
	"smToMd": string
	/** `@media screen and (min-width: 40rem) and (max-width: 63.9975rem)` */
	"smToLg": string
	/** `@media screen and (min-width: 40rem) and (max-width: 79.9975rem)` */
	"smToXl": string
	/** `@media screen and (min-width: 40rem) and (max-width: 95.9975rem)` */
	"smTo2xl": string
	/** `@media screen and (min-width: 48rem) and (max-width: 63.9975rem)` */
	"mdToLg": string
	/** `@media screen and (min-width: 48rem) and (max-width: 79.9975rem)` */
	"mdToXl": string
	/** `@media screen and (min-width: 48rem) and (max-width: 95.9975rem)` */
	"mdTo2xl": string
	/** `@media screen and (min-width: 64rem) and (max-width: 79.9975rem)` */
	"lgToXl": string
	/** `@media screen and (min-width: 64rem) and (max-width: 95.9975rem)` */
	"lgTo2xl": string
	/** `@media screen and (min-width: 80rem) and (max-width: 95.9975rem)` */
	"xlTo2xl": string
	/** `@container  (min-width: 20rem)` */
	"@/xs": string
	/** `@container  (min-width: 24rem)` */
	"@/sm": string
	/** `@container  (min-width: 28rem)` */
	"@/md": string
	/** `@container  (min-width: 32rem)` */
	"@/lg": string
	/** `@container  (min-width: 36rem)` */
	"@/xl": string
	/** `@container  (min-width: 42rem)` */
	"@/2xl": string
	/** `@container  (min-width: 48rem)` */
	"@/3xl": string
	/** `@container  (min-width: 56rem)` */
	"@/4xl": string
	/** `@container  (min-width: 64rem)` */
	"@/5xl": string
	/** `@container  (min-width: 72rem)` */
	"@/6xl": string
	/** `@container  (min-width: 80rem)` */
	"@/7xl": string
	/** `@container  (min-width: 90rem)` */
	"@/8xl": string
	/** The base (=no conditions) styles to apply  */
	"base": string
}

export type Condition = keyof Conditions

export type Conditional<V> =
  | V
  | Array<V | null>
  | {
      [K in keyof Conditions]?: Conditional<V>
    }

export type ConditionalValue<T> = Conditional<T>

export type Nested<P> = P & {
  [K in Selectors]?: Nested<P>
} & {
  [K in AnySelector]?: Nested<P>
} & {
  [K in keyof Conditions]?: Nested<P>
}
