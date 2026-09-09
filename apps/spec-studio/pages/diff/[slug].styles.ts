import { css } from "styled-system/css";

export const page = css({ maxW: "760px", mx: "auto", px: "5", py: "10" });
export const back = css({ fontFamily: "mono", fontSize: "12px", color: "muted", _hover: { color: "ink" } });
export const title = css({ fontFamily: "display", fontSize: "22px", fontWeight: "700", color: "ink", mt: "4" });
export const sub = css({ fontSize: "13px", color: "muted", mt: "1" });
export const empty = css({ color: "faint", fontSize: "14px", py: "12" });

export const cat = css({ mt: "8", _first: { mt: "6" } });
export const catHead = css({
  fontFamily: "mono",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "muted",
  mb: "3",
});
export const rows = css({ display: "flex", flexDir: "column", gap: "1" });
export const row = css({
  display: "grid",
  gridTemplateColumns: "16px 150px 1fr",
  alignItems: "center",
  gap: "3",
  px: "2",
  py: "1.5",
  rounded: "md",
  fontFamily: "mono",
  fontSize: "12.5px",
});
export const sign = css({ textAlign: "center", fontWeight: "700" });
export const nameCell = css({ color: "ink", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
export const valCell = css({ color: "muted", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" });
export const added = css({ bg: "color-mix(in srgb, #15864a 12%, transparent)" });
export const removed = css({ bg: "color-mix(in srgb, #c0362c 12%, transparent)" });
export const changed = css({ bg: "subtle" });
export const addSign = css({ color: "success" });
export const removeSign = css({ color: "danger" });
export const swatch = css({ display: "inline-block", w: "12px", h: "12px", rounded: "2px", mr: "1", verticalAlign: "middle", borderWidth: "1px", borderColor: "line" });
export const arrow = css({ color: "faint", mx: "1" });
