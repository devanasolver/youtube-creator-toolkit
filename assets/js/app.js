(function(){
"use strict";

/* ---------- Theme ---------- */
var root=document.documentElement;
var saved=localStorage.getItem("ct-theme");
if(saved){root.setAttribute("data-theme",saved);}
else if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches){root.setAttribute("data-theme","light");}
document.getElementById("themeToggle").addEventListener("click",function(){
  var next=root.getAttribute("data-theme")==="light"?"dark":"light";
  root.setAttribute("data-theme",next);
  localStorage.setItem("ct-theme",next);
});

/* ---------- Helpers ---------- */
function $(id){return document.getElementById(id);}
function copyText(text,btn){
  var done=function(){
    if(!btn)return;
    var old=btn.textContent;btn.textContent="Copied";
    setTimeout(function(){btn.textContent=old;},1400);
  };
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done,function(){fallback();});
  }else{fallback();}
  function fallback(){
    var ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);
    ta.select();try{document.execCommand("copy");}catch(e){}
    document.body.removeChild(ta);done();
  }
}

/* ---------- 01 Thumbnail Grabber ---------- */
function extractVideoId(input){
  input=(input||"").trim();
  if(/^[a-zA-Z0-9_-]{11}$/.test(input))return input;
  var m;
  m=input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);if(m)return m[1];
  m=input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);if(m)return m[1];
  m=input.match(/\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]{11})/);if(m)return m[1];
  return null;
}
var SIZES=[
  {key:"maxresdefault",label:"Max resolution",dims:"1280 x 720"},
  {key:"sddefault",label:"Standard",dims:"640 x 480"},
  {key:"hqdefault",label:"High",dims:"480 x 360"},
  {key:"mqdefault",label:"Medium",dims:"320 x 180"},
  {key:"default",label:"Small",dims:"120 x 90"}
];
function downloadImage(url,name){
  fetch(url).then(function(r){
    if(!r.ok)throw new Error("fetch failed");
    return r.blob();
  }).then(function(blob){
    var a=document.createElement("a");
    a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
  }).catch(function(){window.open(url,"_blank","noopener");});
}
$("thumbFetch").addEventListener("click",function(){
  var id=extractVideoId($("thumbUrl").value);
  var grid=$("thumbResults"),hint=$("thumbHint");
  grid.innerHTML="";
  if(!id){
    grid.hidden=true;
    hint.textContent="That doesn't look like a YouTube link or video ID. Try the full watch URL.";
    return;
  }
  hint.textContent="Video ID: "+id;
  grid.hidden=false;
  SIZES.forEach(function(s){
    var url="https://i.ytimg.com/vi/"+id+"/"+s.key+".jpg";
    var card=document.createElement("div");card.className="thumb-card";
    var img=new Image();img.alt=s.label+" thumbnail";img.loading="lazy";
    img.src=url;
    img.onload=function(){
      /* YouTube returns a 120x90 grey placeholder when a size is missing */
      if(img.naturalWidth<=120&&s.key!=="default"){
        card.querySelector(".thumb-meta span").textContent="Not available for this video";
        card.querySelector(".dl-btn").remove();
        card.querySelector(".open-btn").remove();
        img.style.opacity=".35";
        return;
      }
      card.querySelector(".thumb-meta span").textContent=s.dims+" px";
    };
    var meta=document.createElement("div");meta.className="thumb-meta";
    var left=document.createElement("div");
    var st=document.createElement("strong");st.textContent=s.label;
    var sp=document.createElement("span");sp.textContent=s.dims+" px";
    left.appendChild(st);left.appendChild(sp);
    var actions=document.createElement("div");actions.className="thumb-actions";
    var dl=document.createElement("button");dl.className="btn btn-mini dl-btn";dl.textContent="Download";
    dl.addEventListener("click",function(){downloadImage(url,"youtube-thumbnail-"+id+"-"+s.key+".jpg");});
    var op=document.createElement("button");op.className="btn btn-mini open-btn";op.textContent="Open";
    op.addEventListener("click",function(){window.open(url,"_blank","noopener");});
    actions.appendChild(dl);actions.appendChild(op);
    meta.appendChild(left);meta.appendChild(actions);
    card.appendChild(img);card.appendChild(meta);
    grid.appendChild(card);
  });
});
$("thumbUrl").addEventListener("keydown",function(e){if(e.key==="Enter")$("thumbFetch").click();});

/* ---------- 02 Title & Tag Ideas ---------- */
function titleCase(s){return s.replace(/\w\S*/g,function(w){return w.charAt(0).toUpperCase()+w.slice(1);});}
var TITLE_TEMPLATES=[
  function(k,K){return K+": What Nobody Tells You";},
  function(k,K){return "How to "+K+" (Step by Step)";},
  function(k,K){return "I Tried "+K+" for 30 Days - Honest Results";},
  function(k,K){return K+" Explained in Under 10 Minutes";},
  function(k,K){return "The Truth About "+K;},
  function(k,K){return "7 "+K+" Mistakes Beginners Always Make";},
  function(k,K){return "Why Your "+K+" Isn't Working (and How to Fix It)";},
  function(k,K){return K+" for Beginners: Start Here";},
  function(k,K){return "Before You Start "+K+", Watch This";},
  function(k,K){return K+" in "+new Date().getFullYear()+": The Complete Guide";}
];
$("titleGen").addEventListener("click",function(){
  var raw=$("topicInput").value.trim();
  if(!raw){$("topicInput").focus();return;}
  var k=raw.toLowerCase(),K=titleCase(raw);
  var list=$("titleList");list.innerHTML="";
  TITLE_TEMPLATES.forEach(function(t){
    var title=t(k,K);
    var li=document.createElement("li");
    var span=document.createElement("span");span.textContent=title;
    var btn=document.createElement("button");btn.className="btn btn-mini copy-one";btn.textContent="Copy";
    btn.addEventListener("click",function(){copyText(title,btn);});
    li.appendChild(span);li.appendChild(btn);
    list.appendChild(li);
  });
  var words=k.split(/\s+/).filter(Boolean);
  var tags=[k,k+" tutorial","how to "+k,k+" for beginners",k+" tips",k+" guide",k+" "+new Date().getFullYear(),"learn "+k,"best "+k,k+" mistakes"];
  words.forEach(function(w){if(tags.indexOf(w)===-1)tags.push(w);});
  if(words.length>1){tags.push(words[words.length-1]+" tutorial");}
  var cloud=$("tagCloud");cloud.innerHTML="";
  tags.forEach(function(t){
    var el=document.createElement("span");el.className="tag";el.textContent=t;cloud.appendChild(el);
  });
  $("copyTags").onclick=function(){copyText(tags.join(", "),$("copyTags"));};
  $("titleResults").hidden=false;
});
$("topicInput").addEventListener("keydown",function(e){if(e.key==="Enter")$("titleGen").click();});

/* ---------- 03 Monetization Calculator ---------- */
function fmt(n){return n.toLocaleString("en-US");}
function updateCalc(){
  var subs=Math.max(0,+$("statSubs").value||0);
  var hours=Math.max(0,+$("statHours").value||0);
  var shorts=Math.max(0,+$("statShorts").value||0);
  function tier(subGoal,hourGoal,shortGoal){
    if(subs>=subGoal&&(hours>=hourGoal||shorts>=shortGoal))return 100;
    var subP=Math.min(subs/subGoal,1);
    var watchP=Math.max(Math.min(hours/hourGoal,1),Math.min(shorts/shortGoal,1));
    return Math.round(((subP+watchP)/2)*100);
  }
  var full=tier(1000,4000,10000000);
  var fan=tier(500,3000,3000000);
  $("barFull").style.width=full+"%";$("pctFull").textContent=full+"%";
  $("barFan").style.width=fan+"%";$("pctFan").textContent=fan+"%";
  var v=$("calcVerdict");
  if(full>=100){v.textContent="You meet the full YPP thresholds. Check YouTube Studio to apply.";}
  else if(fan>=100){v.textContent="You qualify for the fan funding tier. Full ad revenue needs "+fmt(Math.max(0,1000-subs))+" more subs and "+fmt(Math.max(0,4000-hours))+" more watch hours (or "+fmt(Math.max(0,10000000-shorts))+" Shorts views).";}
  else{
    var needSubs=Math.max(0,1000-subs),needHours=Math.max(0,4000-hours),needShorts=Math.max(0,10000000-shorts);
    v.textContent="Road to full YPP: "+fmt(needSubs)+" subs to go, plus "+fmt(needHours)+" watch hours or "+fmt(needShorts)+" Shorts views.";
  }
}
["statSubs","statHours","statShorts"].forEach(function(id){$(id).addEventListener("input",updateCalc);});
updateCalc();

/* ---------- 04 Channel Audit ---------- */
var AUDIT=[
  {group:"Channel setup",items:[
    "Clear channel name and handle that match your niche",
    "Banner and profile image that read well on mobile",
    "About section says who the channel is for and what it delivers",
    "Links to your website or socials are filled in",
    "Channel trailer or featured video set for new visitors"
  ]},
  {group:"Content quality",items:[
    "Every video hooks viewers in the first 15 seconds",
    "Titles stay under 60 characters and lead with the keyword",
    "Custom thumbnail on every upload (never the auto frame)",
    "End screens and cards point to a next video",
    "Audio is clean and levels are consistent across videos"
  ]},
  {group:"Discoverability",items:[
    "Main keyword appears in the title, description and file name",
    "First two lines of each description stand alone as a pitch",
    "Relevant tags and 2-3 hashtags on every upload",
    "Captions or subtitles uploaded or corrected",
    "Videos organized into keyword-named playlists"
  ]},
  {group:"Consistency and analytics",items:[
    "A realistic upload schedule you can keep for 6 months",
    "You review click-through rate and retention after every upload",
    "You know which video brings the most new subscribers",
    "You check returning vs new viewers monthly",
    "You engage with comments in the first 24 hours"
  ]}
];
var STORE_KEY="ct-audit-v1";
var state={};
try{state=JSON.parse(localStorage.getItem(STORE_KEY)||"{}");}catch(e){state={};}
var groupsEl=$("auditGroups");
var totalItems=0;
AUDIT.forEach(function(g,gi){
  var wrap=document.createElement("div");wrap.className="audit-group";
  var h=document.createElement("h3");h.textContent=g.group;wrap.appendChild(h);
  g.items.forEach(function(item,ii){
    totalItems++;
    var id="a"+gi+"-"+ii;
    var label=document.createElement("label");label.className="audit-item"+(state[id]?" done":"");
    var cb=document.createElement("input");cb.type="checkbox";cb.checked=!!state[id];
    var span=document.createElement("span");span.textContent=item;
    cb.addEventListener("change",function(){
      state[id]=cb.checked;if(!cb.checked)delete state[id];
      localStorage.setItem(STORE_KEY,JSON.stringify(state));
      label.classList.toggle("done",cb.checked);
      updateAudit();
    });
    label.appendChild(cb);label.appendChild(span);
    wrap.appendChild(label);
  });
  groupsEl.appendChild(wrap);
});
function updateAudit(){
  var done=Object.keys(state).length;
  var pct=totalItems?Math.round(done/totalItems*100):0;
  $("auditBar").style.width=pct+"%";
  $("auditPct").textContent=pct+"% ("+done+"/"+totalItems+")";
}
$("auditReset").addEventListener("click",function(){
  state={};localStorage.removeItem(STORE_KEY);
  groupsEl.querySelectorAll("input").forEach(function(cb){cb.checked=false;});
  groupsEl.querySelectorAll(".audit-item").forEach(function(l){l.classList.remove("done");});
  updateAudit();
});
updateAudit();
})();
