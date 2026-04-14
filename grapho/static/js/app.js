// Sidebar toggle
document.getElementById("sidebar-toggle").addEventListener("click", () => {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("collapsed");
    sidebar.classList.toggle("open");
});

// Create file
function createFile() {
    const name = prompt("Dateiname (z.B. notiz.md):");
    if (!name) return;
    const path = name.endsWith(".md") ? name : name + ".md";

    fetch(`/api/file/${path}`, { method: "POST" })
        .then((res) => {
            if (!res.ok) return res.json().then((d) => { throw new Error(d.detail); });
            window.location.href = `/edit/${path}`;
        })
        .catch((e) => alert("Fehler: " + e.message));
}

// Create directory
function createDir() {
    const name = prompt("Ordnername:");
    if (!name) return;

    fetch(`/api/dir/${name}`, { method: "POST" })
        .then((res) => {
            if (!res.ok) return res.json().then((d) => { throw new Error(d.detail); });
            window.location.reload();
        })
        .catch((e) => alert("Fehler: " + e.message));
}

// Filter tree
function filterTree(query) {
    const items = document.querySelectorAll(".tree-item");
    const q = query.toLowerCase();
    items.forEach((item) => {
        const name = item.dataset.name || "";
        if (!q || name.includes(q)) {
            item.style.display = "";
        } else {
            // Check if any child matches
            const childMatches = item.querySelectorAll(`.tree-item[data-name*="${q}"]`);
            item.style.display = childMatches.length > 0 ? "" : "none";
        }
    });
}
