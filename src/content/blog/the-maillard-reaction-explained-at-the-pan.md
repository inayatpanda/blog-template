---
title: "The Maillard reaction, explained at the pan"
description: "Why a dry, hot pan browns food and a crowded one just steams it — the chemistry of flavour, with a temperature dial you can drag."
date: 2026-06-05
tags: ["old-bones", "interactive"]
accent: "#fbbf24"
glyph: "scroll"
---

Two pans, same steak, same hob. One comes out grey and weeping; the other has a deep brown crust and smells like a restaurant. The difference isn't the meat or the money — it's a piece of chemistry named after a French doctor, and once you can see it happening you cook differently.

In 1912 Louis-Camille Maillard described what happens when amino acids and certain sugars are heated together: they react, cascade, and throw off hundreds of new molecules — the browns, the roasted aromas, the savoury depth of a seared chop, of toast, of coffee, of the crust on a loaf. It is not the same as caramelisation, which is sugar alone and hotter. It is simply the reason "brown food tastes good" is, near enough, a law of the kitchen.

## Water is the enemy of a crust

Here's the catch that quietly ruins most home cooking: the Maillard reaction barely gets going until around 140°C, and water boiling off a wet surface pins that surface near 100°C. So while the food is still shedding moisture, it cannot brown — it steams. Crowd the pan, or drop in cold, damp food, and you flood it with steam; everything turns pale and grey. Dry the surface, give each piece room, get the pan properly hot, and the instant the water has gone, the browning begins.

Drag the temperature and watch where the useful range actually sits:

<div class="playground" id="pg-doneness-maillard">
<div class="pg-stage"><div class="dn-title">How hot is the pan?</div><div class="dn-readout"><b data-role="val">150°C</b><span class="dn-zone" data-role="zone">—</span></div><div class="dn-track" data-role="track"></div><input class="dn-slider" type="range" data-role="slider" min="20" max="240" value="150" step="1" aria-label="Temperature in °C"/><div class="dn-note" data-role="note" aria-live="polite"></div><div class="dn-cap">Drag the temperature. Browning — and therefore flavour — only really starts around 140°C.</div></div>
</div>

<style>
#pg-doneness-maillard .pg-stage{display:grid;gap:.7rem}
#pg-doneness-maillard .dn-title{font-weight:600;color:var(--ink,#e9eef8)}
#pg-doneness-maillard .dn-readout{display:flex;flex-wrap:wrap;align-items:baseline;gap:.6rem}
#pg-doneness-maillard .dn-readout b{font-size:1.5rem;color:var(--ink,#fff);font-variant-numeric:tabular-nums}
#pg-doneness-maillard .dn-zone{font-weight:600}
#pg-doneness-maillard .dn-track{position:relative;height:16px;border-radius:8px;overflow:hidden;background:#0c1424;border:1px solid #2a3a5e}
#pg-doneness-maillard .dn-seg{position:absolute;top:0;bottom:0;opacity:.85}
#pg-doneness-maillard .dn-marker{position:absolute;top:-4px;width:3px;height:24px;background:#fff;border-radius:2px;box-shadow:0 0 6px rgba(255,255,255,.6);transform:translateX(-1.5px)}
#pg-doneness-maillard .dn-slider{width:100%;margin:0;accent-color:#2dd4bf}
#pg-doneness-maillard .dn-note{min-height:3.2em;color:var(--ink-dim,#cdd6ea);font-size:.95rem;line-height:1.5;border-left:2px solid #fbbf24;padding-left:.8rem}
#pg-doneness-maillard .dn-cap{color:var(--ink-dim,#9fb0c8);font-size:.85rem}
</style>

<script type="application/pg">
(function(){
var CONFIG={"domId":"pg-doneness-maillard","title":"How hot is the pan?","unit":"°C","min":20,"max":240,"start":150,"caption":"Drag the temperature. Browning — and therefore flavour — only really starts around 140°C.","zones":[{"from":20,"label":"Just warm","colour":"#3a4a6e","note":"Nothing much happens. Food added now will sweat and steam rather than colour."},{"from":100,"label":"Boiling off water","colour":"#22d3ee","note":"Surface moisture escapes. Until it has gone, the surface cannot get hotter than ~100°C, so it stays pale."},{"from":140,"label":"Maillard browning","colour":"#fbbf24","note":"The Maillard reaction kicks in: amino acids and sugars build hundreds of new flavour and aroma compounds. This is the brown crust you actually want."},{"from":180,"label":"Caramelising","colour":"#f97316","note":"Sugars themselves break down and caramelise — deeper, sweeter, faintly bitter notes."},{"from":210,"label":"Burning","colour":"#ef4444","note":"Past the useful range. Acrid, bitter compounds now dominate. Lower the heat."}]};
var root=document.getElementById("pg-doneness-maillard");
if(!root)return;
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s){return root.querySelector(s);};
var $$=function(s){return Array.prototype.slice.call(root.querySelectorAll(s));};
var zones=(CONFIG.zones||[]).slice().sort(function(a,b){return a.from-b.from;});
var unit=CONFIG.unit||'';
var min=(typeof CONFIG.min==='number')?CONFIG.min:0;
var max=(typeof CONFIG.max==='number')?CONFIG.max:100;
var slider=$('[data-role=slider]'),valEl=$('[data-role=val]'),zoneEl=$('[data-role=zone]'),noteEl=$('[data-role=note]'),track=$('[data-role=track]');
var marker=null;
function pct(v){if(max===min)return 0;return Math.max(0,Math.min(100,(v-min)/(max-min)*100));}
function zoneAt(v){var z=zones.length?zones[0]:null;for(var i=0;i<zones.length;i++){if(v>=zones[i].from)z=zones[i];}return z;}
function renderSegs(){if(!track)return;var h='';for(var i=0;i<zones.length;i++){var from=zones[i].from,to=(i+1<zones.length)?zones[i+1].from:max;var l=pct(from),w=pct(to)-pct(from);h+='<div class="dn-seg" style="left:'+l.toFixed(2)+'%;width:'+w.toFixed(2)+'%;background:'+(zones[i].colour||'#39496e')+'"></div>';}h+='<div class="dn-marker" data-role="marker"></div>';track.innerHTML=h;marker=$('[data-role=marker]');}
function upd(){if(!slider)return;var v=+slider.value;if(valEl)valEl.textContent=v+unit;var z=zoneAt(v);if(zoneEl){zoneEl.textContent=z?z.label:'';zoneEl.style.color=(z&&z.colour)?z.colour:'inherit';}if(noteEl)noteEl.textContent=(z&&z.note)?z.note:'';if(marker)marker.style.left=pct(v)+'%';}
renderSegs();
if(slider)slider.addEventListener('input',upd);
upd();
})();
</script>

## Cook to the reaction, not the clock

Recipes say "fry for four minutes" because they cannot see your pan. The chemistry is the real instruction: get the surface hot and dry enough to brown, then pull it before the sugars tip into bitterness much past 200°C. Once you are cooking to what's happening rather than to the timer, you stop steaming things by accident — and you start getting that crust on purpose.

A French doctor worked this out over a century ago, and most of us are still crowding the pan. It turns out the recipe was never really about the minutes.
