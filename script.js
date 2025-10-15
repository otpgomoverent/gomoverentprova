function euro(n){ return (n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}); }
function daysBetween(s,e){ const ms=new Date(e)-new Date(s); if(isNaN(ms) || ms<=0) return 0; const days=Math.ceil(ms/86400000); return Math.max(1, days); }
function seasonMultiplier(d){ if(!d) return 1; const m=new Date(d).getMonth()+1; if(m===7||m===8) return 1.2; if(m===6||m===9) return 1.1; return 1.0; }
const modelPrices={"Fiat Panda":40,"Smart ForFour (automatico)":48,"Jeep Renegade":60,"SYM Symphony 125":30,"Honda X-ADV 750":80};
function basePriceFor(category, model){ const map={utilitaria:45,suv:59,scooter:25,moto:60}; if(model && modelPrices[model]) return modelPrices[model]; return map[category]||40; }

function calcQuote(data){
  const days=data.days||1;
  let daily=basePriceFor(data.category,data.model)*seasonMultiplier(data.start);
  if(days>=7) daily*=0.9; if(days>=14) daily*=0.85;
  let totale=daily*days;
  const items=[{voce:`Tariffa base (${days} g x ${euro(daily)})`, importo:daily*days}];
  if(data.gps){ const p=5*days; items.push({voce:`Navigatore (${days} g x ${euro(5)})`, importo:p}); totale+=p }
  if(data.seat){ const p=4*days; items.push({voce:`Seggiolino (${days} g x ${euro(4)})`, importo:p}); totale+=p }
  if(data.extraIns){ const p=8*days; items.push({voce:`Assicurazione extra (${days} g x ${euro(8)})`, importo:p}); totale+=p }
  if(data.age && data.age<25){ const add=totale*0.12; items.push({voce:`Sovrattassa giovane conducente (12%)`, importo:add}); totale+=add }
  const imponibile=Number((totale/1.22).toFixed(2)); const iva=Number((totale-imponibile).toFixed(2)); return {days,daily,items,imponibile,iva,totale};
}

function renderResult(r){ const box=document.getElementById('result'); if(!r){ box.innerHTML=''; return; }
  let html=`<div class="breakdown"><strong>Totale: ${euro(r.totale)}</strong><div style="color:var(--muted);font-size:13px;margin-top:6px">(Imponibile ${euro(r.imponibile)} — IVA ${euro(r.iva)})</div><ul style="margin:10px 0 0;padding-left:18px">`;
  r.items.forEach(it=> html+=`<li style="margin:6px 0">${it.voce} — <strong>${euro(it.importo)}</strong></li>`);
  html+=`</ul><p style="margin:8px 0 0;color:var(--muted);font-size:12px">Stima non vincolante.</p></div>`;
  box.innerHTML=html;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('quoteForm').addEventListener('submit', function(e){ e.preventDefault(); const start=document.getElementById('start').value; const end=document.getElementById('end').value; const cat=document.getElementById('category').value; const model=document.getElementById('model').value; const age=Number(document.getElementById('age').value)||0; const gps=document.getElementById('gps').checked; const seat=document.getElementById('seat').checked; const extraIns=document.getElementById('extraIns').checked; const days=daysBetween(start,end); const data={start,end,category:cat,model,age,gps,seat,extraIns,days}; renderResult(calcQuote(data)); });
  document.getElementById('miniQuote').addEventListener('click', function(){ const start=document.getElementById('start').value || new Date().toISOString().slice(0,10); const end=document.getElementById('end').value || new Date(Date.now()+24*86400000).toISOString().slice(0,10); const days=daysBetween(start,end); const model=document.getElementById('model').value; const cat=document.getElementById('category').value; const tot=calcQuote({start,end,category:cat,model,days}).totale; document.getElementById('result').textContent=`Stima: ${euro(tot)} per ${days} giorno/i.`; });
  document.getElementById('year').textContent=new Date().getFullYear();
});