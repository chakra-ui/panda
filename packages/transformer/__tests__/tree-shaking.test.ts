import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createCompiler } from '@pandacss/compiler'
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
      var z = "_";
      var X = 2048;
      var M = 32;
      var G = 33;
      var m = 4;
      function H(e = X) {
      	let o = 0, t = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map(), r = (i, n) => {
      		t.set(i, n), ++o > e && (o = 0, s = t, t = /* @__PURE__ */ new Map());
      	};
      	return {
      		get(i) {
      			let n = t.get(i);
      			return n === void 0 && (n = s.get(i)) !== void 0 && r(i, n), n;
      		},
      		set: r
      	};
      }
      function W(e, o, t, s) {
      	let r = 0, i = e.length > 0, n = 0;
      	for (let l = 0; l <= e.length; l++) {
      		let a = l === e.length ? M : e.charCodeAt(l);
      		if (a !== M && (a < 9 || a > 13)) continue;
      		if ((a !== M || l === n) && (i = !1), l === n) {
      			n = l + 1;
      			continue;
      		}
      		let C = s + r * m;
      		r++, t[C] = n, t[C + 1] = l, t[C + 2] = -1;
      		let h = l;
      		e.charCodeAt(h - 1) === G && h--;
      		let u = 0, _ = n;
      		for (let R = n; R < h; R++) {
      			let g = e.charCodeAt(R);
      			g === 91 ? u++ : g === 93 ? u-- : g === 58 && u === 0 && (_ = R + 1);
      		}
      		let p = e.indexOf(o, _);
      		if (p > _ && p < h) {
      			let R = 2166136261;
      			for (let g = n; g < p; g++) R = Math.imul(R ^ e.charCodeAt(g), 16777619);
      			t[C + 2] = p, t[C + 3] = R;
      		}
      		n = l + 1;
      	}
      	return i ? r : -r;
      }
      function K(e = {}) {
      	let o = e.separator ?? z, t = H(), s = H(512), r = [], i = /* @__PURE__ */ new Int32Array(256), n = /* @__PURE__ */ new Int32Array(64), l = /* @__PURE__ */ new Int32Array(64), a = 128, C = new Int32Array(a), h = new Int32Array(a), u = 0;
      	function _(c) {
      		if (c) if (typeof c == "string") r.push(c);
      		else for (let f = 0; f < c.length; f++) _(c[f]);
      	}
      	function p(c) {
      		if (c <= n.length) return;
      		let f = n.length;
      		for (; f < c;) f *= 2;
      		let w = (P, x) => {
      			let d = new Int32Array(x);
      			return d.set(P), d;
      		};
      		i = w(i, f * m), n = w(n, f), l = w(l, f);
      	}
      	function R(c, f) {
      		let w = i[c * m], P = i[f * m], x = i[c * m + 2] - w;
      		if (i[f * m + 2] - P !== x) return !1;
      		let d = r[n[c]], A = r[n[f]];
      		for (let y = 0; y < x; y++) if (d.charCodeAt(w + y) !== A.charCodeAt(P + y)) return !1;
      		return !0;
      	}
      	function g() {
      		let c = 0, f = !0;
      		for (let d = 0; d < r.length; d++) {
      			let A = r[d], y = t.get(A), S;
      			if (y !== void 0) {
      				S = y[0], p(c + Math.abs(S));
      				let T = c * m;
      				for (let V = 1; V < y.length; V++) i[T + V - 1] = y[V];
      			} else if (p(c + A.length), S = W(A, o, i, c * m), s.get(A) === void 0) s.set(A, !0);
      			else {
      				let T = new Int32Array(1 + Math.abs(S) * m);
      				T[0] = S, T.set(i.subarray(c * m, (c + Math.abs(S)) * m), 1), t.set(A, T);
      			}
      			S <= 0 && (f = !1);
      			let O = c + Math.abs(S);
      			for (; c < O; c++) n[c] = d;
      		}
      		if (c * 2 > a) {
      			for (; c * 2 > a;) a *= 2;
      			C = new Int32Array(a), h = new Int32Array(a), u = 0;
      		}
      		++u === 2147483647 && (u = 1, h.fill(0));
      		let w = a - 1, P = !1;
      		for (let d = 0; d < c; d++) {
      			if (l[d] = d, i[d * m + 2] < 0) continue;
      			let A = i[d * m + 3], y = A & w, S = -1;
      			for (; h[y] === u;) {
      				let O = C[y];
      				if (i[O * m + 3] === A && R(O, d)) {
      					S = O;
      					break;
      				}
      				y = y + 1 & w;
      			}
      			S === -1 ? (h[y] = u, C[y] = d) : (l[S] = d, l[d] = -1, P = !0);
      		}
      		if (!P && f) {
      			let d = r[0];
      			for (let A = 1; A < r.length; A++) d += " " + r[A];
      			return d;
      		}
      		let x = "";
      		for (let d = 0; d < c; d++) {
      			let A = l[d];
      			if (A === -1) continue;
      			let y = r[n[A]].slice(i[A * m], i[A * m + 1]);
      			x = x ? x + " " + y : y;
      		}
      		return x;
      	}
      	return function(...f) {
      		r.length = 0;
      		for (let P = 0; P < f.length; P++) _(f[P]);
      		let w = r.length;
      		return w === 0 ? "" : w === 1 ? r[0] : g();
      	};
      }
      var b = /* @__PURE__ */ K();
      var B = (e) => e !== null && (typeof e == "object" || typeof e == "function");
      var F = [
      	"true",
      	"false",
      	"null"
      ];
      function q(e, o, t, s) {
      	let r = 1, i = [], n = [], l = [], a = [], C = o.map((_) => {
      		let p = /* @__PURE__ */ Object.create(null), R = 1;
      		for (let g of t[_]) p[g] = R++;
      		if (s) n.push(R++), l.push(R++), a.push(R++);
      		else {
      			for (let g of F) p[g] ??= R++;
      			n.push(p.true), l.push(p.false), a.push(p.null);
      		}
      		return i.push(R), r *= R, p;
      	});
      	if (r > 256) return null;
      	let h = new Array(r), u;
      	return (_) => {
      		if (_ == null) return u === void 0 ? u = e() : u;
      		let p = 0;
      		for (let g = 0; g < o.length; g++) {
      			let c = _[o[g]], f = 0;
      			if (c === !0) f = n[g];
      			else if (c === !1) f = l[g];
      			else if (c === null) f = a[g];
      			else if (typeof c == "string") f = C[g][c];
      			else if (c !== void 0) {
      				if (s || B(c)) return e(_);
      				f = C[g][String(c)];
      			}
      			if (f === void 0) return e(_);
      			p = p * i[g] + f;
      		}
      		let R = h[p];
      		return R === void 0 && (h[p] = R = e(_)), R;
      	};
      }
      function J(e, o) {
      	let t = o.length, s = new Array(16 * t), r = new Array(16), i = 0, n = 0, l;
      	return (a) => {
      		if (a == null) return l === void 0 ? l = e() : l;
      		e: for (let u = 0; u < i; u++) {
      			let _ = u * t;
      			for (let p = 0; p < t; p++) if (a[o[p]] !== s[_ + p]) continue e;
      			return r[u];
      		}
      		for (let u = 0; u < t; u++) if (B(a[o[u]])) return e(a);
      		let C = e(a), h = n * t;
      		for (let u = 0; u < t; u++) s[h + u] = a[o[u]];
      		return r[n] = C, n === i && i++, n = (n + 1) % 16, C;
      	};
      }
      function k(e, o, t) {
      	let s = Object.keys(o);
      	return s.length === 0 ? e : q(e, s, o, !!t) ?? J(e, s);
      }
      function E(e, o) {
      	let t = { ...e };
      	for (let s in o) o[s] !== void 0 && (t[s] = o[s]);
      	return t;
      }
      function j(e, o) {
      	for (let t in e) {
      		if (t === "css" || t === "className" || t === "classNames") continue;
      		let s = e[t], r = o[t];
      		if (Array.isArray(s)) {
      			if (!s.includes(r)) return !1;
      		} else if (r !== s) return !1;
      	}
      	return !0;
      }
      var D = (e) => e != null && typeof e == "object" && !Array.isArray(e);
      function I(...e) {
      	let o = {};
      	for (let t of e) if (D(t)) for (let s in t) {
      		let r = t[s];
      		o[s] = D(r) ? I(o[s], r) : r;
      	}
      	return o;
      }
      function v(e, o, t = (s) => s) {
      	let s = E(e.defaultVariants ?? {}, o), r = e.variants ?? {}, i = [t(e.base)];
      	for (let n in s) i.push(t(r[n]?.[s[n]]));
      	for (let n of e.compoundVariants ?? []) j(n, s) && i.push(t(n.css));
      	return I(...i);
      }
      function Q(e, o) {
      	let t = {};
      	for (let s of e.slots ?? Object.keys(e.base ?? {})) t[s] = v(e, o, (r) => r?.[s]);
      	return t;
      }
      function U(e, o) {
      	let t = {
      		...e.config?.defaultVariants,
      		...o.config?.defaultVariants
      	}, s = [.../* @__PURE__ */ new Set([...e.variantKeys ?? [], ...o.variantKeys ?? []])], r = (n = {}) => E(t, n), i = L((n) => {
      		let l = r(n);
      		return b(e(l), o(l));
      	}, {
      		defaultVariants: t,
      		compoundVariants: [...e.config?.compoundVariants ?? [], ...o.config?.compoundVariants ?? []]
      	}, s, {
      		...e.variantMap,
      		...o.variantMap
      	});
      	return i.raw = (n) => {
      		let l = r(n);
      		return I(e.raw(l), o.raw(l));
      	}, i;
      }
      function L(e, o, t, s, r) {
      	let i = o, n = i.defaultVariants ?? {}, l = k(e, s, i.compoundVariants?.length);
      	return Object.assign(l, {
      		__cva__: !r,
      		variantKeys: t,
      		variantMap: s,
      		...r && { classNameMap: r },
      		config: o,
      		raw: (a = {}) => r ? Q(i, a) : v(i, a),
      		merge: (a, C) => C ? C(o).merge(a) : U(l, a),
      		getVariantProps: (a = {}) => E(n, a),
      		splitVariantProps: (a) => {
      			let C = {}, h = {};
      			for (let u in a) (t.includes(u) ? C : h)[u] = a[u];
      			return [C, h];
      		}
      	});
      }
      //#endregion
      //#region entry.tsx
      const button = /* @__PURE__ */ L((p = {}) => {
      	p ??= {};
      	const _p0 = p["rounded"];
      	return b("bg_red", { true: "bdr_xl" }[_p0 === void 0 ? void 0 : _p0]);
      }, {
      	base: { bg: "red" },
      	variants: { rounded: { true: { borderRadius: "xl" } } }
      }, ["rounded"], { rounded: ["true"] });
      //#endregion
      export { button };
      "
    `)
  })

  it('drops imported cva and sva recipes once every call site in another file folds', async () => {
    const dir = join(__dirname, 'fixtures/imported-recipe')
    const compiler = createCompiler({
      cwd: dir,
      outdir: 'styled-system',
      importMap: { css: ['@panda/css'] },
      utilities: { backgroundColor: { className: 'bg', shorthand: 'bg' }, fontSize: { className: 'fs' } },
    })
    const transformer = createSourceTransformer(compiler)
    const transform = (file: string) =>
      transformer.transformSource({ path: join(dir, file), source: readFileSync(join(dir, file), 'utf8') }).code

    const code = await bundle(compiler, transform('app.tsx'), {
      modules: { '/button.js': transform('button.js'), '/tabs.js': transform('tabs.js') },
    })

    expect(code).toMatchInlineSnapshot(`
      "//#region entry.tsx
      const __ps0 = {
      	root: "bg_red",
      	trigger: "fs_12px"
      };
      const large = "bg_red fs_16px";
      const small = "bg_red fs_12px";
      const slots = __ps0;
      //#endregion
      export { large, slots, small };
      "
    `)
  })
})
