/**
 * Compact runtime helpers injected into files that contain inlined cva/sva calls.
 *
 * __cva(base, variants, defaultVariants, compoundVariants)
 *   - base: string (pre-resolved className)
 *   - variants: { [key]: { [value]: className } }
 *   - defaultVariants: { [key]: value } | null
 *   - compoundVariants: [[conditions, className], ...] | null
 *
 * Returns a function with __cva__, variantMap, variantKeys, splitVariantProps.
 *
 * __sva(slots, variantMap)
 *   - slots: { [slotName]: cvaFn }
 *   - variantMap: { [key]: [values] }
 *
 * Returns a function with __cva__=false, variantMap, variantKeys, splitVariantProps.
 */

// The helpers are emitted as a string to be prepended to transformed source files.
// Uses `var` for compatibility and to avoid TDZ issues.
// Includes property-aware className dedup so variant classNames correctly override base.

export const CVA_HELPER_ID = '__cva'
export const SVA_HELPER_ID = '__sva'

export const CVA_HELPER = `var ${CVA_HELPER_ID} = function(b, v, d, cv) {
  var fn = function(p) {
    p = p || {};
    var m = d ? Object.assign({}, d, p) : p;
    var r = b ? b.split(" ") : [];
    for (var k in v) if (m[k] != null && v[k][m[k]]) r = r.concat(v[k][m[k]].split(" "));
    if (cv) for (var i = 0; i < cv.length; i++) {
      var c = cv[i], ok = true;
      for (var j in c[0]) if (m[j] !== c[0][j]) { ok = false; break; }
      if (ok) r = r.concat(c[1].split(" "));
    }
    var seen = {}, out = [];
    for (var i = r.length - 1; i >= 0; i--) {
      var x = r[i], u = x.indexOf("_");
      var key = u >= 0 ? x.substring(0, u + 1) : x;
      if (!seen[key]) { seen[key] = 1; out.unshift(x); }
    }
    return out.join(" ");
  };
  fn.__cva__ = true;
  fn.variantMap = {};
  fn.variantKeys = Object.keys(v || {});
  for (var k in v) fn.variantMap[k] = Object.keys(v[k]);
  fn.splitVariantProps = function(p) {
    var a = {}, b = {};
    for (var k in p) (v && k in v ? a : b)[k] = p[k];
    return [a, b];
  };
  return fn;
};\n`

export const SVA_HELPER = `var ${SVA_HELPER_ID} = function(s, vm) {
  var fn = function(p) {
    var r = {};
    for (var k in s) r[k] = s[k](p);
    return r;
  };
  fn.__cva__ = false;
  fn.variantMap = vm;
  fn.variantKeys = Object.keys(vm || {});
  fn.splitVariantProps = function(p) {
    var a = {}, b = {};
    for (var k in p) (vm && k in vm ? a : b)[k] = p[k];
    return [a, b];
  };
  return fn;
};\n`
