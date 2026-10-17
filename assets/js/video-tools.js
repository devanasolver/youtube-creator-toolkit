(function(){
"use strict";
function $(id){return document.getElementById(id);}
function status(id,text,error){var el=$(id);el.hidden=false;el.textContent=text;el.className="status"+(error?" err":" ok");}
var cache=new Map();
async function lookup(input){
  var p=AppLink.parse(input);if(!p||(p.kind!=="video"&&p.kind!=="shorts"))throw new Error("Enter a YouTube video or Shorts link, not a channel or playlist.");
  if(cache.has(p.id))return cache.get(p.id);
  var ctl=new AbortController(),timer=setTimeout(function(){ctl.abort();},20000);
  try{
    var r=await fetch("https://yt-transcript-proxy.pages.dev/api/video?v="+p.id,{signal:ctl.signal}),j=await r.json();
    if(!r.ok||j.videoId!==p.id)throw new Error(j.message||"Public video data is unavailable. Try again later.");
    cache.set(p.id,j);return j;
  }catch(e){if(e.name==="AbortError")throw new Error("The lookup timed out. Try again later.");throw e;}
  finally{clearTimeout(timer);}
}
function number(v){return typeof v==="number"?v.toLocaleString():"Unavailable";}
function duration(n){if(typeof n!=="number")return "Unavailable";var s=n%60,m=Math.floor(n/60)%60,h=Math.floor(n/3600);return (h?h+":"+String(m).padStart(2,"0"):m)+":"+String(s).padStart(2,"0");}
function cards(data){
  var el=$("videoStatsCards");el.textContent="";
  var date=data.published?String(data.published).slice(0,10):"Unavailable";
  var values=[["Public views",number(data.views)],["Public likes",number(data.likes)],["Like / view rate",typeof data.likes==="number"&&data.views>0?(100*data.likes/data.views).toFixed(2)+"%":"Unavailable"],["Duration",data.isLive?"Live now":duration(data.durationSeconds)],["Published",date],["Exposed tags",(data.tags||[]).length.toLocaleString()]];
  values.forEach(function(pair){var box=document.createElement("div"),b=document.createElement("b"),span=document.createElement("span");box.className="stat";b.textContent=pair[1];span.textContent=pair[0];box.append(b,span);el.appendChild(box);});
}
var jobs={videoStats:0,tagExtract:0};
function bind(prefix,form){
  $(form).addEventListener("submit",async function(e){
    e.preventDefault();var seq=++jobs[prefix],btn=$(prefix+"Go");btn.disabled=true;$(prefix+"Result").hidden=true;status(prefix+"Status","Reading public video metadata...");
    try{
      var j=await lookup($(prefix+"Input").value);if(seq!==jobs[prefix])return;
      var a=$(prefix+"Title");a.textContent=j.title||j.videoId;a.href=j.url;
      if(prefix==="videoStats"){
        $("videoStatsChannel").textContent="Channel: "+(j.channel||"Unavailable");cards(j);
        $("videoStatsNote").textContent="Snapshot from public metadata. Missing fields are shown as unavailable, not estimated.";
      }else{
        var tags=j.tags||[],cloud=$("tagExtractCloud");cloud.textContent="";
        tags.forEach(function(t){var el=document.createElement("span");el.className="tag";el.textContent=t;cloud.appendChild(el);});
        $("tagExtractOutput").value=tags.join(", ");$("tagExtractCopy").disabled=!tags.length;$("tagExtractSave").disabled=!tags.length;
      }
      $(prefix+"Result").hidden=false;status(prefix+"Status",prefix==="tagExtract"?((j.tags||[]).length?(j.tags.length+" tags found."):"This video exposes no keyword tags. None were invented."):"Public video data loaded.");
    }catch(err){if(seq===jobs[prefix])status(prefix+"Status",err.message||"The lookup failed. Try again later.",true);}
    finally{if(seq===jobs[prefix])btn.disabled=false;}
  });
  $(prefix+"Input").addEventListener("input",function(){jobs[prefix]++;$(prefix+"Result").hidden=true;$(prefix+"Status").hidden=true;$(prefix+"Go").disabled=false;});
}
bind("videoStats","videoStatsForm");bind("tagExtract","tagExtractForm");
$("tagExtractCopy").addEventListener("click",async function(){var btn=this;try{await navigator.clipboard.writeText($("tagExtractOutput").value);btn.textContent="Copied";}catch(e){$("tagExtractOutput").select();btn.textContent=document.execCommand("copy")?"Copied":"Select and copy the tags";}setTimeout(function(){btn.textContent="Copy tags";},1800);});
$("tagExtractSave").addEventListener("click",function(){var blob=new Blob([$("tagExtractOutput").value],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="youtube-video-tags.txt";a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);});
})();
