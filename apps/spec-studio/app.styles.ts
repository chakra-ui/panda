import { css } from "styled-system/css";

export const shell = css({ minH: "100vh", bg: "canvas" });
export const header = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  maxW: "1180px",
  mx: "auto",
  px: { base: "5", md: "8" },
  h: "60px",
});
export const brand = css({ display: "flex", alignItems: "center", gap: "2.5" });
export const brandBadge = css({
  display: "grid",
  placeItems: "center",
  w: "28px",
  h: "28px",
  rounded: "8px",
  bg: "ink",
});
export const brandLogo = css({
  w: "16px",
  h: "16px",
  filter: "invert(1)",
  _dark: { filter: "invert(0)" },
});
export const brandName = css({
  fontFamily: "display",
  fontWeight: "600",
  fontSize: "15px",
  letterSpacing: "-0.01em",
});
export const headerRight = css({ display: "flex", alignItems: "center", gap: "4" });
export const headerLink = css({
  fontSize: "13px",
  color: "muted",
  fontFamily: "body",
  transition: "color 0.15s",
  _hover: { color: "ink" },
});
export const themeToggle = css({
  display: "grid",
  placeItems: "center",
  w: "32px",
  h: "32px",
  rounded: "md",
  cursor: "pointer",
  color: "muted",
  bg: "transparent",
  borderWidth: "1px",
  borderColor: "line",
  transition: "color 0.15s, border-color 0.15s, background 0.15s",
  _hover: { color: "ink", borderColor: "lineStrong", bg: "subtle" },
});
export const rule = css({ h: "1px", bg: "line" });
