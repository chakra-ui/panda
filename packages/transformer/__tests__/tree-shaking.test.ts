import { posix } from 'node:path'
import { createCompiler } from '@pandacss/compiler'
import { rolldown } from 'rolldown'
import { describe, expect, it } from 'vitest'
import {
  createSourceTransformer,
  getInternalCssRuntimeSource,
  INTERNAL_CSS_IMPORT,
  INTERNAL_CSS_RESOLVED_ID,
} from '../src'

function createFixtureCompiler() {
  return createCompiler({
    cwd: '/virtual',
    outdir: 'styled-system',
    outExtension: 'mjs',
    jsxFramework: 'react',
    jsxFactory: 'styled',
    importMap: {
      css: ['@panda/css'],
      recipe: ['@panda/recipes'],
      pattern: ['@panda/patterns'],
      jsx: ['@panda/jsx'],
      tokens: ['@panda/tokens'],
    },
    utilities: {
      backgroundColor: { className: 'bg', shorthand: 'bg' },
      borderRadius: { className: 'bdr' },
    },
  })
}

async function bundle(compiler: ReturnType<typeof createCompiler>, code: string) {
  const modules = new Map<string, string>([['/entry.tsx', code]])
  for (const artifact of compiler.generateArtifacts()) {
    for (const file of artifact.files) {
      if (file.path.endsWith('.mjs')) modules.set(posix.join('/styled-system', file.path), file.code)
    }
  }
  modules.set(INTERNAL_CSS_RESOLVED_ID, getInternalCssRuntimeSource())

  const build = await rolldown({
    cwd: '/',
    input: '/entry.tsx',
    external: ['react', 'react/jsx-runtime'],
    plugins: [
      {
        name: 'panda-tree-shaking-fixture',
        resolveId(source, importer) {
          if (modules.has(source)) return source
          if (source === '@panda/jsx') return '/styled-system/jsx/index.mjs'
          if (source === INTERNAL_CSS_IMPORT) return INTERNAL_CSS_RESOLVED_ID
          if (!importer || !source.startsWith('.')) return null

          const resolved = posix.normalize(posix.join(posix.dirname(importer), source))
          for (const candidate of [resolved, `${resolved}.mjs`]) {
            if (modules.has(candidate)) return candidate
          }
          return null
        },
        load(id) {
          return modules.get(id) ?? null
        },
      },
    ],
  })

  try {
    const { output } = await build.generate({ format: 'esm', codeSplitting: false })
    const chunk = output.find((item) => item.type === 'chunk')
    if (!chunk || chunk.type !== 'chunk') throw new Error('expected an output chunk')
    return chunk.code
  } finally {
    await build.close()
  }
}

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
      //#region \\0pandacss:internal:css
      var H = "_";
      function A(n, r) {
      	let t = n.length;
      	if (t > 0 && n.charCodeAt(t - 1) === 33 && (t -= 1), t === 0) return null;
      	let e = 0, s = -1;
      	for (let i = 0; i < t; i++) {
      		let l = n.charCodeAt(i);
      		l === 91 ? e++ : l === 93 ? e-- : l === 58 && e === 0 && (s = i);
      	}
      	let o = s + 1, a = n.indexOf(r, o);
      	if (a < o + 1 || a >= t) return null;
      	let u = n.slice(o, a);
      	return s === -1 ? u : \`\${n.slice(0, s)}:\${u}\`;
      }
      function S(n, r) {
      	for (let t of n) if (t) {
      		if (Array.isArray(t)) {
      			S(t, r);
      			continue;
      		}
      		t !== "" && r.push(t);
      	}
      }
      function L(n, r) {
      	let t = /* @__PURE__ */ new Map(), e = [], s = 0;
      	for (let a of r) {
      		let u = 0;
      		for (let i = 0; i <= a.length; i++) {
      			if (i !== a.length && a.charCodeAt(i) !== 32) continue;
      			if (i === u) {
      				u = i + 1;
      				continue;
      			}
      			let l = a.slice(u, i);
      			u = i + 1;
      			let f = A(l, n);
      			if (f !== null) t.has(f) || e.push(f), t.set(f, l);
      			else {
      				let c = \`__\${s++}\`;
      				e.push(c), t.set(c, l);
      			}
      		}
      	}
      	if (e.length === 0) return "";
      	if (e.length === 1) return t.get(e[0]);
      	let o = t.get(e[0]);
      	for (let a = 1; a < e.length; a++) o += \` \${t.get(e[a])}\`;
      	return o;
      }
      function P(n = {}) {
      	let r = n.separator ?? H;
      	return function(...e) {
      		if (e.length === 1) {
      			let o = e[0];
      			if (typeof o == "string") return o;
      			if (!o) return "";
      		}
      		let s = [];
      		return S(e, s), s.length === 0 ? "" : s.length === 1 ? s[0] : L(r, s);
      	};
      }
      P();
      //#endregion
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
      var H = "_";
      function A(n, r) {
      	let t = n.length;
      	if (t > 0 && n.charCodeAt(t - 1) === 33 && (t -= 1), t === 0) return null;
      	let e = 0, s = -1;
      	for (let i = 0; i < t; i++) {
      		let l = n.charCodeAt(i);
      		l === 91 ? e++ : l === 93 ? e-- : l === 58 && e === 0 && (s = i);
      	}
      	let o = s + 1, a = n.indexOf(r, o);
      	if (a < o + 1 || a >= t) return null;
      	let u = n.slice(o, a);
      	return s === -1 ? u : \`\${n.slice(0, s)}:\${u}\`;
      }
      function S(n, r) {
      	for (let t of n) if (t) {
      		if (Array.isArray(t)) {
      			S(t, r);
      			continue;
      		}
      		t !== "" && r.push(t);
      	}
      }
      function L(n, r) {
      	let t = /* @__PURE__ */ new Map(), e = [], s = 0;
      	for (let a of r) {
      		let u = 0;
      		for (let i = 0; i <= a.length; i++) {
      			if (i !== a.length && a.charCodeAt(i) !== 32) continue;
      			if (i === u) {
      				u = i + 1;
      				continue;
      			}
      			let l = a.slice(u, i);
      			u = i + 1;
      			let f = A(l, n);
      			if (f !== null) t.has(f) || e.push(f), t.set(f, l);
      			else {
      				let c = \`__\${s++}\`;
      				e.push(c), t.set(c, l);
      			}
      		}
      	}
      	if (e.length === 0) return "";
      	if (e.length === 1) return t.get(e[0]);
      	let o = t.get(e[0]);
      	for (let a = 1; a < e.length; a++) o += \` \${t.get(e[a])}\`;
      	return o;
      }
      function P(n = {}) {
      	let r = n.separator ?? H;
      	return function(...e) {
      		if (e.length === 1) {
      			let o = e[0];
      			if (typeof o == "string") return o;
      			if (!o) return "";
      		}
      		let s = [];
      		return S(e, s), s.length === 0 ? "" : s.length === 1 ? s[0] : L(r, s);
      	};
      }
      var V = P();
      function C(n, r) {
      	let t = { ...n };
      	for (let e in r) r[e] !== void 0 && (t[e] = r[e]);
      	return t;
      }
      function B(n, r, t, e, s) {
      	let o = r.defaultVariants ?? {};
      	return Object.assign(n, {
      		__cva__: !s,
      		variantKeys: t,
      		variantMap: e,
      		...s && { classNameMap: s },
      		config: r,
      		getVariantProps: (a = {}) => C(o, a),
      		splitVariantProps: (a) => {
      			let u = {}, i = {};
      			for (let l in a) (t.includes(l) ? u : i)[l] = a[l];
      			return [u, i];
      		}
      	});
      }
      //#endregion
      //#region entry.tsx
      const button = /* @__PURE__ */ B((p = {}) => {
      	p ??= {};
      	const _p0 = p["rounded"];
      	return V("bg_red", { true: "bdr_xl" }[_p0 === void 0 ? void 0 : _p0]);
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
