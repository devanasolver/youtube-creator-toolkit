// Creator Toolkit transcript proxy (Cloudflare Pages Function, free tier).
// GET /api/transcript?v=VIDEO_ID[&lang=xx]  ->  JSON with caption cues.
// Reads only public caption data that YouTube already serves to anyone watching the video.
import { cors, json, decode } from './_util.js';
const CLIENTS = [
  { name: 'ANDROID', version: '20.10.38', ua: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip', extra: { androidSdkVersion: 34 } },
  { name: 'ANDROID_VR', version: '1.62.27', ua: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip', extra: { androidSdkVersion: 32, deviceMake: 'Oculus', deviceModel: 'Quest 3', osName: 'Android', osVersion: '12L' } },
  { name: 'IOS', version: '20.10.4', ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)', extra: { deviceModel: 'iPhone16,2', osName: 'iPhone', osVersion: '18.3.2.22D82' } }
];

function parseTimedText(xml) {
  const cues = [];
  const re = /<p\s+t="(\d+)"(?:\s+d="(\d+)")?[^>]*>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(xml))) {
    const text = decode(decode(m[3].replace(/<[^>]+>/g, ''))).replace(/\s*\n\s*/g, ' ').trim();
    if (text) cues.push({ start: +m[1] / 1000, dur: m[2] ? +m[2] / 1000 : 0, text });
  }
  if (!cues.length) { // older format
    const re2 = /<text\s+start="([\d.]+)"(?:\s+dur="([\d.]+)")?[^>]*>([\s\S]*?)<\/text>/g;
    while ((m = re2.exec(xml))) {
      const text = decode(decode(m[3])).replace(/\s*\n\s*/g, ' ').trim();
      if (text) cues.push({ start: +m[1], dur: m[2] ? +m[2] : 0, text });
    }
  }
  return cues;
}
async function player(id, c, vd) {
  const r = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': c.ua, ...(vd ? { 'X-Goog-Visitor-Id': vd } : {}) },
    body: JSON.stringify({ context: { client: { clientName: c.name, clientVersion: c.version, hl: 'en', ...(vd ? { visitorData: vd } : {}), ...c.extra }, ...(c.embed ? { thirdParty: { embedUrl: 'https://www.youtube.com/watch?v=' + id } } : {}) }, videoId: id, contentCheckOk: true, racyCheckOk: true })
  });
  if (!r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  const url = new URL(request.url);
  const id = url.searchParams.get('v') || '';
  const lang = url.searchParams.get('lang') || '';
  if (!/^[\w-]{11}$/.test(id)) return json(request, { error: 'bad_id', message: 'That does not look like a valid YouTube video ID.' }, 400);

  let data = null, status = ''; const tried = []; let vdata = '';
  for (let i = 0; i < 4 && status !== 'OK'; i++) {
    const d = await player(id, CLIENTS[i % CLIENTS.length], vdata);
    if (!d) continue;
    vdata = vdata || (d.responseContext && d.responseContext.visitorData) || '';
    data = d; status = d.playabilityStatus && d.playabilityStatus.status; tried.push(CLIENTS[i % CLIENTS.length].name + ':' + status);
    const reason = (d.playabilityStatus && d.playabilityStatus.reason) || '';
    if (status !== 'OK' && /private|removed|terminated|copyright|does not exist|not available in your country/i.test(reason)) break; // real answer (private, removed), no point retrying
  }
  if (!data) return json(request, { error: 'upstream', message: 'YouTube did not answer. Try again in a minute.' }, 502);
  if (status !== 'OK') {
    const reason = (data.playabilityStatus && data.playabilityStatus.reason) || 'This video is not available.';
    const bot = !/private|removed|terminated|copyright|does not exist|not available/i.test(reason) && status !== 'ERROR';
    return json(request, { debug: tried, reason, error: bot ? 'blocked' : 'unavailable', message: bot ? 'YouTube asked for a sign-in check, so the transcript could not be read right now. Try again later.' : 'This video is unavailable: ' + reason }, bot ? 503 : 404);
  }
  const vd = data.videoDetails || {};
  const tl = data.captions && data.captions.playerCaptionsTracklistRenderer;
  const raw = (tl && tl.captionTracks) || [];
  const base = { debug: tried, videoId: id, title: vd.title || '', author: vd.author || '', lengthSeconds: +vd.lengthSeconds || 0 };
  if (!raw.length) return json(request, { ...base, error: 'no_captions', tracks: [], message: 'This video has no captions or transcript available. The creator has not added any and YouTube has not generated automatic ones.' }, 200, 1800);
  const tracks = raw.map(t => ({ lang: t.languageCode, name: (t.name && (t.name.simpleText || (t.name.runs || []).map(r => r.text).join(''))) || t.languageCode, auto: t.kind === 'asr' }));
  let idx = -1;
  if (lang) { const asked = raw.map(t => t.languageCode + (t.kind === 'asr' ? ':asr' : '')); idx = asked.indexOf(lang); if (idx < 0) idx = raw.findIndex(t => t.languageCode === lang); }
  if (idx < 0) idx = raw.findIndex(t => t.kind !== 'asr' && /^en/.test(t.languageCode));
  if (idx < 0) idx = raw.findIndex(t => t.kind !== 'asr');
  if (idx < 0) idx = 0;
  const tu = new URL(raw[idx].baseUrl);
  tu.searchParams.delete('fmt');
  const r = await fetch(tu.toString(), { headers: { 'User-Agent': CLIENTS[0].ua } });
  const xml = r.ok ? await r.text() : '';
  const cues = parseTimedText(xml);
  if (!cues.length) return json(request, { ...base, error: 'empty', tracks, message: 'Captions are listed for this video but YouTube returned no text for them. Try again, or pick another language.' }, 502);
  return json(request, { ...base, tracks, selected: { ...tracks[idx], index: idx }, cues }, 200, 3600);
}
