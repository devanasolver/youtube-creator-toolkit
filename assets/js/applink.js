/* Shared YouTube link parsing and app deep-link building.
   Used by the App Link Maker tool, the Subscribe Link Generator and the /open/ redirect page.
   No dependencies; also loadable in Node for tests (module.exports). */
(function(root,factory){
  var api=factory();
  root.AppLink=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof self!=="undefined"?self:this,function(){
"use strict";

var VID="[a-zA-Z0-9_-]{11}";
var VID_RE=new RegExp("^"+VID+"$");
var PL_RE=/^[a-zA-Z0-9_-]{10,60}$/;
var UC_RE=/^UC[\w-]{22}$/;
var HANDLE_RE=/^@[\p{L}\p{M}\p{N}_.\-\u00b7]{1,40}$/u;

/* Parse any YouTube-ish input into {kind, id, ...} or null.
   kind: "video" | "shorts" | "playlist" | "channel"
   video:   {kind,id,t,list}
   shorts:  {kind,id}
   playlist:{kind,id}
   channel: {kind,id,by}  by: "id" (UC...) | "handle" (@name) | "legacy" (/c/ or /user/ name) */
function parse(input){
  input=(input||"").trim();
  if(!input)return null;
  if(VID_RE.test(input))return {kind:"video",id:input};
  if(UC_RE.test(input))return {kind:"channel",id:input,by:"id"};
  if(HANDLE_RE.test(input))return {kind:"channel",id:input,by:"handle"};

  var url=input;
  if(!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(url))url="https://"+url;
  var u;
  try{u=new URL(url);}catch(e){return null;}
  var host=u.hostname.toLowerCase().replace(/^www\.|^m\.|^music\./,"");
  if(!/^https?:$/.test(u.protocol)||u.username||u.password||u.port)return null;
  var path=u.pathname, m;

  if(host==="youtu.be"){
    m=path.match(new RegExp("^/("+VID+")(?:/|$)"));
    if(m)return {kind:"video",id:m[1],t:u.searchParams.get("t")||u.searchParams.get("start")||undefined};
    return null;
  }
  if(host==="youtube-nocookie.com"||host==="youtube.com"){
    m=path.match(new RegExp("^/(?:shorts|embed|live|v)/("+VID+")(?:/|$)"));
    if(m){
      var k=path.indexOf("/shorts/")===0?"shorts":"video";
      var r={kind:k,id:m[1]};
      var t2=u.searchParams.get("t")||u.searchParams.get("start");
      if(t2)r.t=t2;
      return r;
    }
    m=path.match(/^\/watch\/?$/);
    if(m){
      var v=u.searchParams.get("v");
      if(VID_RE.test(v||"")){
        var r2={kind:"video",id:v};
        var t3=u.searchParams.get("t")||u.searchParams.get("start");
        if(t3)r2.t=t3;
        var list=u.searchParams.get("list");
        if(list&&PL_RE.test(list))r2.list=list;
        return r2;
      }
      /* /watch without v falls through to null */
      return null;
    }
    if(/^\/playlist\/?$/.test(path)){
      var pl=u.searchParams.get("list");
      if(pl&&PL_RE.test(pl))return {kind:"playlist",id:pl};
      return null;
    }
    m=path.match(/^\/channel\/(UC[\w-]{22})(?:\/|$)/);if(m)return {kind:"channel",id:m[1],by:"id"};
    if(path.indexOf("/@")===0){
      var handle;try{handle=decodeURIComponent(path.split("/")[1]);}catch(e){return null;}
      if(HANDLE_RE.test(handle))return {kind:"channel",id:handle,by:"handle"};
    }
    m=path.match(/^\/(?:c|user)\/([\w.\-]{2,40})(?:[/?]|$)/);if(m)return {kind:"channel",id:m[1],by:"legacy",prefix:path.split("/")[1]};
  }
  return null;
}

function cleanT(t){
  if(!t)return undefined;
  t=String(t).trim();
  if(!/^(\d+[hms]?)+$/.test(t)&&!/^\d+$/.test(t))return undefined;
  return t;
}

/* Canonical web URL that always works, app or not. */
function webUrl(p){
  if(!p)return null;
  switch(p.kind){
    case "video":{
      var u="https://www.youtube.com/watch?v="+p.id;
      var t=cleanT(p.t);if(t)u+="&t="+encodeURIComponent(t);
      if(p.list)u+="&list="+encodeURIComponent(p.list);
      return u;
    }
    case "shorts":  return "https://www.youtube.com/shorts/"+p.id;
    case "playlist":return "https://www.youtube.com/playlist?list="+encodeURIComponent(p.id);
    case "channel":
      if(p.by==="id")return "https://www.youtube.com/channel/"+p.id;
      if(p.by==="handle")return "https://www.youtube.com/"+encodeURI(p.id);
      return "https://www.youtube.com/"+(p.prefix==="user"?"user":"c")+"/"+p.id;
  }
  return null;
}

/* Path + query that the YouTube app understands on both platforms. */
function appPath(p){
  if(!p)return null;
  switch(p.kind){
    case "video":{
      var q="watch?v="+p.id;
      var t=cleanT(p.t);if(t)q+="&t="+encodeURIComponent(t);
      if(p.list)q+="&list="+encodeURIComponent(p.list);
      return q;
    }
    case "shorts":  return "shorts/"+p.id;
    case "playlist":return "playlist?list="+encodeURIComponent(p.id);
    case "channel":
      if(p.by==="id")return "channel/"+p.id;
      return p.by==="handle"?encodeURI(p.id):(p.prefix==="user"?"user/":"c/")+p.id;
  }
  return null;
}

/* Best-effort iOS scheme candidates. youtube:// preserves the destination
   path; the alternate vnd.youtube://ID retries videos in older clients. */
function iosDeepLinks(p){
  if(!p)return [];
  var first="youtube://www.youtube.com/"+appPath(p);
  return p.kind==="video"||p.kind==="shorts"?[first,"vnd.youtube://"+p.id]:[first];
}

/* Compact share format. The destination stays in the fragment, not server logs. */
function pack(p){
  var q=new URLSearchParams();
  var key=p.kind==="video"?"v":p.kind==="shorts"?"s":p.kind==="playlist"?"p":p.by==="id"?"c":p.by==="handle"?"h":p.prefix==="user"?"u":"n";
  q.set(key,p.id);if(p.kind==="video"){if(cleanT(p.t))q.set("t",cleanT(p.t));if(p.list&&PL_RE.test(p.list))q.set("list",p.list);}
  return q.toString();
}
function unpack(text){
  var q=new URLSearchParams(text.replace(/^[#?]/,"")),keys=["v","s","p","c","h","u","n"].filter(function(k){return q.has(k);});
  if(keys.length!==1)return null;
  var k=keys[0],id=q.get(k),p;
  if(k==="v"||k==="s")p=VID_RE.test(id)?{kind:k==="v"?"video":"shorts",id:id}:null;
  else if(k==="p")p=PL_RE.test(id)?{kind:"playlist",id:id}:null;
  else if(k==="c")p=UC_RE.test(id)?{kind:"channel",id:id,by:"id"}:null;
  else if(k==="h")p=HANDLE_RE.test(id)?{kind:"channel",id:id,by:"handle"}:null;
  else p=parse("https://www.youtube.com/"+(k==="u"?"user":"c")+"/"+id);
  if(p&&p.kind==="video"){if(cleanT(q.get("t")))p.t=cleanT(q.get("t"));if(PL_RE.test(q.get("list")||""))p.list=q.get("list");}
  return p;
}

/* Android intent:// URL. Forces package com.google.android.youtube with
   browser_fallback_url back to the normal web URL if the app is missing. */
function androidIntent(p){
  var web=webUrl(p),ap=appPath(p);
  if(!web||!ap)return null;
  var host="www.youtube.com";
  var fallback=encodeURIComponent(web);
  return "intent://"+host+"/"+ap+"#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url="+fallback+";end";
}

function platform(ua){
  ua=(ua||"").toLowerCase();
  if(/android/.test(ua))return "android";
  if(/iphone|ipad|ipod/.test(ua))return "ios";
  return "desktop";
}

/* Best-effort detection of an in-app browser (webview), for honest messaging. */
function inAppBrowser(ua){
  ua=ua||"";
  var m;
  if(/instagram/i.test(ua))return "Instagram";
  if(/tiktok|musical_ly|bytedance/i.test(ua))return "TikTok";
  m=ua.match(/FBAN\/|FBAV\//i);if(m)return "Facebook";
  if(/\bThreads\b/i.test(ua))return "Threads";
  if(/twitter/i.test(ua))return "X (Twitter)";
  if(/\bLine\//i.test(ua))return "LINE";
  if(/snapchat/i.test(ua))return "Snapchat";
  if(/linkedinapp/i.test(ua))return "LinkedIn";
  if(/whatsapp/i.test(ua))return "WhatsApp";
  if(/; wv\)/.test(ua))return "an Android WebView app";
  return null;
}

return {
  parse:parse,webUrl:webUrl,appPath:appPath,pack:pack,unpack:unpack,
  iosDeepLinks:iosDeepLinks,androidIntent:androidIntent,
  platform:platform,inAppBrowser:inAppBrowser
};
});
