import { css } from "styled-system/css";

export const wrap = css({
  maxW: "1180px",
  mx: "auto",
  px: { base: "5", md: "8" },
  py: { base: "6", md: "8" },
});
export const back = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  fontSize: "13px",
  color: "muted",
  mb: "5",
  _hover: { color: "ink" },
});
export const head = css({ mb: "6" });
export const title = css({
  fontFamily: "display",
  fontSize: "26px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
});
export const lede = css({
  fontSize: "14px",
  color: "muted",
  mt: "1.5",
  maxW: "620px",
  lineHeight: "1.6",
});
export const note = css({
  mt: "4",
  px: "3.5",
  py: "2.5",
  rounded: "md",
  bg: "subtle",
  borderWidth: "1px",
  borderColor: "line",
  fontSize: "12.5px",
  color: "muted",
  lineHeight: "1.5",
});
export const dropzone = css({
  mt: "6",
  p: "10",
  rounded: "xl",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "lineStrong",
  bg: "subtle",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  gap: "4",
  cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
  "&[data-dragging]": { borderColor: "ink", bg: "canvas" },
});
export const dropHint = css({ fontSize: "14px", color: "muted" });
export const analyzing = css({
  mt: "6",
  py: "16",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  gap: "4",
  color: "muted",
  fontSize: "14px",
});
export const spinner = css({
  w: "26px",
  h: "26px",
  rounded: "full",
  borderWidth: "2.5px",
  borderColor: "lineStrong",
  borderTopColor: "ink",
  animation: "spin 0.7s linear infinite",
});

export const toolbar = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  flexWrap: "wrap",
  mt: "6",
  mb: "5",
});
export const scanned = css({
  fontSize: "13px",
  color: "muted",
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
});
export const toolbarActions = css({ display: "flex", alignItems: "center", gap: "2.5" });
export const scopeNote = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  fontSize: "13px",
  color: "muted",
  mb: "5",
});
export const scopeClear = css({ color: "ink", textDecoration: "underline", _hover: { color: "muted" } });
export const badge = css({
  fontFamily: "mono",
  fontSize: "10.5px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  px: "2",
  py: "1",
  rounded: "sm",
  bg: "subtle",
  color: "muted",
  borderWidth: "1px",
  borderColor: "line",
  '&[data-precise="true"]': { bg: "ink", color: "paper", borderColor: "ink" },
});

export const cards = css({
  display: "grid",
  gridTemplateColumns: { base: "1fr", md: "repeat(2, 1fr)" },
  gap: "3",
});
export const card = css({
  p: "4",
  rounded: "lg",
  borderWidth: "1px",
  borderColor: "line",
  bg: "paper",
  display: "flex",
  flexDir: "column",
  gap: "2.5",
});
export const cardHead = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
});
export const cType = css({ fontFamily: "display", fontSize: "15px", fontWeight: "600" });
export const cPct = css({
  fontFamily: "mono",
  fontSize: "12px",
  color: "muted",
  whiteSpace: "nowrap",
});
export const track = css({ h: "6px", rounded: "full", bg: "subtle", overflow: "hidden" });
export const fill = css({
  h: "full",
  rounded: "full",
  bg: "ink",
  minW: "2px",
  transition: "width 0.3s ease",
});
export const hot = css({ display: "flex", flexWrap: "wrap", gap: "1.5" });
export const hotTok = css({
  fontFamily: "mono",
  fontSize: "11.5px",
  px: "2",
  py: "1",
  rounded: "sm",
  bg: "subtle",
  color: "ink",
  "& b": { color: "muted", fontWeight: "500" },
});
export const unused = css({
  fontSize: "12px",
  color: "faint",
  fontFamily: "mono",
  lineHeight: "1.5",
});
export const unusedLabel = css({ color: "muted", fontFamily: "body", fontWeight: "500" });
export const diag = css({
  px: "4",
  py: "3",
  mb: "4",
  rounded: "md",
  bg: "rgba(233,172,60,0.10)",
  borderWidth: "1px",
  borderColor: "rgba(233,172,60,0.3)",
  color: "muted",
  fontSize: "13px",
  lineHeight: "1.55",
  "& code": { fontFamily: "mono", fontSize: "12px", color: "ink" },
  "& strong": { color: "ink", fontWeight: "600" },
});
export const hint = css({
  mb: "4",
  fontSize: "12.5px",
  color: "faint",
  "& code": { fontFamily: "mono", fontSize: "11.5px", color: "muted" },
});
