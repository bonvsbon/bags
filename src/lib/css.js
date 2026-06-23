// Parse a CSS declaration string ("color:red;font-size:14px") into a React
// style object. Lets us reuse the design's exact inline-style strings (and the
// computed style strings from the state model) verbatim, with zero re-typing.
const cache = new Map();

export function css(str) {
  if (!str) return undefined;
  if (typeof str !== 'string') return str; // already an object
  if (cache.has(str)) return cache.get(str);

  const out = {};
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop) continue;
    if (prop.startsWith('--')) {
      out[prop] = value; // CSS custom property — keep as-is
    } else {
      out[camel(prop)] = value;
    }
  }
  cache.set(str, out);
  return out;
}

function camel(prop) {
  // -webkit-foo -> WebkitFoo ; border-radius -> borderRadius
  return prop
    .replace(/^-ms-/, 'ms-')
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
