// assets/vehicles.js — disegna le card dai dati JSON
(async () => {
  try {
    const res = await fetch("/assets/data/vehicles.json", { cache: "no-cache" });
    const data = await res.json();
    const items = Array.isArray(data.items) ? data.items : [];

    const path = location.pathname.toLowerCase();
    let filterType = null;
    if (path.includes("auto.html")) filterType = (v)=> v.type === "car";
    if (path.includes("moto.html")) filterType = (v)=> (v.type === "scooter" || v.type === "motorbike");

    const list = filterType ? items.filter(filterType) : items;

    const mount = document.querySelector("#fleetList") || document.querySelector(".fleet-grid") || document.querySelector("#cards");
    if (!mount) return;
    mount.innerHTML = "";

    for (const v of list) {
      const img = (v.images && v.images[0] && v.images[0].url) || "assets/placeholder.jpg";
      const cat = v.category || (v.type === "car" ? "City Car" : v.type === "scooter" ? "Scooter" : "Motorbike");
      const price = `€ ${v.price_per_day}/day`;
      const bookUrl = `prenota.html?vehicle=${encodeURIComponent(v.id)}`;
      const calcUrl = `preventivo.html?vehicle=${encodeURIComponent(v.id)}`;
      const badge = v.available ? '<span class="badge ok">Available</span>' : '<span class="badge ko">Unavailable</span>';

      const el = document.createElement("article");
      el.className = "card vehicle";
      el.innerHTML = `
        <img src="${img}" alt="${v.brand} ${v.model}" class="cover">
        <div class="pad">
          <h3>${v.brand} ${v.model} ${badge}</h3>
          <div class="muted">${cat}</div>
          <div class="price"><b>${price}</b></div>
          <div class="row gap">
            <a class="btn primary" href="${bookUrl}">Prenota</a>
            <a class="btn" href="${calcUrl}">Calcola</a>
          </div>
        </div>
      `;
      mount.appendChild(el);
    }
  } catch (e) {
    console.warn("vehicles.js error:", e);
  }
})();
