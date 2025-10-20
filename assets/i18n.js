
(function(){
  const SUPPORTED=["it","en"]; const DEF="it";
  const qs=new URLSearchParams(location.search); const fromQS=qs.get("lang");
  const saved=localStorage.getItem("lang");
  let lang=(fromQS&&SUPPORTED.includes(fromQS))?fromQS:(saved&&SUPPORTED.includes(saved)?saved:(document.documentElement.lang||DEF));
  if(!SUPPORTED.includes(lang)) lang=DEF;

  async function loadJSON(u){try{const r=await fetch(u,{cache:"no-cache"}); if(!r.ok) throw new Error(r.statusText); return await r.json();}catch(e){console.warn("i18n load",u,e); return {};}}

  function replaceExact(root,map){
    const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); let n; const ops=[];
    while((n=w.nextNode())){ const raw=n.nodeValue; const t=raw.trim(); if(!t) continue; if(map[t]!=null){ ops.push([n, raw.replace(t,map[t])]); } }
    ops.forEach(([node,val])=> node.nodeValue=val);
  }
  function replacePartial(root,map){
    const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null); let n; const ops=[];
    while((n=w.nextNode())){ let raw=n.nodeValue; let ch=false; for(const[k,v] of Object.entries(map)){ if(k && raw.includes(k)){ raw=raw.split(k).join(v); ch=true; } } if(ch) ops.push([n,raw]); }
    ops.forEach(([node,val])=> node.nodeValue=val);
  }

  function apply(dict){
    if(dict["__titles__"]){ const page=(location.pathname.split('/').pop()||"index.html"); if(dict["__titles__"][page]) document.title=dict["__titles__"][page]; }
    if(dict["__selectors__"]){
      for(const[sel,conf] of Object.entries(dict["__selectors__"])) document.querySelectorAll(sel).forEach(el=>{
        if(typeof conf==="string"){ el.textContent=conf; }
        else if(conf && typeof conf==="object"){
          if(conf.text!=null) el.textContent=conf.text;
          if(conf.html!=null) el.innerHTML=conf.html;
          if(conf.attr){ for(const[k,v] of Object.entries(conf.attr)) el.setAttribute(k,v); }
        }
      });
    }
    if(dict["__attrsReplace__"]){
      for(const[sel,attrs] of Object.entries(dict["__attrsReplace__"])) document.querySelectorAll(sel).forEach(el=>{
        for(const[a,m] of Object.entries(attrs)){ const cur=el.getAttribute(a); if(cur && m[cur]!=null) el.setAttribute(a,m[cur]); }
      });
    }
    if(dict["__replace__"]) replaceExact(document.body, dict["__replace__"]);
    if(dict["__replacePartial__"]) replacePartial(document.body, dict["__replacePartial__"]);
    const sel=document.getElementById("langSelect"); if(sel) sel.value=lang;
    const label=document.querySelector('label[for="langSelect"]'); if(label) label.textContent=(lang==="it"?"Lingua:":"Language:");
  }

  function inject(){
    const wrap=document.createElement("div");
    Object.assign(wrap.style,{position:"fixed",top:"12px",right:"12px",zIndex:"9999",background:"rgba(255,255,255,.9)",border:"1px solid #ddd",borderRadius:"10px",padding:"6px 8px",boxShadow:"0 4px 16px rgba(0,0,0,.08)",fontFamily:"Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",fontSize:"14px"});
    const label=document.createElement("label"); label.htmlFor="langSelect"; label.style.marginRight="6px"; label.textContent=(lang==="it"?"Lingua:":"Language:");
    const select=document.createElement("select"); select.id="langSelect"; select.setAttribute("aria-label","Language selector");
    ["it","en"].forEach(c=>{ const o=document.createElement("option"); o.value=c; o.textContent=(c==="it"?"Italiano":"English"); select.appendChild(o); });
    select.value=lang;
    select.addEventListener("change", e=>{ lang=e.target.value; localStorage.setItem("lang",lang); loadJSON(`assets/lang/${lang}.json`).then(apply); document.documentElement.setAttribute("lang",lang); });
    wrap.appendChild(label); wrap.appendChild(select); document.body.appendChild(wrap);
  }

  window.addEventListener("DOMContentLoaded", ()=>{ inject(); loadJSON(`assets/lang/${lang}.json`).then(apply); });
})();
