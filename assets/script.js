
function euro(n){ return (n||0).toLocaleString('it-IT',{style:'currency',currency:'EUR'}); }
function daysBetween(s,e){ const ms=new Date(e)-new Date(s); if(isNaN(ms) || ms<=0) return 0; const days=Math.ceil(ms/86400000); return Math.max(1, days); }
function seasonMultiplier(d){ if(!d) return 1; const m=new Date(d).getMonth()+1; if(m===7||m===8) return 1.2; if(m===6||m===9) return 1.1; return 1.0; }
const modelPrices={"Fiat Panda":40,"Smart ForFour (automatico)":48,"Jeep Renegade":60,"SYM Symphony 125":30,"Honda X-ADV 750":80};
function basePriceFor(category, model){ const map={city:45,berlina:49,suv:59,scooter:25,moto:60,utilitaria:45}; if(model && modelPrices[model]) return modelPrices[model]; return map[category]||45; }

function calcQuote(data){
  const days=data.days||1;
  let daily=basePriceFor(data.category,data.model)*seasonMultiplier(data.start);
  if(days>=7) daily*=0.9; if(days>=14) daily*=0.85;
  let totale=daily*days;
  const items=[{voce:`Tariffa base (${days} g x ${euro(daily)})`, importo:daily*days}];
  if(data.gps){ const p=5*days; items.push({voce:`Navigatore (${days} g x ${euro(5)})`, importo:p}); totale+=p }
  if(data.seat){ const p=4*days; items.push({voce:`Seggiolino (${days} g x ${euro(4)})`, importo:p}); totale+=p }
  if(data.extraIns){ const p=8*days; items.push({voce:`Kasko totale (${days} g x ${euro(8)})`, importo:p}); totale+=p }
  if(data.extraDriver){ const p=6*days; items.push({voce:`Guidatore aggiuntivo (${days} g x ${euro(6)})`, importo:p}); totale+=p }
  if(data.age && data.age<25){ const add=totale*0.12; items.push({voce:`Sovrattassa giovane conducente (12%)`, importo:add}); totale+=add }
  const imponibile=Number((totale/1.22).toFixed(2)); const iva=Number((totale-imponibile).toFixed(2)); return {days,daily,items,imponibile,iva,totale};
}

function renderSummary(r){
  const box = document.getElementById('summary');
  let rows = `<tr><th>Giorni</th><td>${r.days}</td></tr>`;
  r.items.forEach(it=> rows += `<tr><th>${it.voce}</th><td>${euro(it.importo)}</td></tr>`);
  rows += `<tr><th>Imponibile</th><td>${euro(r.imponibile)}</td></tr>`;
  rows += `<tr><th>IVA</th><td>${euro(r.iva)}</td></tr>`;
  rows += `<tr><th><strong>Totale</strong></th><td><strong>${euro(r.totale)}</strong></td></tr>`;
  box.innerHTML = `<div class="summary"><table>${rows}</table></div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quoteForm');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const start=document.getElementById('start').value;
    const end=document.getElementById('end').value;
    const cat=document.getElementById('category').value;
    const model=document.getElementById('model').value;
    const age=Number(document.getElementById('age').value)||0;
    const gps=document.getElementById('gps').checked;
    const seat=document.getElementById('seat').checked;
    const extraIns=document.getElementById('extraIns').checked;
    const extraDriver=document.getElementById('extraDriver').checked;
    const days=daysBetween(start,end);
    const data={start,end,category:cat,model,age,gps,seat,extraIns,extraDriver,days};
    renderSummary(calcQuote(data));
  });
  document.getElementById('copyLink').addEventListener('click', () => {
    const q = new URLSearchParams({
      start:document.getElementById('start').value,
      end:document.getElementById('end').value,
      cat:document.getElementById('category').value,
      model:document.getElementById('model').value
    });
    const url = location.origin + location.pathname + '?' + q.toString();
    navigator.clipboard.writeText(url).then(()=>{
      const msg = document.getElementById('copied'); msg.textContent='Link copiato!'; setTimeout(()=>msg.textContent='',1500);
    });
  });
});
