let DB = null;
let currentPortal = null;
let currentRubrique = null;

const tilesEl = document.getElementById("tiles");
const searchInput = document.getElementById("searchInput");
const hintEl = document.getElementById("hint");

const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");
const panelKicker = document.getElementById("panelKicker");
const panelBody = document.getElementById("panelBody");
const closePanelBtn = document.getElementById("closePanelBtn");
const backdrop = document.getElementById("backdrop");

const resetBtn = document.getElementById("resetBtn");
const portalButtons = [...document.querySelectorAll(".btn[data-portal]")];

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function highlight(text, q){
  if(!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  // On surligne dans la version échappée => simple et suffisant ici
  const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
  return safe.replace(re, (m) => `<mark>${m}</mark>`);
}

function isUrl(s){
  return typeof s === "string" && /^https?:\/\/\S+/i.test(s.trim());
}

function openPanel(){
  panel.classList.add("open");
  panel.setAttribute("aria-hidden", "false");
  backdrop.hidden = false;
}

function closePanel(){
  panel.classList.remove("open");
  panel.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
  currentRubrique = null;
}

closePanelBtn.addEventListener("click", closePanel);
backdrop.addEventListener("click", closePanel);
document.addEventListener("keydown", (e) => {
  if(e.key === "Escape") closePanel();
});

resetBtn.addEventListener("click", () => {
  currentPortal = null;
  currentRubrique = null;
  portalButtons.forEach(b => b.classList.remove("active"));
  resetBtn.style.display = "none";
  hintEl.textContent = "Choisis un portail (SEN ou SFP), puis clique une rubrique.";
  tilesEl.innerHTML = "";
  closePanel();
});

portalButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentPortal = btn.dataset.portal;
    currentRubrique = null;
    portalButtons.forEach(b => b.classList.toggle("active", b === btn));
    resetBtn.style.display = "inline-flex";
    hintEl.textContent = `Portail actif : ${currentPortal}. Clique une rubrique (tuile) pour voir les éléments déroulants.`;
    closePanel();
    renderTiles();
  });
});

searchInput.addEventListener("input", () => {
  renderTiles();
  if(currentRubrique) renderPanel(currentRubrique);
});

fetch("data.json")
  .then(r => r.json())
  .then(json => {
    DB = json;
  })
  .catch(() => {
    tilesEl.innerHTML = `<div class="empty">Erreur : impossible de charger <b>data.json</b> (fichier manquant ou mal placé).</div>`;
  });

function getRubriques(){
  if(!DB || !currentPortal) return [];
  return DB[currentPortal] || [];
}

function matchesRubrique(rub, q){
  if(!q) return true;
  const ql = q.toLowerCase();
  if(rub.name.toLowerCase().includes(ql)) return true;
  return rub.items.some(it =>
    (it.label || "").toLowerCase().includes(ql) ||
    (it.text || "").toLowerCase().includes(ql) ||
    (it.links || []).some(l => (l || "").toLowerCase().includes(ql))
  );
}

function renderTiles(){
  const q = searchInput.value.trim();
  tilesEl.innerHTML = "";

  if(!currentPortal){
    tilesEl.innerHTML = `<div class="empty">Sélectionne <b>SEN</b> ou <b>SFP</b> pour afficher les rubriques.</div>`;
    return;
  }

  const rubriques = getRubriques().filter(r => matchesRubrique(r, q));

  if(!rubriques.length){
    tilesEl.innerHTML = `<div class="empty">Aucun résultat pour <b>${escapeHtml(q)}</b>.</div>`;
    return;
  }

  rubriques.forEach(rub => {
    const tile = document.createElement("div");
    tile.className = "tile";
    const count = rub.items.length;

    tile.innerHTML = `
      <h3 class="tile-title">${highlight(rub.name, q)}</h3>
      <div class="tile-meta">${count} élément${count>1 ? "s" : ""}</div>
    `;

    tile.addEventListener("click", () => {
      currentRubrique = rub.name;
      renderPanel(rub.name);
      openPanel();
    });

    tilesEl.appendChild(tile);
  });
}

function renderPanel(rubriqueName){
  const q = searchInput.value.trim();
  const rubriques = getRubriques();
  const rub = rubriques.find(r => r.name === rubriqueName);

  if(!rub){
    panelTitle.textContent = "";
    panelBody.innerHTML = "";
    return;
  }

  panelKicker.textContent = `Portail : ${currentPortal}`;
  panelTitle.innerHTML = highlight(rub.name, q);

  // Filtrage items dans la rubrique selon la recherche
  const items = (rub.items || []).filter(it => {
    if(!q) return true;
    const ql = q.toLowerCase();
    return (it.label || "").toLowerCase().includes(ql)
      || (it.text || "").toLowerCase().includes(ql)
      || (it.links || []).some(l => (l || "").toLowerCase().includes(ql));
  });

  if(!items.length){
    panelBody.innerHTML = `<div class="empty">Aucun élément dans cette rubrique ne correspond à <b>${escapeHtml(q)}</b>.</div>`;
    return;
  }

  panelBody.innerHTML = items.map(it => {
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
    ` : `<div class="item-text"><i>Pas de lien fourni.</i></div>`;

    return `
      <details ${q ? "open" : ""}>
        <summary>${highlight(it.label || "", q)}</summary>
        <div class="item-text">${highlight(it.text || "", q)}</div>
        ${linksHtml}
      </details>
    `;
  }).join("");
}
