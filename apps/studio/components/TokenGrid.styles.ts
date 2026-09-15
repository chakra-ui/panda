import { css } from "styled-system/css";

export const contents = css({ display: "contents" });
export const empty = css({ color: "faint", fontSize: "14px", py: "12" });
export const groupHead = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "muted",
  mt: "6",
  mb: "3",
  _first: { mt: "0" },
});
export const groupCount = css({ fontFamily: "mono", fontSize: "11px", color: "faint" });
export const swatches = css({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: "3",
});
export const chip = css({
  display: "flex",
  overflow: "hidden",
  h: "68px",
  rounded: "lg",
  borderWidth: "1px",
  borderColor: "line",
  backgroundImage:
    "linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%)",
  backgroundSize: "14px 14px",
  backgroundPosition: "0 0, 0 7px, 7px -7px, -7px 0",
  _dark: {
    backgroundImage:
      "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
  },
});
export const chipBand = css({
  flex: "1",
  minW: "0",
  h: "full",
  "&:not(:first-child)": { borderLeftWidth: "1px", borderColor: "line" },
});
export const meta = css({ mt: "2", display: "flex", flexDir: "column", gap: "0.5" });
export const name = css({
  fontFamily: "mono",
  fontSize: "12.5px",
  color: "ink",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
export const copied = css({ color: "success" });
export const rows = css({ display: "flex", flexDir: "column", gap: "1" });
export const rowName = css({ fontFamily: "mono", fontSize: "13px", color: "ink" });
export const rowVal = css({
  fontFamily: "mono",
  fontSize: "12px",
  color: "faint",
  textAlign: "right",
  whiteSpace: "nowrap",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  gridColumn: { base: "2", sm: "auto" },
  gridRow: { base: "1", sm: "auto" },
});
export const track = css({
  display: "flex",
  minW: "0",
  alignItems: "center",
  gridColumn: { base: "1 / -1", sm: "auto" },
  gridRow: { base: "2", sm: "auto" },
  mt: { base: "2", sm: "0" },
});
export const lane = css({
  display: "flex",
  alignItems: "center",
  w: "full",
  h: "22px",
  px: "2px",
  rounded: "sm",
  bg: "line",
});
export const bar = css({ h: "16px", rounded: "2px", bg: "ink", minW: "2px" });
export const radiusBox = css({
  w: "56px",
  h: "56px",
  bg: "subtle",
  borderWidth: "1px",
  borderColor: "lineStrong",
});
export const specimen = css({
  color: "ink",
  lineHeight: "1.1",
  w: "full",
  minW: "0",
  overflow: "hidden",
  whiteSpace: "nowrap",
  maskImage: "linear-gradient(to right, #000 calc(100% - 32px), transparent)",
  WebkitMaskImage: "linear-gradient(to right, #000 calc(100% - 32px), transparent)",
});
export const lineHeightSpecimen = css({
  color: "ink",
  fontSize: "15px",
  maxW: "440px",
  py: "2",
});
export const boxDemo = css({
  w: "110px",
  h: "64px",
  rounded: "md",
  bg: "paper",
  display: "grid",
  placeItems: "center",
  fontSize: "11px",
  color: "faint",
  fontFamily: "mono",
});
export const motionChip = css({ w: "40px", h: "40px", rounded: "md", bg: "ink" });
export const ratioBox = css({
  h: "52px",
  maxW: "280px",
  bg: "subtle",
  borderWidth: "1px",
  borderColor: "lineStrong",
  rounded: "sm",
});
export const blurTile = css({
  w: "128px",
  h: "48px",
  rounded: "sm",
  backgroundImage: "repeating-linear-gradient(45deg, #64748b 0 9px, #cbd5e1 9px 18px)",
});
export const boxDemoLight = css({ bg: "#ffffff", color: "#52525b", borderColor: "transparent" });

export const layers = css({ display: "flex", flexDir: "column", pt: "2", pb: "10", pl: "1" });
export const layer = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  w: "min(420px, 100%)",
  px: "4",
  py: "3",
  rounded: "lg",
  bg: "paper",
  borderWidth: "1px",
  borderColor: "line",
  cursor: "pointer",
  transition: "transform 0.12s",
  "&:not(:first-child)": { mt: "-6px" },
  _hover: { transform: "translateX(4px)" },
});
export const layerName = css({ fontFamily: "mono", fontSize: "13px", color: "ink" });
export const layerVal = css({ fontFamily: "mono", fontSize: "12px", color: "faint" });

export const screens = css({ display: "flex", flexDir: "column", gap: "2", maxW: "760px" });
export const screen = css({
  display: "grid",
  gridTemplateColumns: "56px minmax(0,1fr) 72px",
  alignItems: "center",
  gap: "3",
  px: "2",
  py: "2",
  rounded: "md",
  cursor: "pointer",
  _hover: { bg: "subtle" },
});
export const screenName = css({ fontFamily: "mono", fontSize: "13px", color: "ink" });
export const screenLane = css({
  h: "18px",
  bg: "subtle",
  rounded: "sm",
  borderWidth: "1px",
  borderColor: "line",
  overflow: "hidden",
});
export const screenBar = css({ display: "block", h: "full", bg: "ink", rounded: "sm", minW: "3px" });
export const screenVal = css({
  fontFamily: "mono",
  fontSize: "12px",
  color: "faint",
  textAlign: "right",
});
export const fontList = css({ display: "grid", gap: "3" });
export const fontHead = css({
  display: "grid",
  gap: "1",
  minW: "0",
});
export const fontName = css({ fontFamily: "mono", fontSize: "13px", color: "ink" });
export const fontStack = css({
  fontSize: "12px",
  color: "faint",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});
export const fontSpecimen = css({
  color: "ink",
  fontSize: { base: "24px", sm: "30px" },
  lineHeight: "1.2",
});
export const fontScale = css({
  display: "grid",
  gap: "0.5",
  color: "muted",
  fontSize: { base: "12px", sm: "14px" },
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});
export const chipConditions = css({
  display: "flex",
  gap: "2",
  mt: "1.5",
  fontFamily: "mono",
  fontSize: "10px",
  color: "faint",
  "& > span": { flex: "1", minW: "0", overflow: "hidden", textOverflow: "ellipsis" },
});
export const swatchCell = css({
  position: "relative",
  "&:hover [data-part='trigger'][data-scope='popover']": { opacity: "1" },
});
export const infoTrigger = css({
  position: "absolute",
  top: "1.5",
  right: "1.5",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  w: "22px",
  h: "22px",
  rounded: "full",
  borderWidth: "0",
  bg: "paper",
  color: "muted",
  opacity: "0",
  cursor: "pointer",
  transition: "opacity 0.12s, color 0.12s",
  boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
  _hover: { color: "ink" },
  _focusVisible: { opacity: "1", outline: "2px solid", outlineColor: "ink", outlineOffset: "1px" },
});
export const info = css({
  minW: "240px",
  maxW: "320px",
  p: "3",
  bg: "paper",
  borderWidth: "1px",
  borderColor: "line",
  rounded: "lg",
  boxShadow: "0 12px 34px -10px rgba(0,0,0,0.32)",
  zIndex: "40",
  _focusVisible: { outline: "none" },
});
export const infoName = css({ fontFamily: "mono", fontSize: "12.5px", color: "ink", mb: "2" });
export const infoList = css({ display: "grid", gap: "1.5" });
export const infoTerm = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontFamily: "mono",
  fontSize: "11px",
  color: "muted",
});
export const infoSwatch = css({
  w: "12px",
  h: "12px",
  rounded: "sm",
  borderWidth: "1px",
  borderColor: "line",
  flexShrink: 0,
});
export const infoValue = css({
  fontFamily: "mono",
  fontSize: "11.5px",
  color: "ink",
  mb: "1",
  wordBreak: "break-all",
});
export const infoTriggerOpen = css({ opacity: "1", color: "ink" });
