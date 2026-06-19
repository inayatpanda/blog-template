---
title: "What a progress bar is really doing"
description: "Most progress bars aren't measuring your progress. They're animating a guess — and the curve they pick decides how the wait feels."
date: 2026-06-12
tags: ["forge", "interactive"]
accent: "#22d3ee"
glyph: "circuit"
---

A progress bar makes a promise: this much done, that much left. It is, more often than you'd like to know, lying. A great many bars aren't wired to anything real — they fill on a timer, or crawl to 90% and wait, or animate a smooth march that has no idea how the actual work is going. What you're usually watching isn't progress. It's a *guess, animated*.

And how that guess moves is a deliberate choice. The same span of time can be mapped onto the bar with different *easing* — the curve that translates "time elapsed" into "distance shown". Linear is honest and slightly dull: equal time, equal width. The others bend it. Ease-out sprints ahead then eases to a crawl; ease-in dawdles then rushes the finish. The clock underneath is identical; only the feeling changes.

## The clock is linear; the bar usually isn't

Pick an easing below and run it. The dot races a perfectly even clock, while the bar shows you what that clock looks like *after* the easing curve has had its way with it. That gap — between the steady time underneath and the un-steady bar on top — is the whole game.

<div class="playground" id="pg-easing-curves">
<div class="pg-stage"><div class="ec-title">Watch the bar, not the percentage</div><div class="ec-row" role="group" aria-label="Easing"><button type="button" class="ec-ease" data-role="ease" data-ease="linear" aria-pressed="false">Linear</button><button type="button" class="ec-ease" data-role="ease" data-ease="in" aria-pressed="false">Ease-in</button><button type="button" class="ec-ease on" data-role="ease" data-ease="out" aria-pressed="true">Ease-out</button><button type="button" class="ec-ease" data-role="ease" data-ease="inout" aria-pressed="false">Ease-in-out</button><button type="button" class="ec-run" data-role="run">Run</button></div><svg class="ec-svg" viewBox="0 0 320 200" role="img" aria-label="The chosen easing curve, with a dot tracking the current position"><g data-role="curve"></g></svg><div class="ec-track" data-role="track"><div class="ec-fill" data-role="fill"></div></div><div class="ec-readout">progress <b data-role="pct" aria-live="polite">0%</b></div><div class="ec-cap">Pick an easing and run it. The dot races a perfectly even clock; the bar shows what the easing does to it.</div></div>
</div>

<style>
#pg-easing-curves .pg-stage{display:grid;gap:.8rem}
#pg-easing-curves .ec-title{font-weight:600;color:var(--ink,#e9eef8)}
#pg-easing-curves .ec-row{display:flex;flex-wrap:wrap;gap:.5rem}
#pg-easing-curves .ec-ease,#pg-easing-curves .ec-run{background:#12203b;color:#cdd6ea;border:1px solid #2a3a5e;border-radius:999px;padding:.4rem 1rem;font:inherit;cursor:pointer;transition:border-color .12s,color .12s,background .12s}
#pg-easing-curves .ec-ease:hover,#pg-easing-curves .ec-run:hover{border-color:#22d3ee}
#pg-easing-curves .ec-ease.on{background:#163a36;border-color:#2dd4bf;color:#fff}
#pg-easing-curves .ec-run{margin-left:auto;background:rgba(34,211,238,.14);border-color:#22d3ee;color:#22d3ee;font-weight:600}
#pg-easing-curves .ec-run:hover{background:rgba(34,211,238,.22)}
#pg-easing-curves .ec-svg{width:100%;height:auto;display:block;max-width:420px;background:#0c1424;border:1px solid #2a3a5e;border-radius:10px}
#pg-easing-curves .ec-track{position:relative;width:100%;height:18px;background:#0c1424;border:1px solid #2a3a5e;border-radius:999px;overflow:hidden}
#pg-easing-curves .ec-fill{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,#2dd4bf,#22d3ee);border-radius:999px}
#pg-easing-curves .ec-readout{color:var(--ink-dim,#cdd6ea);font-variant-numeric:tabular-nums}
#pg-easing-curves .ec-readout b{color:var(--ink,#fff)}
#pg-easing-curves .ec-cap{color:var(--ink-dim,#cdd6ea);font-size:.98rem;line-height:1.45;border-left:2px solid #22d3ee;padding-left:.8rem}
</style>

<script type="application/pg">
(function(){
var CONFIG={"domId":"pg-easing-curves","title":"Watch the bar, not the percentage","caption":"Pick an easing and run it. The dot races a perfectly even clock; the bar shows what the easing does to it.","durationMs":1900};
var root=document.getElementById("pg-easing-curves");
if(!root)return;
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s){return root.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(root.querySelectorAll(s));};
var DUR=(CONFIG&&typeof CONFIG.durationMs==='number'&&CONFIG.durationMs>0)?CONFIG.durationMs:1900;
var PAD=24,X0=PAD,X1=320-PAD,Y0=200-PAD,Y1=PAD,W=X1-X0,H=Y0-Y1;
var EASES={linear:function(t){return t;},in:function(t){return t*t*t;},out:function(t){return 1-Math.pow(1-t,3);},inout:function(t){return t<0.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}};
var cur='out';
function ease(t){return (EASES[cur]||EASES.out)(t);}
function clamp(v,lo,hi){return v<lo?lo:(v>hi?hi:v);}
function px(t){return X0+t*W;}
function py(v){return Y0-v*H;}
var curveG=$('[data-role=curve]'),fill=$('[data-role=fill]'),pct=$('[data-role=pct]'),track=$('[data-role=track]');
function drawCurve(rawT,easedV){
  if(!curveG)return;
  var axis='#2a3a5e';
  var h='';
  h+='<line x1="'+X0+'" y1="'+Y1+'" x2="'+X0+'" y2="'+Y0+'" stroke="'+axis+'" stroke-width="1"/>';
  h+='<line x1="'+X0+'" y1="'+Y0+'" x2="'+X1+'" y2="'+Y0+'" stroke="'+axis+'" stroke-width="1"/>';
  h+='<line x1="'+X0+'" y1="'+Y1+'" x2="'+X1+'" y2="'+Y1+'" stroke="'+axis+'" stroke-width="1" stroke-dasharray="3 4" opacity="0.5"/>';
  var d='',N=48;
  for(var i=0;i<=N;i++){var t=i/N;var x=px(t).toFixed(1),y=py(ease(t)).toFixed(1);d+=(i===0?'M':'L')+x+' '+y;}
  h+='<path d="'+d+'" fill="none" stroke="#22d3ee" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
  if(typeof rawT==='number'){
    var dx=px(clamp(rawT,0,1)),dy=py(clamp(easedV,0,1));
    h+='<line x1="'+dx.toFixed(1)+'" y1="'+Y0+'" x2="'+dx.toFixed(1)+'" y2="'+dy.toFixed(1)+'" stroke="#2dd4bf" stroke-width="1" stroke-dasharray="2 3" opacity="0.6"/>';
    h+='<circle data-role="dot" cx="'+dx.toFixed(1)+'" cy="'+dy.toFixed(1)+'" r="5" fill="#2dd4bf" stroke="#04060c" stroke-width="1.5"/>';
  }
  curveG.innerHTML=h;
}
var rafId=null;
function stop(){if(rafId!==null){if(window.cancelAnimationFrame)window.cancelAnimationFrame(rafId);rafId=null;}}
function run(){
  stop();
  if(reduced){
    if(fill)fill.style.width='100%';
    if(pct)pct.textContent='100%';
    drawCurve(1,1);
    return;
  }
  var start=null;
  function frame(ts){
    if(start===null)start=ts;
    var raw=clamp((ts-start)/DUR,0,1);
    var eased=ease(raw);
    if(fill)fill.style.width=(eased*100)+'%';
    if(pct)pct.textContent=Math.round(eased*100)+'%';
    drawCurve(raw,eased);
    if(raw>=1){stop();return;}
    rafId=window.requestAnimationFrame(frame);
  }
  rafId=window.requestAnimationFrame(frame);
}
function setEase(key,buttons,el){
  cur=key;
  buttons.forEach(function(x){var on=x===el;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');});
  drawCurve();
  run();
}
var easeBtns=$$('[data-role=ease]');
easeBtns.forEach(function(b){b.addEventListener('click',function(){setEase(b.getAttribute('data-ease'),easeBtns,b);});});
var runBtn=$('[data-role=run]');
if(runBtn)runBtn.addEventListener('click',run);
drawCurve();
})();
</script>

## Why fake it at all

Because perceived speed and real speed are different things, and the perceived one is the one users complain about. A bar that moves quickly at first feels responsive even if the back half drags; progress shown a little ahead of reality feels faster than the truth. Designers reach for ease-out constantly for exactly this reason — front-load the visible movement, and the wait feels shorter than the stopwatch says. It is a small, well-meaning deception in the service of patience.

None of which helps when the bar parks at 99% and just sits there. That one isn't easing — that's the work genuinely not being finished, and no curve in the world can animate its way out of it.
