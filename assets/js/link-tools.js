(function(){
"use strict";
function $(id){return document.getElementById(id);}
function status(id,text,error){var el=$(id);el.hidden=false;el.textContent=text;el.className="status"+(error?" err":" ok");}
function copy(text,btn){
  function done(ok){btn.textContent=ok?"Copied":"Select the link and copy";setTimeout(function(){btn.textContent="Copy link";},1800);}
  function fallback(){var field=document.createElement("textarea");field.value=text;document.body.appendChild(field);field.select();var ok=false;try{ok=document.execCommand("copy");}catch(e){}field.remove();done(ok);}
  if(navigator.clipboard)navigator.clipboard.writeText(text).then(function(){done(true);},fallback);else fallback();
}
function qr(text,id){
  var code=qrcodegen.QrCode.encodeText(text,qrcodegen.QrCode.Ecc.MEDIUM),canvas=$(id),scale=6,border=4;
  canvas.width=canvas.height=(code.size+border*2)*scale;
  var ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#000";
  for(var y=0;y<code.size;y++)for(var x=0;x<code.size;x++)if(code.getModule(x,y))ctx.fillRect((x+border)*scale,(y+border)*scale,scale,scale);
}
function saveQR(id,name){var a=document.createElement("a");a.href=$(id).toDataURL("image/png");a.download=name+".png";a.click();}
function output(prefix,url){$(prefix+"Output").value=url;$(prefix+"Test").href=url;qr(url,prefix+"QR");$(prefix+"Result").hidden=false;}
$("appLinkForm").addEventListener("submit",function(e){
  e.preventDefault();$("appLinkResult").hidden=true;
  var p=AppLink.parse($("appLinkInput").value);
  if(!p){status("appLinkStatus","Enter a valid YouTube video, Shorts, playlist or channel URL.",true);return;}
  var url=new URL("open/",location.href);url.search="";url.hash=AppLink.pack(p);
  output("appLink",url.href);
  $("appLinkDestination").href=AppLink.webUrl(p);$("appLinkDestination").textContent=AppLink.webUrl(p);
  status("appLinkStatus","Your link is ready. Test it on your phone before sharing.");
});
$("appLinkCopy").addEventListener("click",function(){copy($("appLinkOutput").value,this);});
$("appLinkQRSave").addEventListener("click",function(){saveQR("appLinkQR","youtube-app-link");});
var request=0;
$("subscribeForm").addEventListener("submit",async function(e){
  e.preventDefault();var seq=++request,p=AppLink.parse($("subscribeInput").value),btn=$("subscribeMake");
  $("subscribeResult").hidden=true;
  if(!p||p.kind!=="channel"){status("subscribeStatus","Enter a channel URL, @handle or UC channel ID, not a video or playlist.",true);return;}
  if(p.by==="legacy"){status("subscribeStatus","For this older channel URL, paste the channel's current @handle or UC channel ID instead.",true);return;}
  btn.disabled=true;
  try{
    var name=p.id,id=p.id;
    if(p.by!=="id"){
      status("subscribeStatus","Finding the channel ID...");
      var control=new AbortController(),timer=setTimeout(function(){control.abort();},18000);
      var r,j;try{r=await fetch("https://yt-transcript-proxy.pages.dev/api/channel?q="+encodeURIComponent(AppLink.webUrl(p)),{signal:control.signal});j=await r.json();}finally{clearTimeout(timer);}
      if(!r.ok||!/^UC[\w-]{22}$/.test(j.channelId||""))throw new Error("Could not resolve this handle. Check it or paste the channel's UC ID instead.");
      id=j.channelId;name=j.name||id;
    }
    if(seq!==request)return;
    output("subscribe","https://www.youtube.com/channel/"+id+"?sub_confirmation=1");
    $("subscribeChannel").textContent="Channel: "+name+" ("+id+")";
    status("subscribeStatus","Your subscribe link is ready. YouTube controls whether the confirmation appears.");
  }catch(err){if(seq===request)status("subscribeStatus",err.name==="AbortError"?"The channel lookup timed out. Try again or paste the UC channel ID.":err.message||"Channel lookup failed. Try a UC channel ID.",true);}
  finally{if(seq===request)btn.disabled=false;}
});
$("subscribeCopy").addEventListener("click",function(){copy($("subscribeOutput").value,this);});
$("subscribeQRSave").addEventListener("click",function(){saveQR("subscribeQR","youtube-subscribe-link");});
/* Never leave a stale result copyable after the input changes. */
$("appLinkInput").addEventListener("input",function(){$("appLinkResult").hidden=true;$("appLinkStatus").hidden=true;});
$("subscribeInput").addEventListener("input",function(){request++;$("subscribeResult").hidden=true;$("subscribeStatus").hidden=true;$("subscribeMake").disabled=false;});
})();
