
/*! Lightweight i18n for static sites — drop-in
    Features:
    - Floating language selector (top-right)
    - Persists choice (localStorage) + ?lang=
    - Applies translations via [data-i18n] keys OR "selectors" mapping in JSON
    - Updates placeholders and generic attributes via data-i18n-attr
*/
(function(){
  const SUPPORTED = ["it","en"];
  const DEF = "it";
  const qs = new URLSearchParams(location.search);
  const fromQS = qs.get("lang");
  const saved = localStorage.getItem("lang");
  let lang = (fromQS && SUPPORTED.includes(fromQS)) ? fromQS : (saved && SUPPORTED.includes(saved) ? saved : document.documentElement.lang || DEF);
  if (!SUPPORTED.includes(lang)) lang = DEF;

  function setLang(newLang, persist=true){
    if (!SUPPORTED.includes(newLang)) return;
    lang = newLang;
    document.documentElement.setAttribute("lang", lang);
    if (persist) localStorage.setItem("lang", lang);
    loadAndApply();
  }

  async function loadJSON(url){
    try {
      const res = await fetch(url, {cache:"no-cache"});
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    } catch(e){
      console.warn("i18n: cannot load", url, e);
      return {};
    }
  }

  function applyTranslations(dict){
    // 1) document title
    if (dict["__titles__"] && dict["__titles__"][location.pathname.split('/').pop() || "index.html"]) {
      document.title = dict["__titles__"][location.pathname.split('/').pop() || "index.html"];
    }

    // 2) data-i18n keys
    document.querySelectorAll("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      const val = dict[key];
      if (typeof val === "string") {
        el.textContent = val;
      } else if (val && typeof val === "object") {
        if (val.text != null) el.textContent = val.text;
        if (val.html != null) el.innerHTML = val.html;
      }
    });

    // 3) data-i18n-attr="placeholder|aria-label|title"
    document.querySelectorAll("[data-i18n-attr]").forEach(el=>{
      const attrs = (el.getAttribute("data-i18n-attr")||"").split("|").map(s=>s.trim()).filter(Boolean);
      attrs.forEach(attr=>{
        const key = el.getAttribute("data-i18n-"+attr) || el.getAttribute("data-i18n-"+attr.toLowerCase());
        if (key && dict[key] != null) {
          el.setAttribute(attr, dict[key]);
        }
      });
    });

    // 4) selectors mapping (no markup changes needed)
    if (dict["__selectors__"]) {
      for (const [sel, conf] of Object.entries(dict["__selectors__"])) {
        document.querySelectorAll(sel).forEach(el=>{
          if (typeof conf === "string") {
            el.textContent = conf;
          } else if (conf && typeof conf === "object") {
            if (conf.text != null) el.textContent = conf.text;
            if (conf.html != null) el.innerHTML = conf.html;
            if (conf.attr && typeof conf.attr === "object") {
              for (const [k,v] of Object.entries(conf.attr)) {
                el.setAttribute(k, v);
              }
            }
          }
        });
      }
    }
  }

  async function loadAndApply(){
    const dict = await loadJSON(`assets/lang/${lang}.json`);
    applyTranslations(dict);
    // Reflect selection in UI
    const sel = document.getElementById("langSelect");
    if (sel) sel.value = lang;
  }

  // Inject floating selector (top-right, safe)
  function injectSelector(){
    const wrap = document.createElement("div");
    wrap.style.position = "fixed";
    wrap.style.top = "12px";
    wrap.style.right = "12px";
    wrap.style.zIndex = "9999";
    wrap.style.background = "rgba(255,255,255,.9)";
    wrap.style.backdropFilter = "saturate(1.2) blur(2px)";
    wrap.style.border = "1px solid #ddd";
    wrap.style.borderRadius = "10px";
    wrap.style.padding = "6px 8px";
    wrap.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)";
    wrap.style.fontFamily = "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    wrap.style.fontSize = "14px";

    const label = document.createElement("label");
    label.textContent = lang === "it" ? "Lingua:" : "Language:";
    label.htmlFor = "langSelect";
    label.style.marginRight = "6px";

    const select = document.createElement("select");
    select.id = "langSelect";
    select.setAttribute("aria-label","Language selector");
    ["it","en"].forEach(code=>{
      const o = document.createElement("option");
      o.value = code;
      o.textContent = code === "it" ? "Italiano" : "English";
      select.appendChild(o);
    });
    select.value = lang;
    select.addEventListener("change", (e)=>{
      setLang(e.target.value);
    });

    wrap.appendChild(label);
    wrap.appendChild(select);
    document.body.appendChild(wrap);
  }

  window.addEventListener("DOMContentLoaded", ()=>{
    injectSelector();
    loadAndApply();
  });
})();
