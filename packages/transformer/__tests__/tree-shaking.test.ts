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
      var Y = "_";
      var Z = 2048;
      var I = 32;
      var nn = 33;
      var w = 4;
      function H(n = Z) {
      	let e = 0, t = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), s = (o, i) => {
      		t.set(o, i), ++e > n && (e = 0, r = t, t = /* @__PURE__ */ new Map());
      	};
      	return {
      		get(o) {
      			let i = t.get(o);
      			return i === void 0 && (i = r.get(o)) !== void 0 && s(o, i), i;
      		},
      		set: s
      	};
      }
      function tn(n, e, t, r) {
      	let s = 0, o = n.length > 0, i = 0;
      	for (let u = 0; u <= n.length; u++) {
      		let a = u === n.length ? I : n.charCodeAt(u);
      		if (a !== I && (a < 9 || a > 13)) continue;
      		if ((a !== I || u === i) && (o = !1), u === i) {
      			i = u + 1;
      			continue;
      		}
      		let g = r + s * w;
      		s++, t[g] = i, t[g + 1] = u, t[g + 2] = -1;
      		let p = u;
      		n.charCodeAt(p - 1) === nn && p--;
      		let c = 0, l = i;
      		for (let m = i; m < p; m++) {
      			let R = n.charCodeAt(m);
      			R === 91 ? c++ : R === 93 ? c-- : R === 58 && c === 0 && (l = m + 1);
      		}
      		let d = n.indexOf(e, l);
      		if (d > l && d < p) {
      			let m = 2166136261;
      			for (let R = i; R < d; R++) m = Math.imul(m ^ n.charCodeAt(R), 16777619);
      			t[g + 2] = d, t[g + 3] = m;
      		}
      		i = u + 1;
      	}
      	return o ? s : -s;
      }
      function D(n = {}) {
      	let e = n.separator ?? Y, t = H(), r = H(512), s = [], o = /* @__PURE__ */ new Int32Array(256), i = /* @__PURE__ */ new Int32Array(64), u = /* @__PURE__ */ new Int32Array(64), a = 128, g = new Int32Array(a), p = new Int32Array(a), c = 0;
      	function l(f) {
      		if (f) if (typeof f == "string") s.push(f);
      		else for (let y = 0; y < f.length; y++) l(f[y]);
      	}
      	function d(f) {
      		if (f <= i.length) return;
      		let y = i.length;
      		for (; y < f;) y *= 2;
      		let b = (A, S) => {
      			let h = new Int32Array(S);
      			return h.set(A), h;
      		};
      		o = b(o, y * w), i = b(i, y), u = b(u, y);
      	}
      	function m(f, y) {
      		let b = o[f * w], A = o[y * w], S = o[f * w + 2] - b;
      		if (o[y * w + 2] - A !== S) return !1;
      		let h = s[i[f]], C = s[i[y]];
      		for (let V = 0; V < S; V++) if (h.charCodeAt(b + V) !== C.charCodeAt(A + V)) return !1;
      		return !0;
      	}
      	function R() {
      		let f = 0, y = !0;
      		for (let h = 0; h < s.length; h++) {
      			let C = s[h], V = t.get(C), x;
      			if (V !== void 0) {
      				x = V[0], d(f + Math.abs(x));
      				let v = f * w;
      				for (let O = 1; O < V.length; O++) o[v + O - 1] = V[O];
      			} else if (d(f + C.length), x = tn(C, e, o, f * w), r.get(C) === void 0) r.set(C, !0);
      			else {
      				let v = new Int32Array(1 + Math.abs(x) * w);
      				v[0] = x, v.set(o.subarray(f * w, (f + Math.abs(x)) * w), 1), t.set(C, v);
      			}
      			x <= 0 && (y = !1);
      			let P = f + Math.abs(x);
      			for (; f < P; f++) i[f] = h;
      		}
      		if (f * 2 > a) {
      			for (; f * 2 > a;) a *= 2;
      			g = new Int32Array(a), p = new Int32Array(a), c = 0;
      		}
      		++c === 2147483647 && (c = 1, p.fill(0));
      		let b = a - 1, A = !1;
      		for (let h = 0; h < f; h++) {
      			if (u[h] = h, o[h * w + 2] < 0) continue;
      			let C = o[h * w + 3], V = C & b, x = -1;
      			for (; p[V] === c;) {
      				let P = g[V];
      				if (o[P * w + 3] === C && m(P, h)) {
      					x = P;
      					break;
      				}
      				V = V + 1 & b;
      			}
      			x === -1 ? (p[V] = c, g[V] = h) : (u[x] = h, u[h] = -1, A = !0);
      		}
      		if (!A && y) {
      			let h = s[0];
      			for (let C = 1; C < s.length; C++) h += " " + s[C];
      			return h;
      		}
      		let S = "";
      		for (let h = 0; h < f; h++) {
      			let C = u[h];
      			if (C === -1) continue;
      			let V = s[i[C]].slice(o[C * w], o[C * w + 1]);
      			S = S ? S + " " + V : V;
      		}
      		return S;
      	}
      	return function(...y) {
      		s.length = 0;
      		for (let A = 0; A < y.length; A++) l(y[A]);
      		let b = s.length;
      		return b === 0 ? "" : b === 1 ? s[0] : R();
      	};
      }
      var k = /* @__PURE__ */ D();
      function _(n, e) {
      	let t = { ...n };
      	for (let r in e) e[r] !== void 0 && (t[r] = e[r]);
      	return t;
      }
      function N(n, e) {
      	for (let t in n) {
      		if (t === "css" || t === "className" || t === "classNames") continue;
      		let r = n[t], s = e[t];
      		if (Array.isArray(r)) {
      			if (!r.includes(s)) return !1;
      		} else if (s !== r) return !1;
      	}
      	return !0;
      }
      var J = (n) => n !== null && (typeof n == "object" || typeof n == "function");
      var fn = [
      	"true",
      	"false",
      	"null"
      ];
      function ln(n, e, t, r) {
      	let s = 1, o = [], i = [], u = [], a = [], g = e.map((l) => {
      		let d = /* @__PURE__ */ Object.create(null), m = 1;
      		for (let R of t[l]) d[R] = m++;
      		if (r) i.push(m++), u.push(m++), a.push(m++);
      		else {
      			for (let R of fn) d[R] ??= m++;
      			i.push(d.true), u.push(d.false), a.push(d.null);
      		}
      		return o.push(m), s *= m, d;
      	});
      	if (s > 256) return null;
      	let p = new Array(s), c;
      	return (l) => {
      		if (l == null) return c === void 0 ? c = n() : c;
      		let d = 0;
      		for (let R = 0; R < e.length; R++) {
      			let f = l[e[R]], y = 0;
      			if (f === !0) y = i[R];
      			else if (f === !1) y = u[R];
      			else if (f === null) y = a[R];
      			else if (typeof f == "string") y = g[R][f];
      			else if (f !== void 0) {
      				if (r || J(f)) return n(l);
      				y = g[R][String(f)];
      			}
      			if (y === void 0) return n(l);
      			d = d * o[R] + y;
      		}
      		let m = p[d];
      		return m === void 0 && (p[d] = m = n(l)), m;
      	};
      }
      function dn(n, e) {
      	let t = e.length, r = new Array(16 * t), s = new Array(16), o = 0, i = 0, u;
      	return (a) => {
      		if (a == null) return u === void 0 ? u = n() : u;
      		n: for (let c = 0; c < o; c++) {
      			let l = c * t;
      			for (let d = 0; d < t; d++) if (a[e[d]] !== r[l + d]) continue n;
      			return s[c];
      		}
      		for (let c = 0; c < t; c++) if (J(a[e[c]])) return n(a);
      		let g = n(a), p = i * t;
      		for (let c = 0; c < t; c++) r[p + c] = a[e[c]];
      		return s[i] = g, i === o && o++, i = (i + 1) % 16, g;
      	};
      }
      function j(n, e, t) {
      	let r = Object.keys(e);
      	return r.length === 0 ? n : ln(n, r, e, !!t) ?? dn(n, r);
      }
      var Q = (n) => n != null && typeof n == "object" && !Array.isArray(n);
      function L(...n) {
      	let e = {};
      	for (let t of n) if (Q(t)) for (let r in t) {
      		let s = t[r];
      		e[r] = Q(s) ? L(e[r], s) : s;
      	}
      	return e;
      }
      function U(n, e, t = (r) => r) {
      	let r = _(n.defaultVariants ?? {}, e), s = n.variants ?? {}, o = [t(n.base)];
      	for (let i in r) o.push(t(s[i]?.[r[i]]));
      	for (let i of n.compoundVariants ?? []) N(i, r) && o.push(t(i.css));
      	return L(...o);
      }
      function pn(n, e) {
      	let t = {};
      	for (let r of n.slots ?? Object.keys(n.base ?? {})) t[r] = U(n, e, (s) => s?.[r]);
      	return t;
      }
      function gn(n, e) {
      	let t = {
      		...n.config?.defaultVariants,
      		...e.config?.defaultVariants
      	}, r = [.../* @__PURE__ */ new Set([...n.variantKeys ?? [], ...e.variantKeys ?? []])], s = (i = {}) => _(t, i), o = B((i) => {
      		let u = s(i);
      		return k(n(u), e(u));
      	}, {
      		defaultVariants: t,
      		compoundVariants: [...n.config?.compoundVariants ?? [], ...e.config?.compoundVariants ?? []]
      	}, r, {
      		...n.variantMap,
      		...e.variantMap
      	});
      	return o.raw = (i) => {
      		let u = s(i);
      		return L(n.raw(u), e.raw(u));
      	}, o;
      }
      function B(n, e, t, r, s) {
      	let o = e, i = o.defaultVariants ?? {}, u = j(n, r, o.compoundVariants?.length);
      	return Object.assign(u, {
      		__cva__: !s,
      		variantKeys: t,
      		variantMap: r,
      		...s && { classNameMap: s },
      		config: e,
      		raw: (a = {}) => s ? pn(o, a) : U(o, a),
      		merge: (a, g) => g ? g(e).merge(a) : gn(u, a),
      		getVariantProps: (a = {}) => _(i, a),
      		splitVariantProps: (a) => {
      			let g = {}, p = {};
      			for (let c in a) (t.includes(c) ? g : p)[c] = a[c];
      			return [g, p];
      		}
      	});
      }
      //#endregion
      //#region entry.tsx
      const button = /* @__PURE__ */ B((p = {}) => {
      	p ??= {};
      	const _p0 = p["rounded"];
      	return k("bg_red", { true: "bdr_xl" }[_p0 === void 0 ? void 0 : _p0]);
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
