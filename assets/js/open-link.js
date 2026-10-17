(function(){
"use strict";
function $(id){return document.getElementById(id);}
var root=document.documentElement,saved;
try{saved=localStorage.getItem("ct-theme");}catch(e){}
if(saved==="light"||saved==="dark")root.dataset.theme=saved;
else if(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches)root.dataset.theme="light";
$("themeToggle").addEventListener("click",function(){var next=root.dataset.theme==="light"?"dark":"light";root.dataset.theme=next;try{localStorage.setItem("ct-theme",next);}catch(e){}});
var timer=null,tick=null,opened=false,stopped=false;
function stop(){clearTimeout(timer);clearInterval(tick);timer=null;tick=null;}
function navigate(url){location.replace(url);}
function init(){
  stop();opened=false;stopped=false;
  var p=AppLink.unpack(location.hash||location.search);
  if(!p){$("openContent").hidden=true;$("openTitle").textContent="This link is incomplete";$("openMessage").textContent="Ask the sender for a fresh app link or the original YouTube URL. No redirect was attempted.";return;}
  var web=AppLink.webUrl(p),plat=AppLink.platform(navigator.userAgent),inApp=AppLink.inAppBrowser(navigator.userAgent);
  var ios=AppLink.iosDeepLinks(p),deep=plat==="android"?AppLink.androidIntent(p):plat==="ios"?ios[0]:web;
  $("openTitle").textContent="Open in YouTube";$("openContent").hidden=false;$("openDestination").textContent=web;$("openWeb").href=web;$("openApp").href=deep;
  $("openHelp").open=!!inApp;$("openAlt").hidden=plat!=="ios"||ios.length<2;$("openStay").hidden=false;
  $("openMessage").textContent=inApp?"You're in "+inApp+". App opens may be blocked. Tap the button or use the browser menu below.":plat==="desktop"?"Taking you to YouTube's website...":"Trying to open YouTube. If nothing happens, tap the button below.";
  function fallback(){
    stop();if(!opened&&!stopped&&!document.hidden)navigate(web);
  }
  function arm(){
    stop();if(stopped)return;
    var seconds=inApp?8:4;
    $("openTimer").textContent="If the app doesn't open, continuing to YouTube's website in "+seconds+" seconds.";
    tick=setInterval(function(){seconds--;$("openTimer").textContent="Continuing to YouTube's website in "+Math.max(0,seconds)+" seconds.";},1000);
    timer=setTimeout(fallback,seconds*1000);
  }
  $("openStay").onclick=function(){stopped=true;stop();$("openTimer").textContent="Automatic redirect stopped. Choose a button above.";this.hidden=true;};
  $("openApp").onclick=function(){opened=false;arm();};
  $("openAlt").onclick=function(){opened=false;arm();location.href=ios[1];};
  $("openWeb").onclick=function(){stop();};
  if(plat==="desktop"){navigate(web);return;}
  arm();
  /* A browser can reject automatic launches without a gesture. The real anchor
     above remains tappable, while the timer offers the ordinary web fallback. */
  location.href=deep;
}
document.addEventListener("visibilitychange",function(){if(document.hidden){opened=true;stop();$("openTimer").textContent="If YouTube did not open, use a button above to try again.";}});
window.addEventListener("pagehide",function(){opened=true;stop();});
window.addEventListener("hashchange",init);
init();
})();
