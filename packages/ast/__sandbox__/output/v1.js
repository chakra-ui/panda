var config2, config21, panda_config_default = config21 = {
    ...config2 = {
        prefix: "pd",
        utilities: [
            {
                properties: {
                    display: {
                        className: (value)=>"none" === value ? "hidden" : value
                    },
                    zIndex: "z",
                    boxSizing: "box",
                    objectPosition: "object",
                    objectFit: "object",
                    overscrollBehavior: "overscroll",
                    overscrollBehaviorX: "overscroll-x",
                    overscrollBehaviorY: "overscroll-y",
                    position: {
                        className: (value)=>value
                    },
                    divideX: {
                        className: "divide-x",
                        valueType: "string"
                    },
                    divideY: {
                        className: "divide-y",
                        valueType: "string"
                    },
                    divideColor: {
                        className: "divide"
                    },
                    divideStyle: {
                        className: "divide",
                        cssType: "borderStyle"
                    },
                    top: {
                        className: "t"
                    },
                    left: {
                        className: "l"
                    },
                    start: {
                        className: "s"
                    },
                    right: {
                        className: "r"
                    },
                    end: {
                        className: "e"
                    },
                    bottom: {
                        className: "b"
                    },
                    insetX: {
                        className: "inset-x"
                    },
                    insetY: {
                        className: "inset-y"
                    },
                    float: {
                        className: "float"
                    },
                    color: {
                        className: "text"
                    },
                    fill: {
                        className: "fill"
                    },
                    stroke: {
                        className: "stroke"
                    },
                    accentColor: {
                        className: "accent"
                    },
                    outlineColor: {
                        className: "oc"
                    },
                    aspectRatio: {
                        className: "aspect"
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
                        className: "gap"
                    },
                    rowGap: {
                        className: "gap-x"
                    },
                    columnGap: {
                        className: "gap-y"
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
                        className: "basis"
                    },
                    flex: {
                        className: "flex"
                    },
                    flexDirection: "flex",
                    flexGrow: "grow",
                    flexShrink: "shrink",
                    padding: {
                        className: "p"
                    },
                    paddingLeft: {
                        className: "pl"
                    },
                    paddingRight: {
                        className: "pr"
                    },
                    paddingTop: {
                        className: "pt"
                    },
                    paddingBottom: {
                        className: "pb"
                    },
                    paddingX: {
                        className: "px"
                    },
                    paddingY: {
                        className: "py"
                    },
                    fontSize: {
                        className: "fs"
                    },
                    fontFamily: {
                        className: "font"
                    },
                    fontWeight: {
                        className: "fw"
                    },
                    fontSmoothing: {
                        className: "smoothing"
                    },
                    fontVariantNumeric: {
                        className: (value)=>value
                    },
                    letterSpacing: {
                        className: "tracking"
                    },
                    lineHeight: {
                        className: "leading"
                    },
                    textAlign: "text",
                    textDecoration: {
                        className: (value)=>value
                    },
                    textDecorationColor: "decoration",
                    textDecorationStyle: "decoration",
                    textDecorationThickness: "decoration",
                    textUnderlineOffset: "underline",
                    textTransform: {
                        className: (value)=>value
                    },
                    textIndent: {
                        className: "indent"
                    },
                    verticalAlign: "align",
                    wordBreak: "break",
                    lineClamp: {
                        className: "clamp"
                    },
                    listStyleType: "list",
                    listStylePosition: "list",
                    width: {
                        className: "w"
                    },
                    height: {
                        className: "h"
                    },
                    minHeight: {
                        className: "min-h"
                    },
                    maxHeight: {
                        className: "max-h"
                    },
                    minWidth: {
                        className: "min-w"
                    },
                    maxWidth: {
                        className: "max-w"
                    },
                    marginLeft: {
                        className: "ml"
                    },
                    marginRight: {
                        className: "mr"
                    },
                    marginTop: {
                        className: "mt"
                    },
                    marginBottom: {
                        className: "mb"
                    },
                    margin: {
                        className: "m"
                    },
                    marginX: {
                        className: "mx"
                    },
                    marginY: {
                        className: "my"
                    },
                    backgroundAttachment: "bg",
                    backgroundClip: "bg-clip",
                    background: {
                        className: "bg"
                    },
                    backgroundColor: {
                        className: "bg"
                    },
                    backgroundOrigin: "bg-origin",
                    backgroundRepeat: "bg-repeat",
                    backgroundBlendMode: "bg-blend",
                    backgroundGradient: {
                        className: "bg-gradient"
                    },
                    gradientFrom: {
                        className: "from"
                    },
                    gradientTo: {
                        className: "to"
                    },
                    transitionTimingFunction: {
                        className: "ease"
                    },
                    transitionDelay: "delay",
                    transitionDuration: "duration",
                    transitionProperty: {
                        className: "transition"
                    },
                    animation: {
                        className: "animation"
                    },
                    borderRadius: {
                        className: "rounded"
                    },
                    border: "border",
                    borderLeft: "border-l",
                    borderRight: "border-r",
                    borderTop: "border-t",
                    borderBottom: "border-b",
                    borderX: {
                        className: "border-x"
                    },
                    borderY: {
                        className: "border-y"
                    },
                    boxShadow: {
                        className: "shadow"
                    },
                    filter: {
                        className: "filter"
                    },
                    brightness: {
                        className: "brightness"
                    },
                    contrast: {
                        className: "contrast"
                    },
                    grayscale: {
                        className: "grayscale"
                    },
                    hueRotate: {
                        className: "hue-rotate"
                    },
                    invert: {
                        className: "invert"
                    },
                    saturate: {
                        className: "saturate"
                    },
                    sepia: {
                        className: "sepia"
                    },
                    dropShadow: {
                        className: "drop-shadow"
                    },
                    blur: {
                        className: "blur",
                        valueType: "string & {}"
                    },
                    scrollBehavior: "scroll",
                    scrollMargin: {
                        className: "scroll-m"
                    },
                    scrollMarginX: {
                        className: "scroll-mx"
                    },
                    scrollMarginY: {
                        className: "scroll-my"
                    },
                    scrollMarginLeft: {
                        className: "scroll-ml"
                    },
                    scrollMarginRight: {
                        className: "scroll-mr"
                    },
                    scrollMarginTop: {
                        className: "scroll-mt"
                    },
                    scrollMarginBottom: {
                        className: "scroll-mb"
                    },
                    scrollPadding: {
                        className: "scroll-p"
                    },
                    scrollPaddingX: {
                        className: "scroll-px"
                    },
                    scrollPaddingY: {
                        className: "scroll-py"
                    },
                    scrollPaddingLeft: {
                        className: "scroll-pl"
                    },
                    scrollPaddingRight: {
                        className: "scroll-pr"
                    },
                    scrollPaddingTop: {
                        className: "scroll-pt"
                    },
                    scrollPaddingBottom: {
                        className: "scroll-pb"
                    },
                    scrollSnapAlign: "snap",
                    scrollSnapStop: "snap",
                    scrollSnapType: {
                        className: "snap"
                    },
                    scrollSnapStrictness: {
                        className: "strictness"
                    },
                    touchAction: "touch",
                    userSelect: "select",
                    srOnly: {
                        className: "sr"
                    }
                }
            }
        ]
    },
    clean: !1,
    watch: !1,
    hash: !1,
    outdir: "styled-system",
    include: [
        "*.jsx"
    ]
};
export { panda_config_default as default };
