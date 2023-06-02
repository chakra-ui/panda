import { mapObject } from '../helpers.mjs';
import { css } from '../css/index.mjs';

const joinConfig = {
transform(props, { map }) {
  const { orientation = "horizontal", scope: _scope, ...rest } = props;
  const scope = _scope ?? "> *";
  function mapSelector(directSelector, scopedSelector) {
    return [`& ${directSelector}`, _scope && `& ${scopedSelector}`].filter(Boolean).join(",");
  }
  return {
    display: "inline-flex",
    alignItems: "stretch",
    flexDirection: map(orientation, (v) => v === "vertical" ? "column" : "row"),
    "& > :where(*:not(:first-child))": {
      mt: map(orientation, (v) => v === "vertical" ? "-1px" : void 0),
      ml: map(orientation, (v) => v === "horizontal" ? "-1px" : void 0),
      mx: map(orientation, (v) => v === "vertical" ? "0" : void 0),
      my: map(orientation, (v) => v === "horizontal" ? "0" : void 0)
    },
    [`& ${scope}:focus`]: {
      isolation: "isolate"
    },
    // '& *': {
    //   borderRadius: 'inherit',
    // },
    [`& :where(& ${scope})`]: {
      borderTopRightRadius: "0",
      borderBottomRightRadius: "0",
      borderBottomLeftRadius: "0",
      borderTopLeftRadius: "0"
    },
    [mapSelector(`${scope}:not(:first-child):not(:last-child)`, `*:not(:first-child):not(:last-child) ${scope}`)]: {
      borderTopRightRadius: "0",
      borderBottomRightRadius: "0",
      borderBottomLeftRadius: "0",
      borderTopLeftRadius: "0"
    },
    [`${mapSelector(
      `${scope}:first-child:not(:last-child)`,
      `*:first-child:not(:last-child) ${scope}`
    )}, ${mapSelector(
      `:where(${scope}:last-child:not(:first-child))`,
      `:where(*:last-child:not(:first-child)  ${scope}`
    )}`]: {
      borderTopRightRadius: "0",
      borderBottomRightRadius: "0"
    },
    [`${mapSelector(
      `:where(${scope}:first-child:not(:last-child))`,
      `:where(*:first-child:not(:last-child) ${scope}`
    )}, ${mapSelector(` ${scope}:last-child:not(:first-child)`, `*:last-child:not(:first-child) ${scope}`)}`]: {
      borderBottomLeftRadius: "0",
      borderTopLeftRadius: "0"
    },
    [mapSelector(`${scope}:first-child:not(:last-child)`, `*:first-child:not(:last-child) ${scope}`)]: {
      borderBottomLeftRadius: map(orientation, (v) => v === "vertical" ? "0" : void 0),
      borderBottomRightRadius: "0",
      borderTopRightRadius: map(orientation, (v) => v === "horizontal" ? "0" : void 0)
    },
    [mapSelector(`${scope}:first-child:not(:last-child)`, `*:first-child:not(:last-child) ${scope}`)]: {
      borderTopLeftRadius: "inherit",
      borderTopRightRadius: map(orientation, (v) => v === "vertical" ? "inherit" : void 0),
      borderBottomLeftRadius: map(orientation, (v) => v === "horizontal" ? "inherit" : void 0)
    },
    [mapSelector(` ${scope}:last-child:not(:first-child)`, `*:last-child:not(:first-child) ${scope}`)]: {
      borderTopLeftRadius: "0",
      borderTopRightRadius: map(orientation, (v) => v === "vertical" ? "0" : "inherit"),
      borderBottomLeftRadius: map(orientation, (v) => v === "vertical" ? "inherit" : "0"),
      borderBottomRightRadius: "inherit"
    },
    ...rest
  };
}}

export const getJoinStyle = (styles = {}) => joinConfig.transform(styles, { map: mapObject })

export const join = (styles) => css(getJoinStyle(styles))