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

export const invalid = css({
  minH: "60vh",
  maxW: "420px",
  mx: "auto",
  px: "6",
  display: "flex",
  flexDir: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "4",
  textAlign: "center",
  fontFamily: "body",
});

export const invalidIcon = css({ color: "faint", mb: "1" });

export const invalidTitle = css({
  fontFamily: "display",
  fontSize: "24px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
});

export const invalidBody = css({ fontSize: "14.5px", color: "muted", lineHeight: "1.6" });

export const command = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "4",
  w: "full",
  mt: "2",
  pl: "4",
  pr: "1.5",
  py: "1.5",
  rounded: "lg",
  borderWidth: "1px",
  borderColor: "line",
  bg: "subtle",
  fontFamily: "mono",
  fontSize: "13.5px",
});

export const prompt = css({ color: "faint", mr: "1" });

export const copy = css({
  px: "3",
  py: "1.5",
  rounded: "md",
  fontFamily: "body",
  fontSize: "12.5px",
  color: "muted",
  bg: "transparent",
  borderWidth: "0",
  cursor: "pointer",
  _hover: { color: "ink", bg: "canvas" },
});
