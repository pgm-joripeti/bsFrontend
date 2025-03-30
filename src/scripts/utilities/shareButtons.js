import html2canvas from "html2canvas";
import { showAlert } from "./alert.js";
import confetti from "canvas-confetti";


// 👇 Voeg hier toe, boven je createShareComponent functie:
function waitForImageLoad(imgElement) {
    return new Promise((resolve, reject) => {
      if (imgElement.complete && imgElement.naturalHeight !== 0) {
        resolve();
      } else {
        imgElement.onload = () => resolve();
        imgElement.onerror = () => reject(new Error('❌ Afbeelding kon niet geladen worden.'));
      }
    });
  }

async function imageToBase64(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

export function createShareComponent({ text, url, targetSelector }) {
    const encodedText = encodeURIComponent(text);
    const encodedURL = encodeURIComponent(url);

    const wrapper = document.createElement("div");
    wrapper.classList.add("share-component");
    wrapper.innerHTML = `
        <p class="share-component__label">Deel dit op:</p>
        <div class="share-component__icons">
            <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedURL}&quote=${encodedText}" 
                target="_blank" aria-label="Facebook" title="Deel op Facebook">
                <span class="material-icons">facebook</span>
            </a>
            <a href="https://mastodon.social/share?text=${encodedText}%0A${encodedURL}" 
                target="_blank" aria-label="Mastodon" title="Deel op Mastodon">
                <span class="material-icons">public</span>
            </a>
            <button class="share-instagram-btn" title="Voor Instagram (screenshot)" aria-label="Deel op Instagram">
                <svg class="social-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#00D26A">
                    <path d="M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm4.5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm5.5-2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                </svg>
            </button>
        </div>
        <button class="btn btn-success share-screenshot-btn">Download screenshot</button>
        <button class="btn btn-success copy-share-text-btn">Kopieer tekst</button>
    `;

    // Event voor screenshot met Brainsmash-frame
    wrapper.querySelector(".share-screenshot-btn").addEventListener("click", async () => {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement || getComputedStyle(targetElement).display === "none") {
        return showAlert("⚠️ Screenshot niet mogelijk omdat pagina deels niet zichtbaar is");
        }


        const originalLogo = targetElement.querySelector("#league-logo");
        let base64Logo;

        if (originalLogo) {
            try {
                await waitForImageLoad(originalLogo);
                base64Logo = await imageToBase64(originalLogo.src);
            } catch (error) {
                console.error(error);
                return alert("⚠️ Kon league-logo niet laden. Probeer opnieuw.");
            }
        }

        // ✅ Maak kloon nadat we base64 hebben
        const clone = targetElement.cloneNode(true);
        const clonedLogo = clone.querySelector("#league-logo");
        if (clonedLogo && base64Logo) {
            clonedLogo.src = base64Logo; // Gebruik direct base64 → direct geladen
        }

        // ✅ Maak tijdelijk een wrapper met overlay elementen
        const wrapperDiv = document.createElement("div");
        wrapperDiv.classList.add("share-frame-wrapper");

        // Frame container
        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("share-frame-content");
        contentWrapper.appendChild(clone);

        // Voeg logo toe BOVEN de content
        const logo = document.createElement("img");
        logo.src = "/assets/visuals/brainsplash.png";
        logo.alt = "Brainsmash Logo";
        logo.classList.add("share-frame-logo");
        contentWrapper.prepend(logo);

        // Voeg caption TOE ONDER de content
        const caption = document.createElement("div");
        caption.classList.add("share-frame-caption");
        caption.textContent = "Brainsmash 🧠 powered by Het Spectrum";
        contentWrapper.appendChild(caption);

        // Plaats alles in wrapper
        wrapperDiv.appendChild(contentWrapper);

        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = "/share/screenshot.css"; // jouw custom CSS met enkel variabelen
        wrapperDiv.appendChild(styleLink);


        // Verberg en append aan DOM
        wrapperDiv.style.position = "absolute";
        wrapperDiv.style.top = "-9999px";
        document.body.appendChild(wrapperDiv);

        // Screenshot maken
        const canvas = await html2canvas(wrapperDiv);
        const dataUrl = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "brainsmash-share.png";
        link.click();

        // Cleanup
        document.body.removeChild(wrapperDiv);
    });

    // Instagram knop toont uitleg popup
    wrapper.querySelector(".copy-share-text-btn").addEventListener("click", () => {
        navigator.clipboard.writeText(text).then(() => {
            showAlert("Tekst gekopieerd! ⭐ Posten maar");
        }).catch(err => {
            alert("❌ Kon tekst niet kopiëren: " + err.message);
        });
    });    

    wrapper.querySelector(".share-instagram-btn").addEventListener("click", async () => {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return alert("⚠️ Kan element niet vinden");

        // ✅ wachten tot het league logo geladen is
        const originalLogo = targetElement.querySelector("#league-logo");
        if (originalLogo) {
            try {
                await waitForImageLoad(originalLogo);
            } catch (error) {
                console.error(error);
                return alert("⚠️ Kon league-logo niet laden. Probeer opnieuw.");
            }
        }

        // Screenshot maken
        const clone = targetElement.cloneNode(true);
        const wrapperDiv = document.createElement("div");
        wrapperDiv.classList.add("share-frame-wrapper");

        // 👇 League-logo fix voor screenshot
        if (originalLogo) {
            const base64Logo = await imageToBase64(originalLogo.src);
            const clonedLogo = clone.querySelector("#league-logo");
            if (clonedLogo) {
                clonedLogo.src = base64Logo;
            }
        }

        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("share-frame-content");
        contentWrapper.appendChild(clone);
    
        const logo = document.createElement("img");
        logo.src = "/assets/visuals/brainsplash.png";
        logo.alt = "Brainsmash Logo";
        logo.classList.add("share-frame-logo");
        contentWrapper.prepend(logo);
    
        const caption = document.createElement("div");
        caption.classList.add("share-frame-caption");
        caption.textContent = "Brainsmash 🧠 powered by Het Spectrum";
        contentWrapper.appendChild(caption);
    
        wrapperDiv.appendChild(contentWrapper);

        const styleLink = document.createElement("link");
        styleLink.rel = "stylesheet";
        styleLink.href = "/share/screenshot.css"; // jouw custom CSS met enkel variabelen
        wrapperDiv.appendChild(styleLink);

        wrapperDiv.style.position = "absolute";
        wrapperDiv.style.top = "-9999px";
        document.body.appendChild(wrapperDiv);
    
        const canvas = await html2canvas(wrapperDiv);
        const dataUrl = canvas.toDataURL("image/png");
    
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "brainsmash-instagram.png";
        link.click();
    
        // Tekst kopiëren
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.warn("❌ Kon tekst niet kopiëren");
        }
    
        showAlert("📸 Screenshot gedownload & tekst gekopieerd! Gewoon plakken in je Instagram post ✨");
    
        document.body.removeChild(wrapperDiv);
    });    

    // 📲 Web Share API (voor mobiel)
    if (navigator.canShare && navigator.canShare({ text, url })) {
        const shareButton = document.createElement("button");
        shareButton.classList.add("btn", "btn-success");
        shareButton.innerText = "Deel via mobiel";
        shareButton.classList.add("mobile-share-btn");

        shareButton.addEventListener("click", async () => {
            try {
                await navigator.share({
                    title: "⭐ Mijn 🧠 Brainsmash resultaat! ⭐",
                    text: text,
                    url: url
                });
            } catch (err) {
                console.warn("❌ Web Share API failed", err);
            }
        });

        wrapper.appendChild(shareButton);
        return wrapper;

    }
}
