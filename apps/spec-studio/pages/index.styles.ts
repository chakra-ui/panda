import { css } from "styled-system/css";

export const split = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", lg: "1fr 1.05fr" },
  minH: "calc(100vh - 61px)",
});

export const left = css({
  display: "flex",
  flexDir: "column",
  justifyContent: "center",
  gap: "5",
  maxW: "600px",
  w: "full",
  mx: { base: "auto", lg: "0" },
  ml: { lg: "auto" },
  px: { base: "6", md: "10", lg: "14" },
  py: { base: "12", lg: "10" },
});

export const kicker = css({
  fontFamily: "mono",
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "faint",
});
export const h1 = css({
  fontFamily: "display",
  fontSize: { base: "36px", md: "48px" },
  fontWeight: "700",
  letterSpacing: "-0.035em",
  lineHeight: "1.02",
});
export const lede = css({ fontSize: "16px", color: "muted", lineHeight: "1.6", maxW: "460px" });

export const dropzone = css({
  mt: "3",
  px: "6",
  py: "10",
  rounded: "xl",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "lineStrong",
  bg: "subtle",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  gap: "5",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  "&[data-dragging]": { borderColor: "ink", bg: "canvas" },
});
export const dropIcon = css({ color: "faint" });
export const dropHint = css({ fontSize: "14.5px", color: "muted", textAlign: "center" });
export const actions = css({
  display: "flex",
  gap: "2.5",
  flexWrap: "wrap",
  justifyContent: "center",
});

export const pasteRow = css({ display: "flex", alignItems: "center", gap: "3", mt: "1" });
export const rule = css({ flex: "1", h: "1px", bg: "line" });
export const pasteToggle = css({
  fontSize: "12.5px",
  fontFamily: "mono",
  color: "faint",
  bg: "transparent",
  borderWidth: "0",
  cursor: "pointer",
  _hover: { color: "muted" },
});
export const field = css({ display: "flex", flexDir: "column", w: "full", gap: "2" });
export const srOnly = css({
  position: "absolute",
  w: "1px",
  h: "1px",
  p: "0",
  m: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  borderWidth: "0",
});
export const error = css({
  px: "4",
  py: "3",
  rounded: "md",
  bg: "rgba(192,54,44,0.08)",
  color: "danger",
  fontFamily: "body",
  fontSize: "13px",
  lineHeight: "1.5",
});
export const hintMono = css({ fontFamily: "mono", fontSize: "12px", color: "faint", mt: "1" });

export const showcase = css({
  display: { base: "none", lg: "block" },
  position: "relative",
  p: "6",
  overflow: "hidden",
});
export const wall = css({
  display: "grid",
  gridTemplateColumns: "repeat(8, 1fr)",
  h: "full",
  w: "full",
  rounded: "2xl",
  overflow: "hidden",
  borderWidth: "1px",
  borderColor: "line",
  boxShadow: "0 14px 44px -26px rgba(10,10,10,0.16)",
});
export const swatch = css({ minH: "0" });
export const floatCard = css({
  position: "absolute",
  bg: "paper",
  borderWidth: "1px",
  borderColor: "line",
  rounded: "xl",
  boxShadow: "0 8px 22px -16px rgba(10,10,10,0.14)",
  p: "4",
  display: "flex",
  flexDir: "column",
  gap: "1",
});
export const floatType = css({ top: "12%", left: "8%", w: "168px" });
export const floatShadow = css({ bottom: "12%", right: "8%", w: "192px" });
export const cardLabel = css({
  fontFamily: "mono",
  fontSize: "10.5px",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "faint",
});
export const specimen = css({
  fontFamily: "display",
  fontSize: "34px",
  fontWeight: "600",
  letterSpacing: "-0.02em",
  lineHeight: "1",
});
export const specimenSub = css({ fontFamily: "mono", fontSize: "11px", color: "muted" });
export const shadowSwatch = css({
  h: "40px",
  rounded: "md",
  bg: "canvas",
  boxShadow: "0 6px 16px -10px rgba(10,10,10,0.22)",
  mt: "1",
});
export const loadingOverlay = css({
  position: "fixed",
  inset: "0",
  zIndex: "50",
  bg: "rgba(10,10,10,0.55)",
  backdropFilter: "blur(3px)",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "4",
  color: "#ffffff",
  fontFamily: "body",
  fontSize: "14px",
});
export const spinner = css({
  w: "30px",
  h: "30px",
  rounded: "full",
  borderWidth: "3px",
  borderColor: "rgba(255,255,255,0.25)",
  borderTopColor: "#ffffff",
  animation: "spin 0.7s linear infinite",
});
