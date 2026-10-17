// Public metadata only. This is not YouTube Studio or a private analytics API.
import { cors, json } from './_util.js';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
export function readPlayer(html){
  const marker=/ytInitialPlayerResponse\s*=\s*/g;let m;
  while((m=marker.exec(html))){
    let start=m.index+m[0].length;
    if(html[start]!=='{')continue;
    let depth=0,quoted=false,escaped=false;
    for(let i=start;i<html.length;i++){
      const ch=html[i];
      if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}
      else if(ch==='"')quoted=true;
      else if(ch==='{')depth++;
      else if(ch==='}'&&--depth===0){try{return JSON.parse(html.slice(start,i+1));}catch(e){break;}}
    }
  }
  return null;
}
export function metadata(player,id){
  const d=player?.videoDetails,m=player?.microformat?.playerMicroformatRenderer||{};
  if(!d||d.videoId!==id)return null;
  function number(v){return /^\d+$/.test(String(v??''))&&Number.isSafeInteger(Number(v))?Number(v):null;}
  return {videoId:id,url:'https://www.youtube.com/watch?v='+id,title:d.title||'',channel:d.author||'',channelId:/^UC[\w-]{22}$/.test(d.channelId||'')?d.channelId:null,
    views:number(d.viewCount),likes:number(m.likeCount),durationSeconds:number(d.lengthSeconds),published:m.publishDate||m.uploadDate||null,
    tags:Array.isArray(d.keywords)?d.keywords.filter(t=>typeof t==='string'):[],isLive:!!d.isLive,category:m.category||null};
}
export async function onRequest({request}){
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='GET')return json(request,{error:'method',message:'Use GET.'},405);
  const id=new URL(request.url).searchParams.get('v')||'';
  if(!/^[\w-]{11}$/.test(id))return json(request,{error:'bad_input',message:'Enter a valid YouTube video link.'},400);
  const control=new AbortController(),timer=setTimeout(()=>control.abort(),15000);
  try{
    const r=await fetch('https://www.youtube.com/watch?v='+id,{headers:{'User-Agent':UA,'Accept-Language':'en',Cookie:'CONSENT=YES+1'},signal:control.signal});
    if(!r.ok)return json(request,{error:'upstream',message:'YouTube is not returning public video data right now. Try again later.'},502);
    const data=metadata(readPlayer(await r.text()),id);
    if(!data)return json(request,{error:'unavailable',message:'Public metadata is unavailable for this video. It may be private, removed, restricted, or blocked by YouTube.'},404);
    return json(request,data,200,600);
  }catch(e){return json(request,{error:'upstream',message:'YouTube could not be reached. Try again later.'},502);}
  finally{clearTimeout(timer);}
}
