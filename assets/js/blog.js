(function(){
"use strict";
var root=document.documentElement;
var tg=document.getElementById("themeToggle");
if(tg)tg.addEventListener("click",function(){
  var next=root.getAttribute("data-theme")==="light"?"dark":"light";
  root.setAttribute("data-theme",next);
  try{localStorage.setItem("ct-theme",next);}catch(e){}
});
function copyText(text,btn,okLabel){
  var done=function(){var old=btn.textContent;btn.textContent=okLabel||"Copied";btn.classList.add("ok");setTimeout(function(){btn.textContent=old;btn.classList.remove("ok");},1800);};
  var fallback=function(){var ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");}catch(e){}document.body.removeChild(ta);done();};
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,fallback);}else{fallback();}
}
var btn=document.getElementById("llmCopy"),md=document.getElementById("postMd");
if(btn&&md)btn.addEventListener("click",function(){copyText(md.textContent.trim(),btn,"Copied - paste into any AI chat");});
})();
