import { css } from "styled-system/css";

export const empty = css({ color: "faint", fontSize: "14px", py: "12" });

export const scroll = css({ overflowX: "auto", maxW: "full" });

export const table = css({
  borderCollapse: "collapse",
  width: "full",
  fontFamily: "mono",
  fontSize: "12.5px",
});

export const th = css({
  textAlign: "center",
  fontWeight: "600",
  color: "muted",
  px: "3",
  py: "2",
  borderBottomWidth: "1px",
  borderColor: "line",
  whiteSpace: "nowrap",
});
export const thToken = css({
  textAlign: "left",
  fontWeight: "600",
  color: "muted",
  px: "3",
  py: "2",
  borderBottomWidth: "1px",
  borderColor: "line",
  position: "sticky",
  left: "0",
  bg: "paper",
});

export const td = css({
  px: "3",
  py: "2",
  textAlign: "center",
  borderBottomWidth: "1px",
  borderColor: "subtle",
});
export const tdToken = css({
  px: "3",
  py: "2",
  color: "ink",
  whiteSpace: "nowrap",
  borderBottomWidth: "1px",
  borderColor: "subtle",
  position: "sticky",
  left: "0",
  bg: "paper",
});

export const swatch = css({
  display: "inline-block",
  w: "44px",
  h: "24px",
  rounded: "sm",
  borderWidth: "1px",
  borderColor: "line",
  verticalAlign: "middle",
});
