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

function closeAllTilesExcept(tileEl){
  const tiles = tilesEl.querySelectorAll(".tile.open");
  tiles.forEach(t => {
    if(t !== tileEl) t.classList.remove("open");
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
      <div class="tile-head">
        <div>
          <h3 class="tile-title">${highlight(rub.title, q)}</h3>
          <div class="tile-meta">
            ${count} élément${count > 1 ? "s" : ""} <span class="pill">${currentPortal}</span>
          </div>
        </div>
        <button class="tile-toggle" type="button" aria-expanded="false">Ouvrir</button>
      </div>

      <div class="tile-body"></div>
    `;

    const toggleBtn = tile.querySelector(".tile-toggle");
    const body = tile.querySelector(".tile-body");

    // Contenu accordéons (items)
    const itemsHtml = (rub.items || []).map(it => {
      const links = (it.links || []).filter(Boolean);

      const linksHtml = links.length
        ? `<div class="links">
            ${links.map(l => {
              if(isUrl(l)){
                return `
                  <div class="link-row">
                    <a class="link-btn" href="${escapeHtml(l)}" target="_blank" rel="noopener noreferrer">
                      Ouvrir le lien
                    </a>
                  </div>
                `;
              }
              // lien non-URL : texte d’info, sans bouton
              return `
                <div class="link-row">
                  <div class="bad-link">${highlight(l, q)}</div>
                </div>
              `;
            }).join("")}
          </div>`
        : `<div class="links"><div class="bad-link">(aucun lien)</div></div>`;

      return `
        <details class="accordion">
          <summary>${highlight(it.label || "", q)}</summary>
          ${it.text ? `<p class="item-text">${highlight(it.text, q)}</p>` : `<p class="item-text"><i>(pas de texte)</i></p>`}
          ${linksHtml}
        </details>
      `;
    }).join("");

    body.innerHTML = itemsHtml;

    // Ouverture/fermeture tuile
    toggleBtn.addEventListener("click", () => {
      const willOpen = !tile.classList.contains("open");
      if(willOpen) closeAllTilesExcept(tile);

      tile.classList.toggle("open", willOpen);
      toggleBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      toggleBtn.textContent = willOpen ? "Fermer" : "Ouvrir";

      if(willOpen && q){
        body.querySelectorAll("details.accordion").forEach(d => d.open = true);
      }
    });

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
    hintEl.textContent = `Portail actif : ${currentPortal}. Clique sur une tuile pour dérouler les textes.`;
    render();
  });
});

searchInput.addEventListener("input", render);

fetch("data.json")
  .then(r => r.json())
  .then(json => {
    DB = json;
    // Sélectionner SFP par défaut
    const sfpBtn = portalBtns.find(btn => btn.dataset.portal === "SFP");
    if(sfpBtn) sfpBtn.click();
    else render();
  })
  .catch(() => {
    tilesEl.innerHTML = `<div class="empty">Erreur : impossible de charger <b>data.json</b>. Vérifie que le fichier est à la racine du dépôt.`;
  });
