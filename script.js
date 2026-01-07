let data = [];
let currentPortal = null;

fetch("data.json")
  .then(response => response.json())
  .then(json => data = json);

document.querySelectorAll(".portal-btn").forEach(button => {
  button.addEventListener("click", () => {
    currentPortal = button.dataset.portal;
    renderTiles();
  });
});

document.getElementById("searchInput")
  .addEventListener("input", renderTiles);

function renderTiles() {
  const container = document.getElementById("tiles");
  const search = document.getElementById("searchInput").value.toLowerCase();

  container.innerHTML = "";

  if (!currentPortal) return;

  data
    .filter(item => item.portal === currentPortal)
    .filter(item =>
      item.rubrique.toLowerCase().includes(search) ||
      item.contenu.toLowerCase().includes(search)
    )
    .forEach(item => {
      const tile = document.createElement("div");
      tile.className = "tile";

      tile.innerHTML = `
        <h3>${item.rubrique}</h3>
        <p>${item.contenu}</p>
        <ul>
          ${item.liens.map(lien =>
            lien.startsWith("http")
              ? `<li><a href="${lien}" target="_blank">${lien}</a></li>`
              : `<li>${lien}</li>`
          ).join("")}
        </ul>
      `;

      container.appendChild(tile);
    });
}
