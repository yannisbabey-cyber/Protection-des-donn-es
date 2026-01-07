let DB = null;
let currentPortal = null;

const tilesEl = document.getElementById("tiles");
const hintEl = document.getElementById("hint");
const searchInput = document.getElementById("searchInput");
const portalBtns = Array.from(document.querySelectorAll(".btn[data-portal]"));

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function highlight(text, q){
  const safe = escapeHtml(text);
  if(!q) return safe;
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
  return safe.replace(re, (m) => `<mark>${m}</mark>`);
}

function isUrl(s){
  return typeof s === "string" && /^https?:\/\/\S+/i.test(s.trim());
}

function matchesRubrique(rub, q){
  if(!q) return true;
  const ql = q.toLowerCase();

  if((rub.title || "").toLowerCase().includes(ql)) return true;

  return (rub.items || []).some(it => {
    if((it.label || "").toLowerCase().includes(ql)) return true;
    if((it.text || "").toLowerCase().includes(ql)) return true;
    return (it.links || []).some(l => (l || "").toLowerCase().includes(ql));
  });
}

function render(){
  tilesEl.innerHTML = "";

  if(!DB){
    tilesEl.innerHTML = `<div class="empty">Chargement des données…</div>`;
    return;
  }
  if(!currentPortal){
    tilesEl.innerHTML = `<div class="empty">Sélectionne <b>SEN</b> ou <b>SFP</b> pour afficher les rubriques.</div>`;
    return;
  }

  const q = (searchInput.value || "").trim();
  const rubriques = (DB[currentPortal] || []).filter(r => matchesRubrique(r, q));

  if(!rubriques.length){
    tilesEl.innerHTML = `<div class="empty">Aucun résultat pour <b>${escapeHtml(q)}</b>.</div>`;
    return;
  }

  rubriques.forEach(rub => {
    const tile = document.createElement("article");
    tile.className = "tile";
    tile.style.setProperty("--rubColor", rub.color || "#e5e7eb");

    const count = (rub.items || []).length;

    tile.innerHTML = `
      <div class="tile-top">
        <h3 class="tile-title">${highlight(rub.title, q)}</h3>
        <div class="tile-sub">
          ${count} élément${count > 1 ? "s" : ""} <span class="badge">${currentPortal}</span>
        </div>
      </div>
      <div class="tile-body">
        ${(rub.items || []).map(it => {
          const links = (it.links || []).filter(Boolean);
          const linksHtml = links.length ? `
            <ul class="links">
              ${links.map(l => {
                const label = escapeHtml(l);
                return isUrl(l)
                  ? `<li><a href="${escapeHtml(l)}" target="_blank" rel="noopener noreferrer">${label}</a></li>`
                  : `<li>${label}</li>`;
              }).join("")}
            </ul>
          ` : `<ul class="links"><li><i>(aucun lien)</i></li></ul>`;

          return `
            <div class="item">
              <div class="item-head">${highlight(it.label || "", q)}</div>
              ${it.text ? `<p class="item-text">${highlight(it.text, q)}</p>` : `<p class="item-text"><i>(pas de texte)</i></p>`}
              ${linksHtml}
            </div>
          `;
        }).join("")}
      </div>
    `;

    tilesEl.appendChild(tile);
  });
}

portalBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    currentPortal = btn.dataset.portal;
    portalBtns.forEach(b => {
      const active = b === btn;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", active ? "true" : "false");
    });
    hintEl.textContent = `Portail actif : ${currentPortal}.`;
    render();
  });
});

searchInput.addEventListener("input", render);

fetch("data.json")
  .then(r => r.json())
  .then(json => {
    DB = json;
    render();
  })
  .catch(() => {
    tilesEl.innerHTML = `<div class="empty">Erreur : impossible de charger <b>data.json</b>. Vérifie que le fichier est à la racine du dépôt.</div>`;
  });
