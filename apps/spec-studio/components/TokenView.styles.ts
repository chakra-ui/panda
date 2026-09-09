import { css } from "styled-system/css";

export const root = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "220px 1fr" },
  maxW: "1180px",
  mx: "auto",
  alignItems: "start",
});

export const rail = css({
  position: { md: "sticky" },
  top: "0",
  alignSelf: "start",
  maxH: { md: "100vh" },
  overflowY: { md: "auto" },
  overflowX: { base: "auto", md: "visible" },
  borderBottomWidth: { base: "1px", md: "0" },
  py: { base: "3", md: "5" },
  px: { base: "4", md: "4" },
  display: "flex",
  flexDir: { base: "row", md: "column" },
  gap: { base: "1", md: "0.5" },
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});

export const railHead = css({
  display: { base: "none", md: "block" },
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "faint",
  px: "3",
  mb: "2",
});

export const tab = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2",
  w: { base: "auto", md: "full" },
  flexShrink: 0,
  whiteSpace: "nowrap",
  textAlign: "left",
  px: "3",
  py: "2",
  rounded: "md",
  cursor: "pointer",
  fontFamily: "body",
  fontSize: "13.5px",
  color: "muted",
  bg: "transparent",
  borderWidth: "0",
  transition: "background 0.12s, color 0.12s",
  _hover: { bg: "subtle", color: "ink" },
  _focusVisible: { outline: "2px solid", outlineColor: "ink", outlineOffset: "-2px" },
  "&[data-selected]": { bg: "ink", color: "paper" },
});

export const count = css({ fontSize: "11px", fontFamily: "mono", opacity: 0.6 });

export const main = css({
  py: { base: "6", md: "8" },
  px: { base: "5", md: "8" },
  minW: "0",
  borderLeftWidth: { md: "1px" },
  minH: { md: "100vh" },
});

export const toolbar = css({
  display: "flex",
  flexDir: { base: "column", md: "row" },
  alignItems: { base: "stretch", md: "flex-start" },
  justifyContent: "space-between",
  gap: { base: "3", md: "4" },
  flexWrap: "wrap",
  mb: "4",
});

export const title = css({
  fontFamily: "display",
  fontSize: "22px",
  fontWeight: "600",
  letterSpacing: "-0.02em",
});

export const subtitle = css({ fontSize: "13px", color: "muted", mt: "0.5" });
export const actions = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  flexWrap: "wrap",
  justifyContent: { base: "flex-start", md: "flex-end" },
});
export const filterbar = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  flexWrap: "wrap",
  mb: "6",
});
export const searchField = css({ flex: "1", minW: "220px" });
export const searchInput = css({ w: "full" });

export const actionGrow = css({ flexGrow: { base: "1", md: "0" } });
export const actionFull = css({ w: { base: "full", md: "auto" } });
export const shareBtn = css({ w: { base: "9", md: "auto" }, px: { base: "0", md: "3" }, justifyContent: "center", flexShrink: "0" });
export const shareText = css({ display: { base: "none", md: "inline" } });
export const btnSpinner = css({
  display: "inline-block",
  w: "14px",
  h: "14px",
  rounded: "full",
  borderWidth: "2px",
  borderColor: "currentColor",
  borderTopColor: "transparent",
  animation: "spin 0.6s linear infinite",
});

export const variants = css({
  display: "flex",
  alignItems: "center",
  gap: "1px",
  p: "1",
  rounded: "md",
  bg: "subtle",
  borderWidth: "1px",
  borderColor: "line",
});
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
