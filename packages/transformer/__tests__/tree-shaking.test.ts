import { describe, expect, it } from 'vitest'
import { createSourceTransformer } from '../src'
import { bundle, createFixtureCompiler } from './fixtures/styled-system'

describe('transformed source tree shaking', () => {
  it('drops unused transformed recipe factories and their runtime', async () => {
    const compiler = createFixtureCompiler()
    const transformed = createSourceTransformer(compiler).transformSource({
      path: 'src/app.tsx',
      source: [
        "import { styled } from '@panda/jsx'",
        "import { cva, sva } from '@panda/css'",
        "const Card = styled('article', { base: { bg: 'red', borderRadius: 'xl' } })",
        "const button = cva({ base: { bg: 'red' } })",
        "const slots = sva({ slots: ['root'], base: { root: { bg: 'red' } } })",
        'export function App() { return <Card /> }',
      ].join('\n'),
    })

    const code = await bundle(compiler, transformed.code)

    expect(code).toMatchInlineSnapshot(`
      "import "react";
      import { jsx } from "react/jsx-runtime";
      //#region styled-system/helpers.mjs
      const htmlProps = [
      	"htmlSize",
      	"htmlTranslate",
      	"htmlWidth",
      	"htmlHeight"
      ];
      function convertHTMLProp(key) {
      	return htmlProps.includes(key) ? key.replace("html", "").toLowerCase() : key;
      }
      function normalizeHTMLProps(props) {
      	return Object.fromEntries(Object.entries(props).map(([key, value]) => [convertHTMLProp(key), value]));
      }
      normalizeHTMLProps.keys = htmlProps;
      new Set("base".split(","));
      //#endregion
      //#region entry.tsx
      function App() {
      	return /* @__PURE__ */ jsx("article", { className: "bg_red bdr_xl" });
      }
      //#endregion
      export { App };
      "
    `)
  })

  it('ships only the recipe surface helper for an exported recipe, not the cva runtime', async () => {
    const compiler = createFixtureCompiler()
    const transformed = createSourceTransformer(compiler).transformSource({
      path: 'src/button.ts',
      source: [
        "import { cva } from '@panda/css'",
        'export const button = cva({',
        "  base: { bg: 'red' },",
        "  variants: { rounded: { true: { borderRadius: 'xl' } } },",
        '})',
      ].join('\n'),
    })

    const code = await bundle(compiler, transformed.code)

    expect(code).toMatchInlineSnapshot(`
      "//#region \\0pandacss:internal:css
      var $ = "_";
      function M(n, r) {
      	let t = n.length;
      	if (t > 0 && n.charCodeAt(t - 1) === 33 && (t -= 1), t === 0) return null;
      	let e = 0, s = -1;
      	for (let c = 0; c < t; c++) {
      		let d = n.charCodeAt(c);
      		d === 91 ? e++ : d === 93 ? e-- : d === 58 && e === 0 && (s = c);
      	}
      	let o = s + 1, i = n.indexOf(r, o);
      	if (i < o + 1 || i >= t) return null;
      	let a = n.slice(o, i);
      	return s === -1 ? a : \`\${n.slice(0, s)}:\${a}\`;
      }
      function O(n, r) {
      	for (let t of n) if (t) {
      		if (Array.isArray(t)) {
      			O(t, r);
      			continue;
      		}
      		t !== "" && r.push(t);
      	}
      }
      function X(n, r) {
      	let t = /* @__PURE__ */ new Map(), e = [], s = 0;
      	for (let i of r) {
      		let a = 0;
      		for (let c = 0; c <= i.length; c++) {
      			if (c !== i.length && i.charCodeAt(c) !== 32) continue;
      			if (c === a) {
      				a = c + 1;
      				continue;
      			}
      			let d = i.slice(a, c);
      			a = c + 1;
      			let u = M(d, n);
      			if (u !== null) t.has(u) || e.push(u), t.set(u, d);
      			else {
      				let f = \`__\${s++}\`;
      				e.push(f), t.set(f, d);
      			}
      		}
      	}
      	if (e.length === 0) return "";
      	if (e.length === 1) return t.get(e[0]);
      	let o = t.get(e[0]);
      	for (let i = 1; i < e.length; i++) o += \` \${t.get(e[i])}\`;
      	return o;
      }
      function N(n = {}) {
      	let r = n.separator ?? $;
      	return function(...e) {
      		if (e.length === 1) {
      			let o = e[0];
      			if (typeof o == "string") return o;
      			if (!o) return "";
      		}
      		let s = [];
      		return O(e, s), s.length === 0 ? "" : s.length === 1 ? s[0] : X(r, s);
      	};
      }
      var g = /* @__PURE__ */ N();
      function V(n, r) {
      	let t = { ...n };
      	for (let e in r) r[e] !== void 0 && (t[e] = r[e]);
      	return t;
      }
      function x(n, r) {
      	for (let t in n) {
      		if (t === "css" || t === "className" || t === "classNames") continue;
      		let e = n[t], s = r[t];
      		if (Array.isArray(e)) {
      			if (!e.includes(s)) return !1;
      		} else if (s !== e) return !1;
      	}
      	return !0;
      }
      var H = (n) => n != null && typeof n == "object" && !Array.isArray(n);
      function S(...n) {
      	let r = {};
      	for (let t of n) if (H(t)) for (let e in t) {
      		let s = t[e];
      		r[e] = H(s) ? S(r[e], s) : s;
      	}
      	return r;
      }
      function F(n, r, t = (e) => e) {
      	let e = V(n.defaultVariants ?? {}, r), s = n.variants ?? {}, o = [t(n.base)];
      	for (let i in e) o.push(t(s[i]?.[e[i]]));
      	for (let i of n.compoundVariants ?? []) x(i, e) && o.push(t(i.css));
      	return S(...o);
      }
      function W(n, r) {
      	let t = {};
      	for (let e of n.slots ?? Object.keys(n.base ?? {})) t[e] = F(n, r, (s) => s?.[e]);
      	return t;
      }
      function Y(n, r) {
      	let t = {
      		...n.config?.defaultVariants,
      		...r.config?.defaultVariants
      	}, e = [.../* @__PURE__ */ new Set([...n.variantKeys ?? [], ...r.variantKeys ?? []])], s = (i = {}) => V(t, i), o = P((i) => {
      		let a = s(i);
      		return g(n(a), r(a));
      	}, { defaultVariants: t }, e, {
      		...n.variantMap,
      		...r.variantMap
      	});
      	return o.raw = (i) => {
      		let a = s(i);
      		return S(n.raw(a), r.raw(a));
      	}, o;
      }
      function P(n, r, t, e, s) {
      	let o = r, i = o.defaultVariants ?? {};
      	return Object.assign(n, {
      		__cva__: !s,
      		variantKeys: t,
      		variantMap: e,
      		...s && { classNameMap: s },
      		config: r,
      		raw: (a = {}) => s ? W(o, a) : F(o, a),
      		merge: (a) => Y(n, a),
      		getVariantProps: (a = {}) => V(i, a),
      		splitVariantProps: (a) => {
      			let c = {}, d = {};
      			for (let u in a) (t.includes(u) ? c : d)[u] = a[u];
      			return [c, d];
      		}
      	});
      }
      //#endregion
      //#region entry.tsx
      const button = /* @__PURE__ */ P((p = {}) => {
      	p ??= {};
      	const _p0 = p["rounded"];
      	return g("bg_red", { true: "bdr_xl" }[_p0 === void 0 ? void 0 : _p0]);
      }, {
      	base: { bg: "red" },
      	variants: { rounded: { true: { borderRadius: "xl" } } }
      }, ["rounded"], { rounded: ["true"] });
      //#endregion
      export { button };
      "
    `)
  })
})
