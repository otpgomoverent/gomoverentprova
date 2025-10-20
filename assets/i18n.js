
/*! Lightweight i18n v2 — supports:
    - Floating selector (top-right), persistence, ?lang=
    - __titles__            : per-page titles
    - [data-i18n]           : keyed elements (text/html)
    - [data-i18n-attr]      : attribute translation via data-i18n-*
    - __selectors__         : CSS selector → {text|html|attr}
    - __replace__           : raw textContent exact replacements (global)
    - __attrsReplace__      : { selector: {attrName: { "IT": "EN", ... } } }
*/
(function(){
  const SUPPORTED = ["it","en"];
  const DEF = "it";
  const qs = new URLSearchParams(location.search);
  const fromQS = qs.get("lang");
  const saved = localStorage.getItem("lang");
  let lang = (fromQS && SUPPORTED.includes(fromQS)) ? fromQS : (saved && SUPPORTED.includes(saved) ? saved : (document.documentElement.lang||DEF));
  if (!SUPPORTED.includes(lang)) lang = DEF;

  function setLang(newLang, persist=true){
    if (!SUPPORTED.includes(newLang)) return;
    lang = newLang;
    document.documentElement.setAttribute("lang", lang);
    if (persist) localStorage.setItem("lang", lang);
    loadAndApply();
  }

  async function loadJSON(url){
    try { const res = await fetch(url, {cache:"no-cache"}); if (!res.ok) throw new Error(res.statusText); return await res.json(); }
    catch(e){ console.warn("i18n: cannot load", url, e); return {}; }
  }

  // Walk text nodes and replace exact matches
  function replaceTextNodes(root, mapping){
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const toChange = [];
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.nodeValue.trim();
      if (!txt) continue;
      const repl = mapping[txt];
      if (typeof repl === "string") {
        toChange.push({node, val: node.nodeValue, newVal: node.nodeValue.replace(txt, repl)});
      }
    }
    toChange.forEach(({node,newVal})=> node.nodeValue = newVal);
  }

  function applyTranslations(dict){
    // Titles
    if (dict["__titles__"]){
      const page = (location.pathname.split('/').pop() || "index.html");
      if (dict["__titles__"][page]) document.title = dict["__titles__"][page];
    }

    // data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (typeof val === "string") el.textContent = val;
      else if (val && typeof val === "object"){
        if (val.text != null) el.textContent = val.text;
        if (val.html != null) el.innerHTML = val.html;
      }
    });

    // data-i18n-attr
    document.querySelectorAll("[data-i18n-attr]").forEach(el=>{
      const attrs = (el.getAttribute("data-i18n-attr")||"").split("|").map(s=>s.trim()).filter(Boolean);
      attrs.forEach(attr=>{
        const key = el.getAttribute("data-i18n-"+attr) || el.getAttribute("data-i18n-"+attr.toLowerCase());
        if (key && dict[key] != null) el.setAttribute(attr, dict[key]);
      });
    });

    // __selectors__
    if (dict["__selectors__"]){
      for (const [sel, conf] of Object.entries(dict["__selectors__"])) {
        document.querySelectorAll(sel).forEach(el=>{
          if (typeof conf === "string") { el.textContent = conf; }
          else if (conf && typeof conf === "object"){
            if (conf.text != null) el.textContent = conf.text;
            if (conf.html != null) el.innerHTML = conf.html;
            if (conf.attr && typeof conf.attr === "object"){
              for (const [k,v] of Object.entries(conf.attr)) el.setAttribute(k, v);
            }
          }
        });
      }
    }

    // __attrsReplace__ — replace attribute values that are exact IT→EN
    if (dict["__attrsReplace__"]) {
      for (const [sel, attrs] of Object.entries(dict["__attrsReplace__"])) {
        document.querySelectorAll(sel).forEach(el=>{
          for (const [attrName, map] of Object.entries(attrs)){
            const cur = el.getAttribute(attrName);
            if (cur && map[cur] != null) el.setAttribute(attrName, map[cur]);
          }
        });
      }
    }

    // __replace__ — global raw text replacements
    if (dict["__replace__"]) {
      replaceTextNodes(document.body, dict["__replace__"]);
    }

    // Sync selector label
    const sel = document.getElementById("langSelect");
    if (sel) sel.value = lang;
    const label = document.querySelector('label[for="langSelect"]');
    if (label) label.textContent = (lang === "it" ? "Lingua:" : "Language:");
  }

  async function loadAndApply(){
    const dict = await loadJSON(`assets/lang/${lang}.json`);
    applyTranslations(dict);
  }

  // Inject floating selector
  function injectSelector(){
    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      position:"fixed", top:"12px", right:"12px", zIndex:"9999",
      background:"rgba(255,255,255,.9)", border:"1px solid #ddd",
      borderRadius:"10px", padding:"6px 8px", boxShadow:"0 4px 16px rgba(0,0,0,.08)",
      fontFamily:"Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif", fontSize:"14px"
    });
    const label = document.createElement("label");
    label.htmlFor = "langSelect";
    label.style.marginRight = "6px";
    label.textContent = (lang === "it" ? "Lingua:" : "Language:");

    const select = document.createElement("select");
    select.id = "langSelect";
    select.setAttribute("aria-label","Language selector");
    ["it","en"].forEach(code=>{
      const o = document.createElement("option");
      o.value = code;
      o.textContent = (code === "it" ? "Italiano" : "English");
      select.appendChild(o);
    });
    select.value = lang;
    select.addEventListener("change", e=> setLang(e.target.value));

    wrap.appendChild(label); wrap.appendChild(select);
    document.body.appendChild(wrap);
  }

  window.addEventListener("DOMContentLoaded", ()=>{ injectSelector(); loadAndApply(); });
})();
