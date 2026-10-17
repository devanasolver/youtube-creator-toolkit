/* Run: node tests/video-metadata.test.mjs */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=new URL('../proxy/functions/api/',import.meta.url);
const util='data:text/javascript,'+encodeURIComponent(fs.readFileSync(new URL('_util.js',base),'utf8'));
const src=fs.readFileSync(new URL('video.js',base),'utf8').replace("'./_util.js'",JSON.stringify(util));
const {readPlayer,metadata,onRequest}=await import('data:text/javascript,'+encodeURIComponent(src));
const id='dQw4w9WgXcQ';
const player={videoDetails:{videoId:id,title:'A "quote" and } brace',author:'Creator',channelId:'UCuAXFkgsw1L7xaCfnd5JJOw',viewCount:'1000',lengthSeconds:'60',keywords:['one','two','<b>not HTML</b>']},microformat:{playerMicroformatRenderer:{likeCount:'20',publishDate:'2026-10-17'}}};
assert.deepEqual(readPlayer('<script>var ytInitialPlayerResponse = '+JSON.stringify(player)+';</script>'),player);
assert.equal(readPlayer('no metadata'),null);assert.equal(metadata(player,'abcdefghijk'),null);
const data=metadata(player,id);assert.equal(data.views,1000);assert.equal(data.likes,20);assert.equal(data.tags.length,3);
assert.equal(metadata({videoDetails:{videoId:id}},id).views,null);assert.deepEqual(metadata({videoDetails:{videoId:id}},id).tags,[]);
assert.equal(metadata({videoDetails:{videoId:id,viewCount:'0'}},id).views,0);
const req=(url,method='GET')=>({request:new Request(url,{method,headers:{Origin:'http://localhost:8000'}})});
assert.equal((await onRequest(req('https://proxy.test/api/video?v=bad'))).status,400);
assert.equal((await onRequest(req('https://proxy.test/api/video?v='+id,'POST'))).status,405);
assert.equal((await onRequest(req('https://proxy.test/api/video','OPTIONS'))).status,204);
const oldFetch=globalThis.fetch;
try{
 globalThis.fetch=async()=>new Response('<script>ytInitialPlayerResponse='+JSON.stringify(player)+';</script>');
 const good=await onRequest(req('https://proxy.test/api/video?v='+id));assert.equal(good.status,200);assert.equal((await good.json()).likes,20);assert.equal(good.headers.get('Access-Control-Allow-Origin'),'http://localhost:8000');
 globalThis.fetch=async()=>new Response('unavailable');assert.equal((await onRequest(req('https://proxy.test/api/video?v='+id))).status,404);
 globalThis.fetch=async()=>new Response('blocked',{status:429});assert.equal((await onRequest(req('https://proxy.test/api/video?v='+id))).status,502);
 globalThis.fetch=async()=>{throw new Error('network');};assert.equal((await onRequest(req('https://proxy.test/api/video?v='+id))).status,502);
}finally{globalThis.fetch=oldFetch;}
console.log('Video metadata parsing, missing fields, zero counts, safe errors, CORS and upstream handling passed');
