export const ALLOWED = ['https://devanasolver.github.io', 'http://localhost:8000', 'http://127.0.0.1:8000'];
export function cors(req, cache) {
  const o = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Origin': ALLOWED.includes(o) ? o : ALLOWED[0],
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': cache ? 'public, max-age=' + cache : 'no-store'
  };
}
export function json(req, body, status = 200, cache = 0) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req, cache) } });
}
export function decode(s) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
