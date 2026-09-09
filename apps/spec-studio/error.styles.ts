import { css } from "styled-system/css";

export const wrap = css({
  position: "relative",
  minH: "100dvh",
  display: "grid",
  placeItems: "center",
  bg: "canvas",
  px: "6",
  overflow: "hidden",
});

export const glow = css({
  position: "absolute",
  insetInline: "0",
  bottom: "0",
  h: "58%",
  pointerEvents: "none",
  backgroundImage:
    "radial-gradient(ellipse 95% 68% at 50% 118%, rgba(124,108,255,0.42), rgba(56,189,248,0.24) 38%, rgba(52,211,153,0.18) 58%, transparent 76%)",
});

export const content = css({
  position: "relative",
  zIndex: "1",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  textAlign: "center",
  gap: "2",
});

export const code = css({
  fontFamily: "display",
  fontSize: { base: "88px", md: "132px" },
  fontWeight: "700",
  letterSpacing: "-0.04em",
  lineHeight: "1",
  color: "ink",
});

export const message = css({
  fontFamily: "body",
  fontSize: { base: "18px", md: "22px" },
  color: "muted",
  mt: "1",
});

export const detail = css({
  fontFamily: "mono",
  fontSize: "13px",
  color: "faint",
  mt: "1",
  maxW: "90vw",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const button = css({
  mt: "8",
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  fontFamily: "body",
  fontSize: "14px",
  fontWeight: "500",
  color: "ink",
  bg: "canvas",
  px: "5",
  py: "3",
  rounded: "md",
  borderWidth: "1px",
  borderColor: "lineStrong",
  cursor: "pointer",
  transition: "border-color 0.2s, box-shadow 0.2s, transform 0.12s",
  _hover: {
    borderColor: "#34d399",
    boxShadow: "0 0 22px -4px rgba(52,211,153,0.55)",
    transform: "translateY(-1px)",
  },
  _focusVisible: { outline: "2px solid", outlineColor: "ink", outlineOffset: "2px" },
});
