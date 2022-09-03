// ../packages/fixture/src/tokens.ts
var semanticTokens = {
  colors: {
    primary: { _: "red.500", dark: "red.400" },
    secondary: { _: "red.800", dark: "red.700" }
  },
  spacing: {
    gutter: { _: "4", lg: "5", dark: "40px" }
  }
};
var tokens = {
  fonts: {
    heading: "-apple-system, BlinkMacSystemFont",
    body: "Helvetica, Arial, sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco"
  },
  colors: {
    current: "currentColor",
    gray: {
      "50": "#FAFAFA",
      "100": "#F5F5F5",
      "200": "#E5E5E5",
      "300": "#D4D4D4",
      "400": "#A3A3A3",
      "500": "#737373",
      "600": "#525252",
      "700": "#333333",
      "800": "#121212",
      "900": "#0A0A0A"
    },
    green: {
      "50": "#F0FFF4",
      "100": "#C6F6D5",
      "200": "#9AE6B4",
      "300": "#68D391",
      "400": "#48BB78",
      "500": "#38A169",
      "600": "#2F855A",
      "700": "#276749",
      "800": "#22543D",
      "900": "#1C4532"
    },
    red: {
      "50": "#FEF2F2",
      "100": "#FEE2E2",
      "200": "#FECACA",
      "300": "#FCA5A5",
      "400": "#F87171",
      "500": "#EF4444",
      "600": "#DC2626",
      "700": "#B91C1C",
      "800": "#991B1B",
      "900": "#7F1D1D"
    }
  },
  fontSizes: {
    sm: "0.5rem",
    xs: "0.75rem",
    md: "0.875rem",
    lg: "1.125rem",
    xl: "1.25rem"
  },
  lineHeights: {
    normal: "normal",
    none: "1",
    shorter: "1.25",
    short: "1.375",
    base: "1.5",
    tall: "1.625",
    taller: "2"
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700"
  },
  letterSpacings: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em"
  },
  radii: {
    none: "0",
    sm: "0.125rem",
    base: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px"
  },
  shadows: {
    xs: "0 0 0 1px rgba(0, 0, 0, 0.05)",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  },
  dropShadows: {
    sm: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))",
    md: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06))"
  },
  spacing: {
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem"
  },
  sizes: {
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem"
  },
  largeSizes: {
    xs: "20rem",
    sm: "24rem",
    md: "28rem",
    lg: "32rem",
    xl: "36rem"
  },
  animations: {
    none: "none",
    spin: "spin 1s linear infinite",
    ping: "ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
    pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    bounce: "bounce 1s infinite"
  },
  opacity: {
    0: "0",
    25: "0.25",
    50: "0.5",
    75: "0.75",
    100: "1"
  },
  easings: {
    "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)"
  },
  durations: {
    "75": "75ms",
    "100": "100ms",
    "150": "150ms"
  },
  transitionProperties: {
    all: "all",
    none: "none",
    opacity: "opacity",
    shadow: "box-shadow",
    transform: "transform",
    base: "color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter",
    background: "background, background-color",
    colors: "color, background-color, border-color, text-decoration-color, fill, stroke"
  }
};

// ../packages/fixture/src/breakpoints.ts
var breakpoints = {
  sm: "30em",
  md: "48em",
  lg: "62em",
  xl: "80em",
  "2xl": "96em"
};

// ../packages/fixture/src/keyframes.ts
var keyframes = {
  spin: {
    to: {
      transform: "rotate(360deg)"
    }
  },
  ping: {
    "75%, 100%": {
      transform: "scale(2)",
      opacity: "0"
    }
  },
  pulse: {
    "50%": {
      opacity: ".5"
    }
  },
  bounce: {
    "0%, 100%": {
      transform: "translateY(-25%)",
      animationTimingFunction: "cubic-bezier(0.8,0,1,1)"
    },
    "50%": {
      transform: "none",
      animationTimingFunction: "cubic-bezier(0,0,0.2,1)"
    }
  }
};

// ../packages/fixture/src/conditions.ts
var conditions = {
  hover: "&:hover",
  focus: "&:focus",
  focusWithin: "&:focus-within",
  focusVisible: "&:focus-visible",
  disabled: "&:disabled",
  active: "&:active",
  visited: "&:visited",
  target: "&:target",
  readOnly: "&:read-only",
  readWrite: "&:read-write",
  before: "&::before",
  after: "&::after",
  firstLetter: "&::first-letter",
  firstLine: "&::first-line",
  marker: "&::marker",
  selection: "&::selection",
  file: "&::file-selector-button",
  backdrop: "&::backdrop",
  first: "&:first-child",
  last: "&:last-child",
  only: "&:only-child",
  even: "&:even",
  odd: "&:odd",
  firstOfType: "&:first-of-type",
  lastOfType: "&:last-of-type",
  onlyOfType: "&:only-of-type",
  empty: "&:empty",
  checked: "&:checked",
  enabled: "&:enabled",
  indeterminate: "&:indeterminate",
  required: "&:required",
  valid: "&:valid",
  invalid: "&:invalid",
  autofill: "&:autofill",
  inRange: "&:in-range",
  outOfRange: "&:out-of-range",
  placeholder: "&:placeholder",
  placeholderShown: "&:placeholder-shown",
  default: "&:default",
  optional: "&:optional",
  open: "&[open]",
  motionReduce: "@media (prefers-reduced-motion: reduce)",
  print: "@media print",
  dark: "[data-theme=dark] &",
  light: "[data-theme=light] &",
  hiConstrast: "@media (forced-colors: active)",
  ltr: "[dir=ltr] &",
  rtl: "[dir=rtl] &"
};

// ../packages/fixture/src/css-utility.ts
var utilities = [
  {
    properties: {
      display: {
        className: (value) => value === "none" ? "hidden" : value
      },
      zIndex: "z",
      boxSizing: "box",
      objectPosition: "object",
      objectFit: "object",
      overscrollBehavior: "overscroll",
      overscrollBehaviorX: "overscroll-x",
      overscrollBehaviorY: "overscroll-y",
      position: {
        className: (value) => value
      },
      divideX: {
        className: "divide-x",
        valueType: "string",
        transform(value) {
          return {
            "& > * ~ *": {
              borderLeftWidth: value,
              borderRightWidth: "0px"
            }
          };
        }
      },
      divideY: {
        className: "divide-y",
        valueType: "string",
        transform(value) {
          return {
            "& > * ~ *": {
              borderTopWidth: value,
              borderBottomWidth: "0px"
            }
          };
        }
      },
      divideColor: {
        className: "divide",
        values: "colors",
        transform(value) {
          return {
            "& > * ~ *": {
              borderColor: value
            }
          };
        }
      },
      divideStyle: {
        className: "divide",
        cssType: "borderStyle",
        transform(value) {
          return {
            "& > * ~ *": {
              borderStyle: value
            }
          };
        }
      },
      top: {
        className: "t",
        values: "spacing"
      },
      left: {
        className: "l",
        values: "spacing"
      },
      start: {
        className: "s",
        values: "spacing",
        transform(value) {
          return {
            left: value,
            "[dir='rtl'] &": {
              right: value
            }
          };
        }
      },
      right: {
        className: "r",
        values: "spacing"
      },
      end: {
        className: "e",
        values: "spacing",
        transform(value) {
          return {
            right: value,
            "[dir='rtl'] &": {
              left: value
            }
          };
        }
      },
      bottom: {
        className: "b",
        values: "spacing"
      },
      insetX: {
        className: "inset-x",
        values: "spacing",
        transform(value) {
          return {
            left: value,
            right: value
          };
        }
      },
      insetY: {
        className: "inset-y",
        values: "spacing",
        transform(value) {
          return {
            top: value,
            bottom: value
          };
        }
      },
      float: {
        className: "float",
        values: ["left", "right", "start", "end"],
        transform(value) {
          if (value === "start") {
            return {
              float: "left",
              '[dir="rtl"] &': {
                float: "right"
              }
            };
          }
          if (value === "end") {
            return {
              float: "right",
              '[dir="rtl"] &': {
                float: "left"
              }
            };
          }
          return {
            float: value
          };
        }
      },
      color: {
        className: "text",
        values: "colors"
      },
      fill: {
        className: "fill",
        values: "colors"
      },
      stroke: {
        className: "stroke",
        values: "colors"
      },
      accentColor: {
        className: "accent",
        values: "colors"
      },
      outlineColor: {
        className: "oc",
        values: "colors"
      },
      aspectRatio: {
        className: "aspect",
        values: {
          auto: "auto",
          square: "1 / 1",
          video: "16 / 9"
        }
      },
      gridTemplateColumns: {
        className: "grid-cols"
      },
      gridColumnStart: "grid-col-start",
      gridColumnEnd: "grid-col-end",
      gridAutoFlow: "grid-flow",
      gridAutoColumns: "auto-cols",
      gridAutoRows: "auto-rows",
      gap: {
        className: "gap",
        values: "spacing"
      },
      rowGap: {
        className: "gap-x",
        values: "spacing"
      },
      columnGap: {
        className: "gap-y",
        values: "spacing"
      },
      justifyContent: {
        className: "justify"
      },
      alignContent: {
        className: "content"
      },
      alignItems: "items",
      alignSelf: "self",
      flexBasis: {
        className: "basis",
        values: {
          "0": "0",
          "1/2": "50%",
          "1/3": "33.333333%",
          "2/3": "66.666667%",
          "1/4": "25%"
        }
      },
      flex: {
        className: "flex",
        values: {
          "1": "1 1 0%",
          auto: "1 1 auto",
          initial: "0 1 auto",
          none: "none"
        }
      },
      flexDirection: "flex",
      flexGrow: "grow",
      flexShrink: "shrink",
      padding: {
        className: "p",
        values: "spacing"
      },
      paddingLeft: {
        className: "pl",
        values: "spacing"
      },
      paddingRight: {
        className: "pr",
        values: "spacing"
      },
      paddingTop: {
        className: "pt",
        values: "spacing"
      },
      paddingBottom: {
        className: "pb",
        values: "spacing"
      },
      paddingX: {
        className: "px",
        values: "spacing",
        transform(value) {
          return {
            paddingInline: value
          };
        }
      },
      paddingY: {
        className: "py",
        values: "spacing",
        transform(value) {
          return {
            paddingBlock: value
          };
        }
      },
      fontSize: {
        className: "fs",
        values: "fontSizes"
      },
      fontFamily: {
        className: "font",
        values: "fonts"
      },
      fontWeight: {
        className: "fw",
        values: "fontWeights"
      },
      fontSmoothing: {
        className: "smoothing",
        values: {
          antialiased: "antialiased",
          "subpixel-antialiased": "auto"
        },
        transform(value) {
          return {
            "-webkit-font-smoothing": value
          };
        }
      },
      fontVariantNumeric: {
        className(value) {
          return value;
        }
      },
      letterSpacing: {
        className: "tracking",
        values: "letterSpacings"
      },
      lineHeight: {
        className: "leading",
        values: "lineHeights"
      },
      textAlign: "text",
      textDecoration: {
        className(value) {
          return value;
        }
      },
      textDecorationColor: "decoration",
      textDecorationStyle: "decoration",
      textDecorationThickness: "decoration",
      textUnderlineOffset: "underline",
      textTransform: {
        className(value) {
          return value;
        }
      },
      textIndent: {
        className: "indent",
        values: "spacing"
      },
      verticalAlign: "align",
      wordBreak: "break",
      lineClamp: {
        className: "clamp",
        transform(value) {
          if (value === "none") {
            return {
              "-webkit-line-clamp": "unset"
            };
          }
          return {
            overflow: "hidden",
            display: "-webkit-box",
            "-webkit-line-clamp": value,
            "-webkit-box-orient": "vertical"
          };
        }
      },
      listStyleType: "list",
      listStylePosition: "list",
      width: {
        className: "w",
        values(theme) {
          return {
            ...theme("sizes"),
            "1/2": "50%",
            "1/3": "33.333333%",
            "2/3": "66.666667%",
            "1/4": "25%",
            "2/4": "50%"
          };
        }
      },
      height: {
        className: "h",
        values: "sizes"
      },
      minHeight: {
        className: "min-h",
        values: "sizes"
      },
      maxHeight: {
        className: "max-h",
        values: "sizes"
      },
      minWidth: {
        className: "min-w",
        values: "sizes"
      },
      maxWidth: {
        className: "max-w",
        values: "largeSizes"
      },
      marginLeft: {
        className: "ml",
        values: "spacing"
      },
      marginRight: {
        className: "mr",
        values: "spacing"
      },
      marginTop: {
        className: "mt",
        values: "spacing"
      },
      marginBottom: {
        className: "mb",
        values: "spacing"
      },
      margin: {
        className: "m",
        values: "spacing"
      },
      marginX: {
        className: "mx",
        values: "spacing",
        transform(value) {
          return {
            marginInline: value
          };
        }
      },
      marginY: {
        className: "my",
        values: "spacing",
        transform(value) {
          return {
            marginBlock: value
          };
        }
      },
      backgroundAttachment: "bg",
      backgroundClip: "bg-clip",
      background: {
        className: "bg",
        values: "colors"
      },
      backgroundColor: {
        className: "bg",
        values: "colors"
      },
      backgroundOrigin: "bg-origin",
      backgroundRepeat: "bg-repeat",
      backgroundBlendMode: "bg-blend",
      backgroundGradient: {
        className: "bg-gradient",
        values: {
          none: "none",
          "to-t": "linear-gradient(to top, var(--gradient-stops))",
          "to-tr": "linear-gradient(to top right, var(--gradient-stops))",
          "to-r": "linear-gradient(to right, var(--gradient-stops))",
          "to-br": "linear-gradient(to bottom right, var(--gradient-stops))",
          "to-b": "linear-gradient(to bottom, var(--gradient-stops))",
          "to-bl": "linear-gradient(to bottom left, var(--gradient-stops))",
          "to-l": "linear-gradient(to left, var(--gradient-stops))",
          "to-tl": "linear-gradient(to top left, var(--gradient-stops))"
        },
        transform(value) {
          return {
            "--gradient-stops": "var(--gradient-from), var(--gradient-to)",
            backgroundImage: value
          };
        }
      },
      gradientFrom: {
        className: "from",
        values: "colors",
        transform(value) {
          return {
            "--gradient-from": value
          };
        }
      },
      gradientTo: {
        className: "to",
        values: "colors",
        transform(value) {
          return {
            "--gradient-to": value
          };
        }
      },
      transitionTimingFunction: {
        className: "ease",
        values: "easings"
      },
      transitionDelay: "delay",
      transitionDuration: "duration",
      transitionProperty: {
        className: "transition",
        values: "transitionProperties"
      },
      animation: {
        className: "animation",
        values: "animations"
      },
      borderRadius: {
        className: "rounded",
        values: "radii"
      },
      border: "border",
      borderLeft: "border-l",
      borderRight: "border-r",
      borderTop: "border-t",
      borderBottom: "border-b",
      borderX: {
        className: "border-x",
        transform(value) {
          return {
            borderInline: value
          };
        }
      },
      borderY: {
        className: "border-y",
        transform(value) {
          return {
            borderBlock: value
          };
        }
      },
      boxShadow: {
        className: "shadow",
        values: "shadows"
      },
      filter: {
        className: "filter",
        values: {
          auto: [
            "var(--blur)",
            "var(--brightness)",
            "var(--contrast)",
            "var(--grayscale)",
            "var(--hue-rotate)",
            "var(--invert)",
            "var(--saturate)",
            "var(--sepia)",
            "var(--drop-shadow)"
          ].join(" ")
        }
      },
      brightness: {
        className: "brightness",
        transform(value) {
          return {
            "--brightness": `brightness(${value})`
          };
        }
      },
      contrast: {
        className: "contrast",
        transform(value) {
          return {
            "--contrast": `constrast(${value})`
          };
        }
      },
      grayscale: {
        className: "grayscale",
        transform(value) {
          return {
            "--grayscale": `grayscale(${value})`
          };
        }
      },
      hueRotate: {
        className: "hue-rotate",
        transform(value) {
          return {
            "--hue-rotate": `hue-rotate(${value})`
          };
        }
      },
      invert: {
        className: "invert",
        transform(value) {
          return {
            "--invert": `invert(${value})`
          };
        }
      },
      saturate: {
        className: "saturate",
        transform(value) {
          return {
            "--saturate": `saturate(${value})`
          };
        }
      },
      sepia: {
        className: "sepia",
        transform(value) {
          return {
            "--sepia": `sepia(${value})`
          };
        }
      },
      dropShadow: {
        className: "drop-shadow",
        transform(value) {
          return {
            "--drop-shadow": value
          };
        }
      },
      blur: {
        className: "blur",
        valueType: "string & {}",
        transform(value) {
          return {
            "--blur": `blur(${value})`
          };
        }
      },
      scrollBehavior: "scroll",
      scrollMargin: {
        className: "scroll-m",
        values: "spacing"
      },
      scrollMarginX: {
        className: "scroll-mx",
        values: "spacing",
        transform(value) {
          return {
            scrollMarginInline: value
          };
        }
      },
      scrollMarginY: {
        className: "scroll-my",
        values: "spacing",
        transform(value) {
          return {
            scrollMarginBlock: value
          };
        }
      },
      scrollMarginLeft: {
        className: "scroll-ml",
        values: "spacing"
      },
      scrollMarginRight: {
        className: "scroll-mr",
        values: "spacing"
      },
      scrollMarginTop: {
        className: "scroll-mt",
        values: "spacing"
      },
      scrollMarginBottom: {
        className: "scroll-mb",
        values: "spacing"
      },
      scrollPadding: {
        className: "scroll-p",
        values: "spacing"
      },
      scrollPaddingX: {
        className: "scroll-px",
        values: "spacing",
        transform(value) {
          return {
            scrollPaddingInline: value
          };
        }
      },
      scrollPaddingY: {
        className: "scroll-py",
        values: "spacing",
        transform(value) {
          return {
            scrollPaddingBlock: value
          };
        }
      },
      scrollPaddingLeft: {
        className: "scroll-pl",
        values: "spacing"
      },
      scrollPaddingRight: {
        className: "scroll-pr",
        values: "spacing"
      },
      scrollPaddingTop: {
        className: "scroll-pt",
        values: "spacing"
      },
      scrollPaddingBottom: {
        className: "scroll-pb",
        values: "spacing"
      },
      scrollSnapAlign: "snap",
      scrollSnapStop: "snap",
      scrollSnapType: {
        className: "snap",
        values: {
          none: "none",
          x: "x var(--scroll-snap-strictness)",
          y: "y var(--scroll-snap-strictness)",
          both: "both var(--scroll-snap-strictness)"
        }
      },
      scrollSnapStrictness: {
        className: "strictness",
        values: ["mandatory", "proximity"],
        transform(value) {
          return {
            "--scroll-snap-strictness": value
          };
        }
      },
      touchAction: "touch",
      userSelect: "select",
      srOnly: {
        className: "sr",
        values: ["true", "false"],
        transform(value) {
          return srMapping[value] || {};
        }
      }
    }
  }
];
var srMapping = {
  true: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: "0"
  },
  false: {
    position: "static",
    width: "auto",
    height: "auto",
    padding: "0",
    margin: "0",
    overflow: "visible",
    clip: "auto",
    whiteSpace: "normal"
  }
};

// ../packages/types/src/config.ts
function defineConfig(config2) {
  return config2;
}

// ../packages/fixture/src/pattern.ts
var patterns = [
  {
    name: "stack",
    properties: {
      align: { type: "cssProp", value: "alignItems" },
      justify: { type: "cssProp", value: "justifyContent" },
      direction: { type: "cssProp", value: "flexDirection" },
      gap: { type: "token", value: "spacing" }
    },
    transform(props) {
      const { align = "flex-start", justify, direction = "column", gap = "10px" } = props;
      return {
        display: "flex",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        gap,
        minWidth: "0"
      };
    }
  },
  {
    name: "absoluteCenter",
    properties: {
      axis: { type: "enum", value: ["x", "y", "both"] }
    },
    transform(props) {
      const { axis } = props;
      return {
        position: "absolute",
        top: axis === "x" ? "auto" : "50%",
        left: axis === "y" ? "auto" : "50%",
        transform: axis === "both" ? "translate(-50%, -50%)" : axis === "x" ? "translateX(-50%)" : "translateY(-50%)"
      };
    }
  },
  {
    name: "simpleGrid",
    properties: {
      gap: { type: "token", value: "spacing" },
      columns: { type: "number" },
      minChildWidth: { type: "token", value: "sizes", cssProp: "width" }
    },
    transform(props) {
      const { gap, columns, minChildWidth } = props;
      return {
        display: "grid",
        gridGap: gap,
        gridTemplateColumns: columns ? `repeat(${columns}, minmax(0, 1fr))` : `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
      };
    }
  }
];

// ../packages/fixture/src/recipes.ts
var recipes = [
  {
    name: "textStyle",
    base: {
      fontFamily: "mono",
      divideX: "20px"
    },
    variants: {
      size: {
        h1: {
          fontSize: "5rem",
          lineHeight: "1em",
          fontWeight: 800
        },
        h2: {
          fontSize: "3rem",
          lineHeight: "1.2em",
          fontWeight: 700,
          letterSpacing: "-0.03em"
        }
      }
    }
  }
];

// ../packages/fixture/src/config.ts
var config = defineConfig({
  breakpoints,
  prefix: "pd",
  keyframes,
  tokens,
  semanticTokens,
  conditions,
  utilities,
  recipes,
  patterns
});

// panda.config.ts
var panda_config_default = defineConfig({
  ...config,
  clean: false,
  watch: false,
  hash: false,
  outdir: "styled-system",
  include: ["*.jsx"]
});
export {
  panda_config_default as default
};
