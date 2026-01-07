let DATA = null;
let currentPortal = null;

const tiles = document.getElementById("tiles");
const searchInput = document.getElementById("search");
const portalButtons = document.querySelectorAll(".portals button");

fetch("data.json")
  .then(r => r.json())
  .then(json => DATA = json);

portalButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    portalButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentPortal = btn.dataset.portal;
    render();
  });
});

searchInput.addEventListener("input", render);

function render() {
  if (!currentPortal || !DATA) return;

  const q = searchInput.value.toLowerCase();
  tiles.innerHTML = "";

  DATA[currentPortal].forEach(rubrique => {
    if (
      q &&
      !rubrique.name.toLowerCase().includes(q) &&
      !rubrique.items.some(i =>
        i.label.toLowerCase().includes(q) ||
        i.text.toLowerCase().includes(q)
      )
    ) return;

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.setProperty("--color", rubrique.color);

    tile.innerHTML = `
      <h3>${rubrique.name}</h3>
      ${rubrique.items.map(item => `
        <div class="item">
          <div class="item-title">${item.label}</div>
          <div class="item-text">${item.text}</div>
          ${item.links.map(l =>
            l.startsWith("http")
              ? `<a href="${l}" target="_blank">Lien</a>`
              : `<div class="item-text"><i>${l}</i></div>`
          ).join("")}
        </div>
      `).join("")}
    `;

    tiles.appendChild(tile);
  });
}
