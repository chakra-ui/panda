import { css } from "styled-system/css";

export const loading = css({
  minH: "60vh",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "4",
  color: "muted",
  fontFamily: "body",
  fontSize: "14px",
});

export const loadingLogo = css({ w: "40px", h: "40px", rounded: "lg", opacity: "0.9" });

export const loadingSpinner = css({
  w: "28px",
  h: "28px",
  rounded: "full",
  borderWidth: "2.5px",
  borderColor: "lineStrong",
  borderTopColor: "ink",
  animation: "spin 0.7s linear infinite",
});
