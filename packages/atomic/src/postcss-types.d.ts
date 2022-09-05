declare module "postcss-sort-media-queries" {
    export default function sortMq(options?: { sort: "mobile-first" | "desktop-first" }): import("postcss").Plugin<{}>;
}

declare module "postcss-prettify" {
    export default function prettify(): import("postcss").Plugin<{}>;
}
