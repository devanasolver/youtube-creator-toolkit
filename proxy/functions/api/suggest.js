// GET /api/suggest?q=...  -> YouTube search autocomplete (the same suggestions the YouTube search box shows)
import { cors, json } from './_util.js';
export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 100);
  if (!q) return json(request, { error: 'empty', suggestions: [] }, 400);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch('https://suggestqueries.google.com/complete/search?client=' + (i === 1 ? 'youtube&jsonp=x' : 'firefox') + '&ds=yt&hl=en&q=' + encodeURIComponent(q), { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36' } });
      let t = await r.text();
      if (i === 1) t = t.replace(/^[^(]*\(/, '').replace(/\)\s*$/, '');
      const d = JSON.parse(t);
      const list = (d[1] || []).map(x => Array.isArray(x) ? x[0] : x).filter(x => typeof x === 'string');
      return json(request, { q, suggestions: list }, 200, 3600);
    } catch (e) { /* try again */ }
  }
  return json(request, { error: 'upstream', message: 'Suggestions are unavailable right now.', suggestions: [] }, 502);
}
