---
title: "The keyboard layout you didn't choose"
description: "QWERTY was arranged in the 1870s around a machine's problem, not your hands. Here's what it costs your fingers — and why we never switched."
date: 2026-05-20
tags: ["forge", "interactive"]
accent: "#22d3ee"
glyph: "circuit"
---

You never chose QWERTY. It was chosen for you in the 1870s, by a printer from Milwaukee named Christopher Latham Sholes, who had a mechanical problem you have never once had: his typebars kept jamming. The keys that struck the page sat on little levers, and when two neighbours fired in quick succession they tangled. So Sholes shuffled the letters to pull common pairs apart and keep the levers out of each other's way.

The popular version of this story — that QWERTY was designed to *slow typists down* — is a myth, but it has a true centre. The layout was arranged around the failings of a machine that no longer exists. Your laptop has no typebars to jam. You are using a workaround for a problem solved a century and a half ago. (The top row also happens to spell TYPEWRITER, which was rather convenient for a salesman demonstrating the thing.)

## The home row is doing less than you'd hope

Rest your hands on a keyboard and your fingers land on the home row: `asdf` under the left, `jkl;` under the right. That's where the least travel lives — anything you can type without leaving it is nearly free. A well-designed layout therefore puts the *most common* letters under your resting fingers.

QWERTY does close to the opposite. It scatters `e`, `t`, `r`, `o` and `i` — five of the most frequent letters in English — up onto the top row, so your fingers spend the day reaching. Later layouts set out to fix exactly this: **Dvorak** (1936) and **Colemak** (2006) both haul the frequent letters back home.

Here's the difference you can feel rather than read. Type anything below — the keys shade by how hard the current text works them, and the bars count how often each layout throws your fingers off the home row. Then flip between layouts and watch QWERTY lose.

<div class="playground" id="pg-keyboard-layout">
<div class="pg-stage"><svg class="kl-kb" viewBox="0 0 460 170" role="img" aria-label="Keyboard heatmap: each key shaded by how often the current text uses that letter"><g data-role="keys"></g></svg><svg class="kl-cmp" viewBox="0 0 460 110" role="img" aria-label="Total finger reaches off the home row, compared across layouts"><g data-role="cmpg"></g></svg><div class="kl-cap" data-role="cap" aria-live="polite">Type your own text, then flip the layout and watch the reaching.</div><label class="kl-lab">Your text<textarea data-role="text" rows="2">the quick brown fox jumps over the lazy dog</textarea></label><div class="kl-row" role="group" aria-label="Keyboard layout"><button type="button" class="kl-lay on" data-role="lay" data-lay="qwerty" aria-pressed="true">QWERTY</button><button type="button" class="kl-lay" data-role="lay" data-lay="dvorak" aria-pressed="false">Dvorak</button><button type="button" class="kl-lay" data-role="lay" data-lay="colemak" aria-pressed="false">Colemak</button></div><div class="kl-readout">reaches off home row <b data-role="reach">0</b> &middot; on home row <b data-role="home">0%</b></div></div>
</div>

<style>
#pg-keyboard-layout .pg-stage{display:grid;gap:.8rem}
#pg-keyboard-layout .kl-title{font-weight:600;color:var(--ink,#e9eef8)}
#pg-keyboard-layout .kl-kb,#pg-keyboard-layout .kl-cmp{width:100%;height:auto;display:block}
#pg-keyboard-layout .kl-cap{min-height:2.4em;color:var(--ink-dim,#cdd6ea);font-size:.98rem;line-height:1.45;border-left:2px solid #22d3ee;padding-left:.8rem}
#pg-keyboard-layout .kl-lab{display:grid;gap:.35rem;color:var(--ink-dim,#9fb0c8);font-size:.85rem}
#pg-keyboard-layout textarea[data-role=text]{width:100%;box-sizing:border-box;background:#0c1424;color:#e9edf5;border:1px solid #2a3a5e;border-radius:10px;padding:.6rem .7rem;font:inherit;resize:vertical}
#pg-keyboard-layout textarea[data-role=text]:focus{outline:none;border-color:#22d3ee}
#pg-keyboard-layout .kl-row{display:flex;flex-wrap:wrap;gap:.5rem}
#pg-keyboard-layout .kl-lay{background:#12203b;color:#cdd6ea;border:1px solid #2a3a5e;border-radius:999px;padding:.4rem 1rem;font:inherit;cursor:pointer;transition:border-color .12s,color .12s,background .12s}
#pg-keyboard-layout .kl-lay:hover{border-color:#22d3ee}
#pg-keyboard-layout .kl-lay.on{background:#163a36;border-color:#2dd4bf;color:#fff}
#pg-keyboard-layout .kl-readout{color:var(--ink-dim,#cdd6ea)}
#pg-keyboard-layout .kl-readout b{color:var(--ink,#fff)}
</style>

<script type="application/pg">
(function(){
var CONFIG={"domId":"pg-keyboard-layout","text":"the quick brown fox jumps over the lazy dog","caption":"Type your own text, then flip the layout and watch the reaching."};
var root=document.getElementById("pg-keyboard-layout");
if(!root)return;
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s){return root.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(root.querySelectorAll(s));};
var ROWS={qwerty:['qwertyuiop','asdfghjkl','zxcvbnm'],dvorak:['pyfgcrl','aoeuidhtns','qjkxbmwvz'],colemak:['qwfpgjluy','arstdhneio','zxcvbkm']};
var NAME={qwerty:'QWERTY',dvorak:'Dvorak',colemak:'Colemak'};
var text=$('[data-role=text]'),keysG=$('[data-role=keys]'),cmpG=$('[data-role=cmpg]'),reachEl=$('[data-role=reach]'),homeEl=$('[data-role=home]'),capEl=$('[data-role=cap]');
var lay='qwerty';
function rowOf(l,ch){var r=ROWS[l];for(var i=0;i<3;i++){if(r[i].indexOf(ch)!==-1)return i;}return -1;}
function freq(s){var f={};s=(s||'').toLowerCase();for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c>='a'&&c<='z')f[c]=(f[c]||0)+1;}return f;}
function stats(l,f){var re=0,ho=0,to=0;for(var c in f){var row=rowOf(l,c);if(row===-1)continue;to+=f[c];if(row===1)ho+=f[c];else re+=f[c];}return {reaches:re,home:ho,total:to};}
function maxFreq(f){var m=1;for(var c in f){if(f[c]>m)m=f[c];}return m;}
function shade(n,mx){if(!n)return '#0c1424';var a=0.16+(n/mx)*0.64;return 'rgba(45,212,191,'+a.toFixed(2)+')';}
function drawKb(f){var r=ROWS[lay],mx=maxFreq(f),kw=40,kh=40,gap=6,h='';for(var row=0;row<3;row++){var letters=r[row];var rowW=letters.length*(kw+gap)-gap;var x0=(460-rowW)/2;var y=10+row*(kh+gap);for(var i=0;i<letters.length;i++){var c=letters.charAt(i),x=x0+i*(kw+gap),n=f[c]||0;var st=row===1?'#2dd4bf':'#2a3a5e';h+='<rect x="'+x.toFixed(1)+'" y="'+y+'" width="'+kw+'" height="'+kh+'" rx="7" fill="'+shade(n,mx)+'" stroke="'+st+'" stroke-width="'+(row===1?1.6:1)+'"/>';h+='<text x="'+(x+kw/2).toFixed(1)+'" y="'+(y+kh/2+5)+'" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" fill="#e9edf5">'+c+'</text>';}}if(keysG)keysG.innerHTML=h;}
function drawCmp(f){var order=['qwerty','dvorak','colemak'];var vals=order.map(function(k){return stats(k,f).reaches;});var mx=Math.max(1,vals[0],vals[1],vals[2]);var h='',x0=110,bh=22,gap=12;for(var i=0;i<order.length;i++){var k=order[i],v=vals[i],y=10+i*(bh+gap),w=(v/mx)*300,on=k===lay;h+='<text x="100" y="'+(y+bh-6)+'" text-anchor="end" font-family="system-ui,sans-serif" font-size="13" fill="'+(on?'#fff':'#aab4cc')+'">'+NAME[k]+'</text>';h+='<rect x="'+x0+'" y="'+y+'" width="'+w.toFixed(1)+'" height="'+bh+'" rx="4" fill="'+(on?'#22d3ee':'#39496e')+'"/>';h+='<text x="'+(x0+w+8).toFixed(1)+'" y="'+(y+bh-6)+'" font-family="system-ui,sans-serif" font-size="13" fill="#cdd6ea">'+v+'</text>';}if(cmpG)cmpG.innerHTML=h;}
function upd(){var f=freq(text?text.value:'');drawKb(f);drawCmp(f);var s=stats(lay,f),q=stats('qwerty',f);if(reachEl)reachEl.textContent=s.reaches;if(homeEl)homeEl.textContent=(s.total?Math.round(s.home/s.total*100):0)+'%';if(capEl)capEl.textContent=s.total>8?(lay==='qwerty'?'QWERTY sends your fingers off the home row '+q.reaches+' times for this text. Flip to Dvorak or Colemak and watch that fall.':NAME[lay]+' keeps far more typing on the home row than QWERTY ('+s.reaches+' reaches against '+q.reaches+').'):'Type a longer sentence to see the layouts pull apart.';}
if(text)text.addEventListener('input',upd);
$$('[data-role=lay]').forEach(function(b){b.addEventListener('click',function(){lay=b.getAttribute('data-lay');$$('[data-role=lay]').forEach(function(x){var on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');});upd();});});
upd();
})();
</script>

## So why are you still typing on it?

Because switching isn't worth it — and that's the genuinely interesting part. The real-world speed gains from Dvorak are modest and endlessly disputed; some of the early studies flattering it were run by Dvorak himself. What QWERTY has on its side isn't quality. It's **everybody else**.

Every keyboard ships with it. Every keyboard shortcut assumes it. Every borrowed laptop speaks it. The cost of the whole world re-learning to type dwarfs the benefit to any one person, so the inferior standard stays locked in — the textbook case of *path dependence*. It's the same force that keeps imperial units limping along, that fixed railway gauges to roughly the width of a Roman cart, and that means we'll be writing JavaScript until the heat death of the universe. The first option to get *good enough* and *everywhere* wins, and quietly forecloses the better one.

So you'll finish this, nod admiringly at Dvorak, and go straight back to QWERTY. So did I. The keyboard you didn't choose is the one you're going to keep — and now, at least, you know exactly what it's costing you.
