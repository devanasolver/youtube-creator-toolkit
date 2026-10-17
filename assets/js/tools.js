(function(){
"use strict";
var API="https://yt-transcript-proxy.pages.dev/api";
function $(id){return document.getElementById(id);}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function copyText(text,btn){
  var done=function(){if(!btn)return;var o=btn.textContent;btn.textContent="Copied";setTimeout(function(){btn.textContent=o;},1400);};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fb);}else{fb();}
  function fb(){var t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();try{document.execCommand("copy");}catch(e){}t.remove();done();}
}
function download(name,text,type){
  var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type||"text/plain;charset=utf-8"}));
  a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
}
function status(el,msg,kind){el.hidden=!msg;el.className="status"+(kind?" "+kind:"");el.textContent=msg||"";}
function videoId(input){
  input=(input||"").trim();
  if(/^[a-zA-Z0-9_-]{11}$/.test(input))return input;
  var m=input.match(/[?&]v=([a-zA-Z0-9_-]{11})/)||input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)||input.match(/\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);
  return m?m[1]:null;
}
function fetchJSON(url,tries,onRetry){
  var n=0;
  return new Promise(function(resolve,reject){
    (function go(){
      n++;
      fetch(url).then(function(r){return r.json().then(function(j){return {s:r.status,j:j};});}).then(function(o){
        if(o.j&&(o.j.error==="blocked"||o.j.error==="upstream")&&n<tries){if(onRetry)onRetry(n,tries);return setTimeout(go,500);}
        resolve(o.j);
      }).catch(function(){
        if(n<tries){if(onRetry)onRetry(n,tries);return setTimeout(go,900);}
        reject(new Error("network"));
      });
    })();
  });
}

/* ---------- time + cue formats ---------- */
function pad(n,w){n=String(n);while(n.length<w)n="0"+n;return n;}
function stamp(sec,sep){
  if(sec<0)sec=0;var ms=Math.round(sec*1000);var h=Math.floor(ms/3600000);ms-=h*3600000;var m=Math.floor(ms/60000);ms-=m*60000;var s=Math.floor(ms/1000);ms-=s*1000;
  return pad(h,2)+":"+pad(m,2)+":"+pad(s,2)+sep+pad(ms,3);
}
function shortStamp(sec){sec=Math.floor(sec);var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return (h?h+":"+pad(m,2):m)+":"+pad(s,2);}
function toSrt(c){return c.map(function(x,i){return (i+1)+"\n"+stamp(x.start,",")+" --> "+stamp(x.start+x.end,",")+"\n"+x.text+"\n";}).join("\n");}
function toVtt(c){return "WEBVTT\n\n"+c.map(function(x){return stamp(x.start,".")+" --> "+stamp(x.start+x.end,".")+"\n"+x.text+"\n";}).join("\n");}
function normCues(cues){ // {start,dur,text} -> {start,end(duration),text}, never overlapping the next cue start
  return cues.map(function(c,i){
    var d=c.dur||2.5;var nxt=cues[i+1];
    if(nxt&&c.start+d>nxt.start&&nxt.start>c.start)d=nxt.start-c.start;
    return {start:c.start,end:Math.max(d,0.2),text:c.text};
  });
}
function toText(cues,stamps){
  if(stamps)return cues.map(function(c){return "["+shortStamp(c.start)+"] "+c.text;}).join("\n");
  var out=[],cur=[],last=null;
  cues.forEach(function(c){
    if(last!==null&&c.start-last>3&&cur.length){out.push(cur.join(" "));cur=[];}
    cur.push(c.text);last=c.start+(c.dur||0);
  });
  if(cur.length)out.push(cur.join(" "));
  return out.join("\n\n");
}
function safeName(s){return (s||"transcript").replace(/[^\w\- ]+/g,"").trim().replace(/\s+/g,"-").slice(0,60)||"transcript";}

/* ---------- 05 Transcript ---------- */
var tr={cues:[],title:"",id:""};
function trRender(){
  var t=toText(tr.cues,$("trStamps").checked);$("trText").value=t;
}
function trLoad(lang){
  var id=videoId($("trUrl").value);
  if(!id){status($("trStatus"),"That does not look like a YouTube link. Paste a watch link, youtu.be link, Shorts link or the 11-character video ID.","err");$("trResult").hidden=true;return;}
  $("trFetch").disabled=true;$("trResult").hidden=true;status($("trStatus"),"Fetching captions...");
  fetchJSON(API+"/transcript?v="+id+(lang?"&lang="+encodeURIComponent(lang):""),14,function(n,t){status($("trStatus"),"YouTube is rate limiting the free proxy, retrying automatically ("+(n+1)+"/"+t+")...");})
  .then(function(j){
    $("trFetch").disabled=false;
    if(j.error==="no_captions"){status($("trStatus"),(j.title?"\""+j.title+"\": ":"")+"this video has no captions or transcript available. The creator has not added any and YouTube has not generated automatic ones, so there is nothing to download. If you have your own caption file, you can convert it below.","err");return;}
    if(j.error){status($("trStatus"),j.message||"Something went wrong. Try again in a moment.","err");return;}
    status($("trStatus"),"");
    tr.cues=j.cues;tr.title=j.title;tr.id=j.videoId;
    $("trTitle").textContent=j.title;
    $("trInfo").textContent=(j.author?j.author+" - ":"")+(j.selected.auto?"auto-generated captions":"creator-uploaded captions")+" - "+j.selected.name+" - "+j.cues.length+" lines";
    var sel=$("trLang");sel.innerHTML="";
    j.tracks.forEach(function(t,i){var o=document.createElement("option");o.value=t.lang+(t.auto?":asr":"");o.textContent=t.name+(t.auto&&!/auto/i.test(t.name)?" (auto)":"");if(i===j.selected.index)o.selected=true;sel.appendChild(o);});
    $("trLangWrap").hidden=j.tracks.length<2;
    $("trResult").hidden=false;trRender();
  }).catch(function(){$("trFetch").disabled=false;status($("trStatus"),"Could not reach the transcript service. Check your connection and try again.","err");});
}
$("trFetch").addEventListener("click",function(){trLoad();});
$("trUrl").addEventListener("keydown",function(e){if(e.key==="Enter")trLoad();});
$("trLang").addEventListener("change",function(){trLoad(this.value);});
$("trStamps").addEventListener("change",trRender);
$("trCopy").addEventListener("click",function(){copyText($("trText").value,this);});
$("trTxt").addEventListener("click",function(){download(safeName(tr.title)+".txt",$("trText").value);});
$("trSrt").addEventListener("click",function(){download(safeName(tr.title)+".srt",toSrt(normCues(tr.cues)),"application/x-subrip");});
$("trVtt").addEventListener("click",function(){download(safeName(tr.title)+".vtt",toVtt(normCues(tr.cues)),"text/vtt");});

/* ---------- SRT / VTT converter ---------- */
function parseTime(s){
  var m=s.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  if(!m)return null;
  return (+(m[1]||0))*3600+(+m[2])*60+(+m[3])+(+((m[4]+"00").slice(0,3)))/1000;
}
function parseCaptions(src){
  src=src.replace(/^\uFEFF/,"").replace(/\r/g,"");
  var blocks=src.split(/\n{2,}/),cues=[];
  blocks.forEach(function(b){
    var lines=b.split("\n").filter(function(l){return l.trim()!=="";});
    var i=lines.findIndex(function(l){return l.indexOf("-->")>-1;});
    if(i<0)return;
    var p=lines[i].split("-->");var a=parseTime(p[0]);var b2=parseTime(p[1].trim().split(/\s+/)[0]);
    if(a===null||b2===null)return;
    cues.push({start:a,end:Math.max(b2-a,0.1),text:lines.slice(i+1).join("\n")});
  });
  return cues;
}
var cv={cues:[],name:"captions"};
function cvRun(){
  var src=$("cvIn").value;
  if(!src.trim()){$("cvResult").hidden=true;status($("cvStatus"),"");return;}
  var cues=parseCaptions(src);
  if(!cues.length){$("cvResult").hidden=true;status($("cvStatus"),"No timed captions found. This tool reads SRT and VTT files (lines like 00:00:01,000 --> 00:00:03,000).","err");return;}
  var shift=parseFloat($("cvShift").value)||0;
  cues=cues.map(function(c){
    var t=c.text;
    if($("cvTags").checked)t=t.replace(/<[^>]+>/g,"").replace(/\{\\[^}]*\}/g,"");
    if($("cvBracket").checked)t=t.replace(/\[[^\]]*\]|\([^)]*\)|♪[^♪]*♪/g,"");
    t=t.split("\n").map(function(l){return l.trim();}).filter(Boolean).join("\n");
    return {start:Math.max(0,c.start+shift),end:c.end,text:t};
  }).filter(function(c){return c.text;});
  if($("cvDupes").checked){
    var m=[];cues.forEach(function(c){var l=m[m.length-1];if(l&&l.text===c.text&&c.start-(l.start+l.end)<1.5){l.end=c.start+c.end-l.start;}else m.push(c);});
    cues=m;
  }
  cv.cues=cues;
  $("cvOut").value=cues.map(function(c){return c.text.replace(/\n/g," ");}).join("\n");
  status($("cvStatus"),cues.length+" caption lines ready.","ok");$("cvResult").hidden=false;
}
$("cvFile").addEventListener("change",function(){
  var f=this.files&&this.files[0];if(!f)return;cv.name=safeName(f.name.replace(/\.\w+$/,""));
  var r=new FileReader();r.onload=function(){$("cvIn").value=r.result;cvRun();};r.readAsText(f);
});
["cvIn","cvTags","cvBracket","cvDupes","cvShift"].forEach(function(id){$(id).addEventListener(id==="cvIn"||id==="cvShift"?"input":"change",cvRun);});
$("cvCopy").addEventListener("click",function(){copyText($("cvOut").value,this);});
$("cvTxt").addEventListener("click",function(){download(cv.name+"-clean.txt",$("cvOut").value);});
$("cvSrt").addEventListener("click",function(){download(cv.name+"-clean.srt",toSrt(cv.cues),"application/x-subrip");});
$("cvVtt").addEventListener("click",function(){download(cv.name+"-clean.vtt",toVtt(cv.cues),"text/vtt");});

/* ---------- 06 Channel stats ---------- */
function fmt(n){return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,"")+"M":n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace(/\.0$/,"")+"K":String(n);}
function median(a){var s=a.slice().sort(function(x,y){return x-y;});var m=Math.floor(s.length/2);return s.length?(s.length%2?s[m]:(s[m-1]+s[m])/2):0;}
$("chGo").addEventListener("click",chLoad);
$("chQuery").addEventListener("keydown",function(e){if(e.key==="Enter")chLoad();});
function chLoad(){
  var q=$("chQuery").value.trim();
  if(!q){status($("chStatus"),"Enter a channel link, @handle or channel ID.","err");return;}
  $("chGo").disabled=true;$("chResult").hidden=true;status($("chStatus"),"Looking up channel...");
  fetchJSON(API+"/channel?q="+encodeURIComponent(q),2).then(function(j){
    $("chGo").disabled=false;
    if(j.error){status($("chStatus"),j.message||"Could not load that channel.","err");return;}
    status($("chStatus"),"");
    var v=j.videos||[];
    $("chName").textContent=j.name;$("chName").href=j.url;
    $("chSubs").textContent=j.subscribers?j.subscribers+" subscribers (rounded by YouTube)":"Subscriber count not available for this channel";
    var views=v.map(function(x){return x.views;});
    var avg=views.length?Math.round(views.reduce(function(a,b){return a+b;},0)/views.length):0;
    var med=median(views);
    var dates=v.map(function(x){return new Date(x.published).getTime();}).sort(function(a,b){return a-b;});
    var span=dates.length>1?(dates[dates.length-1]-dates[0])/864e5:0;
    var perWeek=span>0?((v.length-1)/span*7):0;
    var shorts=v.filter(function(x){return x.short;}).length;
    var best=v.slice().sort(function(a,b){return b.views-a.views;})[0];
    $("chStats").innerHTML=
      stat(fmt(avg),"average views, last "+v.length+" uploads")+stat(fmt(med),"median views")+
      stat(perWeek?perWeek.toFixed(1):"-","uploads per week (recent)")+stat(shorts+" / "+(v.length-shorts),"Shorts / long-form")+
      (best?stat(fmt(best.views),"best recent video"):"");
    $("chRows").innerHTML=v.map(function(x){
      var out=x.views>=med*2&&med>0;
      return "<tr><td><a target=\"_blank\" rel=\"noopener\" href=\"https://www.youtube.com/watch?v="+esc(x.id)+"\">"+esc(x.title)+"</a> "+(x.short?"<span class=\"pill s\">Short</span>":"")+"</td><td>"+esc((x.published||"").slice(0,10))+"</td><td>"+x.views.toLocaleString()+"</td><td>"+x.likes.toLocaleString()+"</td><td>"+(out?"<span class=\"pill\">2x+ median</span>":"")+"</td></tr>";
    }).join("");
    $("chNote").textContent="Based on the "+v.length+" newest public uploads only. Views are as of now, so brand-new videos look weaker than they will end up.";
    $("chResult").hidden=false;
  }).catch(function(){$("chGo").disabled=false;status($("chStatus"),"Could not reach the lookup service. Try again in a moment.","err");});
}
function stat(b,s){return "<div class=\"stat\"><b>"+esc(b)+"</b><span>"+esc(s)+"</span></div>";}

/* ---------- 07 Keywords + hashtags ---------- */
var kw={list:[],hash:[]};
function batch(items,fn,size){var out=[],i=0;function next(){if(i>=items.length)return Promise.resolve(out);var chunk=items.slice(i,i+size);i+=size;return Promise.all(chunk.map(fn)).then(function(r){out=out.concat(r);return next();});}return next();}
function sug(q){return fetch(API+"/suggest?q="+encodeURIComponent(q)).then(function(r){return r.json();}).then(function(j){return j.suggestions||[];}).catch(function(){return [];});}
$("kwGo").addEventListener("click",kwRun);
$("kwTopic").addEventListener("keydown",function(e){if(e.key==="Enter")kwRun();});
function kwRun(){
  var t=$("kwTopic").value.trim().toLowerCase();
  if(!t){status($("kwStatus"),"Type a topic first.","err");return;}
  $("kwGo").disabled=true;$("kwResult").hidden=true;status($("kwStatus"),"Asking YouTube what people search...");
  var qs=[t].concat("abcdefghijklmnopqrstuvwxyz".split("").map(function(c){return t+" "+c;}),["how to "+t,"best "+t,"why "+t,t+" for beginners"]);
  batch(qs,sug,5).then(function(all){
    $("kwGo").disabled=false;
    var seen={},list=[];
    all.forEach(function(a,i){a.forEach(function(s){if(!seen[s]){seen[s]=1;list.push({s:s,top:i===0});}});});
    if(!list.length){status($("kwStatus"),"YouTube returned no suggestions for that topic. Try a broader phrase.","err");return;}
    status($("kwStatus"),"");
    kw.list=list.map(function(x){return x.s;});
    $("kwCount").textContent="("+list.length+")";
    $("kwCloud").innerHTML=list.map(function(x){return "<span class=\"tag\">"+esc(x.s)+"</span>";}).join("");
    var words={};t.split(/\s+/).forEach(function(w){if(w.length>2)words[w]=1;});
    var hs=[],hseen={};
    function add(s){var h=s.replace(/[^a-z0-9]/gi,"");if(h.length>2&&h.length<30&&!hseen[h.toLowerCase()]){hseen[h.toLowerCase()]=1;hs.push("#"+h);}}
    add(t);Object.keys(words).forEach(add);
    kw.list.slice(0,14).forEach(function(s){if(s.split(" ").length<=3)add(s);});
    kw.hash=hs.slice(0,12);
    $("kwHash").innerHTML=kw.hash.map(function(h){return "<span class=\"tag\">"+esc(h)+"</span>";}).join("");
    $("kwResult").hidden=false;
  });
}
$("kwCopyList").addEventListener("click",function(){copyText(kw.list.join("\n"),this);});
$("kwCopyTags").addEventListener("click",function(){var out=[],len=0;kw.list.forEach(function(s){if(len+s.length+1<=500){out.push(s);len+=s.length+1;}});copyText(out.join(", "),this);});
$("kwCopyHash").addEventListener("click",function(){copyText(kw.hash.join(" "),this);});

/* ---------- 08 Analyzer ---------- */
function anRun(){
  var title=$("anTitle").value.trim(),desc=$("anDesc").value,tags=$("anTags").value.split(",").map(function(s){return s.trim();}).filter(Boolean),kwd=$("anKw").value.trim().toLowerCase();
  $("anTitleCount").textContent=title.length+"/100";$("anDescCount").textContent=desc.length+"/5000";
  var tagLen=tags.join(",").length;$("anTagCount").textContent=tagLen+"/500";
  if(!title&&!desc){$("anResult").hidden=true;return;}
  var c=[];
  function add(w,res,label,tip){c.push({w:w,res:res,label:label,tip:tip});}
  var tl=title.length;
  add(15,tl===0?"fail":(tl>=30&&tl<=60?"pass":(tl<=70||tl>=20&&tl<30?"warn":"fail")),"Title length: "+tl+" characters","Aim for 30-60. Longer titles get cut off in search and on phones (around 60-70 characters).");
  if(kwd){
    var pos=title.toLowerCase().indexOf(kwd);
    add(15,pos<0?"fail":(pos<=20?"pass":"warn"),pos<0?"Keyword is not in the title":(pos<=20?"Keyword appears early in the title":"Keyword is in the title but late"),"Lead with what the video is about so it survives truncation.");
    var d150=desc.slice(0,150).toLowerCase().indexOf(kwd)>=0;
    add(10,d150?"pass":(desc.toLowerCase().indexOf(kwd)>=0?"warn":"fail"),d150?"Keyword is in the first 150 characters of the description":(desc.toLowerCase().indexOf(kwd)>=0?"Keyword is in the description, but not in the first lines":"Keyword is missing from the description"),"The first two lines are what people see before tapping \"more\".");
  }
  var letters=title.replace(/[^A-Za-z]/g,"");var caps=letters.length?letters.replace(/[^A-Z]/g,"").length/letters.length:0;
  add(8,caps>.6&&letters.length>8?"fail":(caps>.35?"warn":"pass"),caps>.6&&letters.length>8?"Title is mostly ALL CAPS":"Capitalization looks normal","All-caps titles read as shouting and can hurt trust.");
  var punct=(title.match(/[!?]/g)||[]).length;
  add(5,punct>2?"fail":(punct>1?"warn":"pass"),punct>2?"Too many ! or ? in the title":"Punctuation is under control","One at most keeps it clean.");
  add(5,/\d/.test(title)?"pass":"warn",/\d/.test(title)?"Title contains a number":"No number in the title","Numbers (5 tips, 2026) often make a promise concrete. Optional, not required.");
  var dl=desc.length;
  add(12,dl>=250?"pass":(dl>=100?"warn":"fail"),"Description length: "+dl+" characters","Write at least a few sentences (250+) that say what the video covers.");
  var hash=(desc.match(/(^|\s)#[\w]+/g)||[]).length;
  add(6,hash>15?"fail":(hash>=1&&hash<=5?"pass":"warn"),hash>15?hash+" hashtags: YouTube ignores all hashtags above 15":(hash?hash+" hashtag(s) in the description":"No hashtags in the description"),"Use 1-5 relevant ones. The first three appear above the title.");
  var stampsN=(desc.match(/(^|\n)\s*(\d{1,2}:)?\d{1,2}:\d{2}\b/g)||[]).length;
  add(6,stampsN>=3?"pass":"warn",stampsN>=3?"Chapter timestamps found ("+stampsN+")":"No chapter timestamps","Chapters help viewers jump around and can show in search. Use the Chapters tool below.");
  add(5,/https?:\/\//.test(desc)?"pass":"warn",/https?:\/\//.test(desc)?"Description includes a link":"No links in the description","Link your channel, playlist or next video.");
  if(tags.length){
    add(8,tagLen>500?"fail":(tags.length>=5?"pass":"warn"),tagLen>500?"Tags exceed 500 characters":tags.length+" tags, "+tagLen+" characters","Tags matter little for ranking; use them for common misspellings and the main topic. Keep under 500 characters.");
  }
  var tw=0,got=0;c.forEach(function(x){tw+=x.w;got+=x.w*(x.res==="pass"?1:x.res==="warn"?.5:0);});
  var score=tw?Math.round(got/tw*100):0;
  $("anScore").textContent=score;var ring=$("anRing");ring.style.setProperty("--p",score);ring.style.setProperty("--c",score>=75?"#27ae60":score>=50?"#e0961a":"#ff2d55");
  $("anVerdict").textContent=score>=75?"Solid. These basics are covered.":score>=50?"Decent start. Fix the amber and red items.":"Needs work. Start with the red items.";
  $("anChecks").innerHTML=c.map(function(x){return "<li class=\""+x.res+"\"><span class=\"ic\">"+(x.res==="pass"?"&#10003;":x.res==="warn"?"!":"&times;")+"</span><div>"+esc(x.label)+"<small>"+esc(x.tip)+"</small></div></li>";}).join("");
  $("anResult").hidden=false;
}
["anTitle","anDesc","anTags","anKw"].forEach(function(id){$(id).addEventListener("input",anRun);});

/* ---------- 09 Thumbnail A/B ---------- */
var ab={A:"",B:""};
function abRender(){
  var ch=esc($("abChan").value||"Your Channel");
  function card(v,kind){
    var t=esc($("abTitle"+v).value||"Your title here");
    var th="<div class=\"th\">"+(ab[v]?"<img alt=\"\" src=\""+ab[v]+"\">":"<div class=\"empty\">Upload a thumbnail</div>")+"<span class=\"dur\">12:34</span></div>";
    if(kind==="side")return "<div class=\"vc side\">"+th+"<div><div class=\"tt\">"+t+"</div><div class=\"ch\">"+ch+"</div><div class=\"ch\">120K views</div></div></div>";
    return "<div class=\"vc "+(kind==="phone"?"phone":"")+"\">"+th+"<div class=\"row\"><div class=\"av\"></div><div><div class=\"tt\">"+t+"</div><div class=\"ch\">"+ch+" - 120K views - 2 days ago</div></div></div></div>";
  }
  $("abStage").innerHTML=["A","B"].map(function(v){
    return "<div class=\"ab-variant\"><h4>Option "+v+"</h4><div><small class=\"lbl vc\">Desktop feed</small>"+card(v,"desk")+"</div><div><small class=\"lbl vc\">Phone feed</small>"+card(v,"phone")+"</div><div><small class=\"lbl vc\">Suggested sidebar</small>"+card(v,"side")+"</div></div>";
  }).join("");
}
function abFile(v,input){var f=input.files&&input.files[0];if(!f)return;var r=new FileReader();r.onload=function(){ab[v]=r.result;abRender();};r.readAsDataURL(f);}
$("abImgA").addEventListener("change",function(){abFile("A",this);});
$("abImgB").addEventListener("change",function(){abFile("B",this);});
["abTitleA","abTitleB","abChan"].forEach(function(id){$(id).addEventListener("input",abRender);});
Array.prototype.forEach.call($("abSurface").querySelectorAll("button"),function(b){b.addEventListener("click",function(){
  $("abStage").setAttribute("data-surface",b.getAttribute("data-s"));
  Array.prototype.forEach.call($("abSurface").querySelectorAll("button"),function(x){x.classList.toggle("on",x===b);});
});});
abRender();

/* ---------- 10 Revenue ---------- */
function money(n){return "$"+Math.round(n).toLocaleString();}
function rvRun(){
  var v=Math.max(0,+$("rvViews").value||0),s=Math.max(0,+$("rvShorts").value||0),lo=Math.max(0,+$("rvLow").value||0),hi=Math.max(0,+$("rvHigh").value||0),sr=Math.max(0,+$("rvShortRpm").value||0);
  if(hi<lo){var t=lo;lo=hi;hi=t;}
  var sh=s/1000*sr;var low=v/1000*lo+sh,high=v/1000*hi+sh;
  $("rvOut").innerHTML=stat(money(low)+" - "+money(high),"per month")+stat(money(low*12)+" - "+money(high*12),"per year at this pace")+stat(money((low+high)/2),"midpoint per month")+stat(money(v?(low+high)/2/Math.max(1,v+s)*1000:0),"blended per 1,000 views");
}
["rvViews","rvShorts","rvLow","rvHigh","rvShortRpm"].forEach(function(id){$(id).addEventListener("input",rvRun);});rvRun();

/* ---------- 11 Chapters ---------- */
function parseStamp(s){var p=s.split(":").map(Number);if(p.some(isNaN))return null;return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:null;}
$("chFix").addEventListener("click",function(){
  var rows=[];
  $("chIn").value.split("\n").forEach(function(l){
    var m=l.trim().match(/^[\-\*\u2022\[\(]*\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*[\]\)]?\s*[\-\u2013\u2014:|]*\s*(.*)$/);
    if(m){var t=parseStamp(m[1]);if(t!==null)rows.push({t:t,name:m[2].trim()});}
  });
  var res=[];
  function add(r,l,tip){res.push("<li class=\""+r+"\"><span class=\"ic\">"+(r==="pass"?"&#10003;":"&times;")+"</span><div>"+esc(l)+(tip?"<small>"+esc(tip)+"</small>":"")+"</div></li>");}
  if(!rows.length){$("chkResult").hidden=false;$("chkList").innerHTML="";add("fail","No timestamps found","Use one chapter per line, like 0:00 Intro.");$("chkList").innerHTML=res.join("");$("chkOut").value="";return;}
  rows.sort(function(a,b){return a.t-b.t;});
  add(rows[0].t===0?"pass":"fail",rows[0].t===0?"First chapter starts at 0:00":"First chapter must start at 0:00","Your first timestamp is "+shortStamp(rows[0].t)+".");
  add(rows.length>=3?"pass":"fail",rows.length+" chapters"+(rows.length>=3?"":" - YouTube needs at least 3"));
  var short=[];rows.forEach(function(r,i){if(i<rows.length-1&&rows[i+1].t-r.t<10)short.push(shortStamp(r.t));});
  add(short.length?"fail":"pass",short.length?"Chapters shorter than 10 seconds at: "+short.join(", "):"Every chapter is at least 10 seconds");
  var dup=rows.filter(function(r,i){return i&&r.t===rows[i-1].t;}).length;if(dup)add("fail",dup+" duplicate timestamp(s)");
  var blank=rows.filter(function(r){return !r.name;}).length;if(blank)add("fail",blank+" chapter(s) have no title");
  $("chkList").innerHTML=res.join("");
  $("chkOut").value=rows.map(function(r){return shortStamp(r.t)+" "+(r.name||"Untitled");}).join("\n");
  $("chkResult").hidden=false;
});
$("chkCopy").addEventListener("click",function(){copyText($("chkOut").value,this);});

/* ---------- 12 Upload planner ---------- */
var zones=["Asia/Ho_Chi_Minh","Asia/Kolkata","Asia/Dubai","Asia/Karachi","Asia/Manila","Asia/Tokyo","Australia/Sydney","Europe/London","Europe/Paris","Europe/Istanbul","Africa/Cairo","Africa/Lagos","America/Sao_Paulo","America/New_York","America/Chicago","America/Denver","America/Los_Angeles","Pacific/Auckland"];
var myZone=(Intl.DateTimeFormat().resolvedOptions().timeZone)||"UTC";
function zoneLabel(z){return z.replace(/_/g," ").replace("/"," / ");}
(function(){var sel=$("plZone");var list=zones.slice();if(list.indexOf(myZone)<0)list.unshift(myZone);
  list.forEach(function(z){var o=document.createElement("option");o.value=z;o.textContent=zoneLabel(z);sel.appendChild(o);});
  sel.value=zones.indexOf("America/New_York")>-1&&myZone!=="America/New_York"?"America/New_York":myZone;})();
function offsetMs(tz,date){ // tz offset in ms at the given instant
  var f=new Intl.DateTimeFormat("en-US",{timeZone:tz,hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).formatToParts(date);
  var o={};f.forEach(function(p){o[p.type]=p.value;});
  return Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute,+o.second)-(date.getTime()-date.getMilliseconds());
}
function zonedToUtc(y,mo,d,h,mi,tz){var guess=Date.UTC(y,mo,d,h,mi);var o1=offsetMs(tz,new Date(guess));var t=guess-o1;var o2=offsetMs(tz,new Date(t));return new Date(guess-o2);}
function plRun(){
  var tz=$("plZone").value,pk=($("plPeak").value||"19:00").split(":"),lead=Math.max(0,+$("plLead").value||0);
  var now=new Date(),rows=[];
  var base=new Intl.DateTimeFormat("en-US",{timeZone:tz,year:"numeric",month:"numeric",day:"numeric"}).formatToParts(now),b={};base.forEach(function(p){b[p.type]=+p.value;});
  for(var i=0;i<7;i++){
    var peak=zonedToUtc(b.year,b.month-1,b.day+i,+pk[0],+pk[1],tz);
    var pub=new Date(peak.getTime()-lead*3600000);
    if(pub<now)continue;
    var f1=new Intl.DateTimeFormat("en-US",{timeZone:myZone,weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    var f2=new Intl.DateTimeFormat("en-US",{timeZone:tz,weekday:"short",hour:"numeric",minute:"2-digit"});
    rows.push("<tr><td>"+esc(new Intl.DateTimeFormat("en-US",{timeZone:myZone,weekday:"long"}).format(pub))+"</td><td><strong>"+esc(f1.format(pub))+"</strong></td><td>"+esc(f2.format(pub))+" (peak "+esc(f2.format(peak).replace(/^\w+,? /,""))+")</td></tr>");
  }
  $("plRows").innerHTML=rows.join("");
}
["plZone","plPeak","plLead"].forEach(function(id){$(id).addEventListener("input",plRun);$(id).addEventListener("change",plRun);});plRun();

/* ---------- 13 Footage ---------- */
function ftRun(){
  var q=$("ftQuery").value.trim()||"nature",e=encodeURIComponent(q);
  var L=[
    ["YouTube, Creative Commons only","Filter: CC BY videos you may reuse with credit","https://www.youtube.com/results?search_query="+e+"&sp=EgIwAQ%253D%253D"],
    ["Pexels Videos","Free to use, no credit required","https://www.pexels.com/search/videos/"+e+"/"],
    ["Pixabay Videos","Free under the Pixabay license","https://pixabay.com/videos/search/"+e+"/"],
    ["Wikimedia Commons","Open-licensed video and media (check each license)","https://commons.wikimedia.org/w/index.php?search="+e+"+filetype%3Avideo&ns6=1"],
    ["Internet Archive","Public domain and open collections","https://archive.org/search?query="+e+"&and%5B%5D=mediatype%3A%22movies%22"],
    ["Mixkit","Free clips under the Mixkit license","https://mixkit.co/free-stock-video/"+e.replace(/%20/g,"-")+"/"]
  ];
  $("ftLinks").innerHTML=L.map(function(l){return "<a class=\"link-card\" target=\"_blank\" rel=\"noopener\" href=\""+l[2]+"\"><b>"+esc(l[0])+"</b><span>"+esc(l[1])+"</span></a>";}).join("");
}
$("ftQuery").addEventListener("input",ftRun);ftRun();
function atRun(){
  var t=$("atTitle").value.trim()||"Clip title",a=$("atAuthor").value.trim()||"Author",u=$("atUrl").value.trim(),l=$("atLic").value;
  $("atOut").value="\""+t+"\" by "+a+(u?" ("+u+")":"")+" - "+l+".";
}
["atTitle","atAuthor","atUrl","atLic"].forEach(function(id){$(id).addEventListener("input",atRun);$(id).addEventListener("change",atRun);});atRun();
$("atCopy").addEventListener("click",function(){copyText($("atOut").value,this);});
})();
