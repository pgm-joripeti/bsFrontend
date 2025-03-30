// utils/overlays.js
let overlayElement = null;

export function injectOverlay() {
    // ✅ Alleen tonen op results page
    if (window.location.pathname !== "/quiz_result") {
        console.log("⚠️ Geen overlay: niet op /quiz_result pagina");
        return;
    }

    // ✅ voorkom dubbele overlays
    if (overlayElement) return;

    fetch("/components/overlay-glory.html")
        .then(res => res.text())
        .then(html => {
            const temp = document.createElement("div");
            temp.innerHTML = html;
            overlayElement = temp.firstElementChild;
            document.body.insertBefore(overlayElement, document.body.firstChild);
            console.log("🎉 Overlay toegevoegd aan body");
        })
        .catch(err => console.error("❌ Fout bij laden van overlay:", err));
}

export function removeOverlay() {
    if (overlayElement && overlayElement.parentNode) {
        overlayElement.parentNode.removeChild(overlayElement);
        overlayElement = null;
        console.log("🧼 Overlay verwijderd");
    }
}
