function loadMaterialIcons() {
  if (!document.querySelector('link[href*="material+icons"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
    document.head.appendChild(link);
    console.log("✅ Material Icons CDN toegevoegd aan <head>.");
  }
}

// 🚀 Roep de functie **direct** aan, zonder wachten op DOMContentLoaded
loadMaterialIcons();
