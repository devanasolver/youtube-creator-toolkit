// GET /api/channel?q=@handle | channel URL | UC... id  -> public channel info + recent uploads (from the public RSS feed)
import { cors, json, decode } from './_util.js';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
async function page(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en', Cookie: 'CONSENT=YES+1' }, redirect: 'follow' });
  return r.ok ? r.text() : '';
}
export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  let q = (new URL(request.url).searchParams.get('q') || '').trim();
  if (!q) return json(request, { error: 'empty', message: 'Enter a channel link, @handle or channel ID.' }, 400);
  let id = (q.match(/(UC[\w-]{22})/) || [])[1];
  let html = '';
  if (!id) {
    let handle = (q.match(/youtube\.com\/(@[\w.\-%]+)/) || q.match(/^(@[\w.\-%]+)$/) || [])[1];
    if (!handle && /^[\w.\-]{3,40}$/.test(q)) handle = '@' + q;
    if (!handle) return json(request, { error: 'bad_input', message: 'Use a channel link like youtube.com/@name, an @handle, or a channel ID starting with UC.' }, 400);
    html = await page('https://www.youtube.com/' + handle);
    id = (html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) || [])[1];
    if (!id) return json(request, { error: 'not_found', message: 'Could not find that channel. Check the handle, or paste the channel link.' }, 404);
  } else html = await page('https://www.youtube.com/channel/' + id);
  const r = await fetch('https://www.youtube.com/feeds/videos.xml?channel_id=' + id, { headers: { 'User-Agent': UA } });
  if (!r.ok) return json(request, { error: 'not_found', message: 'YouTube returned no public feed for that channel.' }, 404);
  const xml = await r.text();
  const name = decode(((xml.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '').trim());
  const videos = [];
  const re = /<entry>([\s\S]*?)<\/entry>/g; let m;
  while ((m = re.exec(xml))) {
    const e = m[1];
    videos.push({
      id: (e.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1],
      title: decode((e.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
      published: (e.match(/<published>(.*?)<\/published>/) || [])[1],
      views: +((e.match(/statistics views="(\d+)"/) || [])[1] || 0),
      likes: +((e.match(/starRating count="(\d+)"/) || [])[1] || 0),
      short: /\/shorts\//.test((e.match(/<link rel="alternate" href="([^"]*)"/) || [])[1] || '')
    });
  }
  const subs = (html.match(/⁩ • ⁨([\d.,]+[KMB]?) subscribers/) || [])[1] || null;
  return json(request, { channelId: id, name, url: 'https://www.youtube.com/channel/' + id, subscribers: subs, videos }, 200, 600);
}
