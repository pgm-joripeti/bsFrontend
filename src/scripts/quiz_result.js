import { navigateTo } from "./router.js";
import { injectOverlay, removeOverlay } from "./utilities/overlays.js";
import confetti from "canvas-confetti";
import { createShareComponent } from "./utilities/shareButtons.js";
import { secureFetch } from "./utilities/apiClient.js";


window.addEventListener("popstate", removeOverlay);
window.addEventListener("hashchange", removeOverlay);

// Setup back button direct (DOM is al geladen bij SPA routing)
setupBackButton();

function setupBackButton() {
    const backButton = document.getElementById("backToDashboard");
    if (backButton) {
        console.log("✅ Knop gevonden! Event listener wordt toegevoegd.");
        backButton.addEventListener("click", () => {
            console.log("🔙 Navigeren naar dashboard...");
            navigateTo("/dashboard_student");
        });
    } else {
        console.warn("⚠️ Knop niet gevonden! Wachten en opnieuw proberen...");
        // Eventueel als fallback:
        // setTimeout(setupBackButton, 300);
    }
}

const badgeSound = new Audio("/assets/sounds/drum_roll.mp3");

function showShareOptions({ score, xp, qbits }) {
    const message = `Ik behaalde ${score}/10 op mijn quiz op Brainsmash! 🧠 +${xp} XP +${qbits} Qbits 🚀`;
    const url = window.location.origin + "/#dashboard_student";

    const container = document.createElement("div");
    container.innerHTML = createShareButtons({ text: message, url });

    document.querySelector(".results-section").appendChild(container);
}

export async function fetchQuizResults() {

     // 🔊 Speel het geluid na interactie of met een delay
     function playApplauseSound() {
        const audio = new Audio("/assets/sounds/applause.mp3");
        audio.play().catch(error => console.warn("⚠️ Audio kan niet automatisch worden afgespeeld:", error));
    }

    // document.addEventListener("click", () => {
    //     playSuccessSound(); // ✅ Speel geluid af zodra gebruiker klikt
    // }, { once: true }); // ✅ Zorgt ervoor dat de event listener slechts één keer wordt toegevoegd

    // Alleen afspelen als de gebruiker toestemming gaf door te klikken in vorige view
    const allowAudio = sessionStorage.getItem("allowAudio") === "true";

    if (allowAudio) {
        setTimeout(() => {
            playApplauseSound();
            sessionStorage.removeItem("allowAudio"); // 🧼 opschonen
        }, 100);
    } else {
        console.log("🔇 Geen toestemming om audio automatisch af te spelen.");
    }

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("id");
    const token = localStorage.getItem("token");

    console.log("🚀 Ophalen quizresultaten voor quizId:", quizId);
    console.log("🔍 Gebruikers token:", token);

    if (!quizId) {
        document.getElementById("resultMessage").innerText = "Geen quiz geselecteerd!";
        return;
    }

    if (!token) {
        console.error("🚨 Geen token gevonden! Gebruiker moet opnieuw inloggen.");
        navigateTo("/"); // Stuur gebruiker terug naar login
        return;
    }

    try {
        const response = await secureFetch(`/api/quizzes/quiz_results/${quizId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const results =  response; // secureFetch returned al json, dus niet nog eens results = response.json();
        if (!results) return; // secureFetch geeft al redirect

        // console.log("✅ Quizresultaten opgehaald:", results);
    
        // 🧠 Score info tonen
        document.getElementById("score").innerText = `${results.score}`;
        document.getElementById("xp").innerText = `${results.xp_earned}`;
        document.getElementById("qbits").innerText = `${results.qbits_earned}`;
    
        // 🏅 Badges tonen
        if (results.new_badges && results.new_badges.length > 0) {
            // console.log("🏅 Nieuwe badges behaald:", results.new_badges);
            displayBadges(results.new_badges);
        }

        const shareText = `Ik behaalde ${results.score}/10 op mijn quiz op Brainsmash! 🧠 +${results.xp_earned} XP, +${results.qbits_earned} Qbits! Brainsmash werd ontwikkeld als educatief project voor de opleiding programmeren van de secundaire school Het Spectrum. Meer info? https://scholen.stad.gent/spectrum/applicatie-en-databeheer`;
        const shareUrl = "https://brainsmash.be";
        
        const component = createShareComponent({
            text: shareText,
            url: shareUrl,
            targetSelector: "#screenshot-target"
        });
        
        document.querySelector(".social-share-container")?.appendChild(component);
    
    } catch (error) {
        console.error("❌ Fout bij ophalen resultaten:", error);
        document.getElementById("resultMessage").innerText = "Fout bij laden resultaten.";
    }    
}

export function displayBadges(badges) {
    const badgeContainer = document.querySelector("#badgeContainer");
    if (!badgeContainer) {
        console.error("❌ badgeContainer niet gevonden in de DOM.");
        return;
    }

    badgeContainer.innerHTML = "";

    // Dynamisch overlay element injecteren indien nog niet aanwezig
    if (!document.querySelector("#badgeOverlay")) {
        const overlayHTML = `
        <div id="badgeOverlay" class="badge-overlay hidden">
        <div class="badge-overlay__content">
            <div class="badge-overlay__animation-wrapper">
            <img id="badgeImage" class="badge-overlay__image" src="" alt="Badge">
            </div>
            <p id="badgeDescription" class="badge-overlay__text">🏅 Nieuwe badge verdiend!</p>
        </div>
        </div>`;
        document.body.insertAdjacentHTML("beforeend", overlayHTML);
    }

    const overlay = document.querySelector("#badgeOverlay");
    const overlayImg = document.querySelector("#badgeImage");

    function showBadgeOverlay(badge) {
        const overlay = document.querySelector("#badgeOverlay");
        const overlayImg = document.querySelector("#badgeImage");
        const overlayText = document.querySelector("#badgeDescription");
        const animWrapper = overlay.querySelector(".badge-overlay__animation-wrapper");
    
        overlayImg.src = badge.icon_url;
        overlayImg.alt = badge.id;
        overlayText.textContent = "🏅 Nieuwe badge verdiend!";

        // 🔁 Glow opnieuw triggeren op badge-image
        overlayImg.classList.remove("glow-once");
        void overlayImg.offsetWidth; // force reflow
        overlayImg.classList.add("glow-once");

    
        // 🔁 Forceer wobble-in op alleen de afbeelding-wrapper
        animWrapper.classList.remove("wobble-in-glory", "wobble-out");
        void animWrapper.offsetWidth;
        animWrapper.classList.add("wobble-in-glory");
    
        overlay.classList.remove("hidden");
        overlay.classList.add("show");
    
        badgeSound.currentTime = 0;
        badgeSound.play().catch(e => console.warn("⚠️ Geluid niet afgespeeld:", e));
    
        // 🔁 Na 2 seconden: wobble-out alleen op afbeelding
        setTimeout(() => {
            animWrapper.classList.remove("wobble-in-glory");
            animWrapper.classList.add("wobble-out");
    
            // 🔁 Na wobble-out animatie (600ms)
            setTimeout(() => {
                overlay.classList.remove("show");
                overlay.classList.add("hidden");
                animWrapper.classList.remove("wobble-out");
    
                // Badge in container plaatsen na overlay
                const badgeElement = document.createElement("div");
                badgeElement.classList.add("badge", "badge--new");
                badgeElement.innerHTML = `
                    <img src="${badge.icon_url}" alt="${badge.id}" class="badge__image">
                    <div class="popover-container">
                        <div class="popover">
                            <span class="material-icons popover__icon badge-info-icon">info</span>
                            <span class="popover__content badge-info-content">
                                ${badge.description}<br>
                            </span>
                        </div>
                    </div>
                `;
                document.querySelector("#badgeContainer").appendChild(badgeElement);
    
            }, 600);
        }, 2000);
    }
    
    // Start sequentieel tonen van de badges
    badges.forEach((badge, i) => {
        setTimeout(() => {
            showBadgeOverlay(badge);
    
            // Als dit de laatste badge is:
            if (i === badges.length - 1) {
                // Wacht tot de laatste wobble-out ook klaar is
                setTimeout(() => {
                    confetti({
                        particleCount: 150,
                        spread: 100,
                        origin: { y: 0.4 }
                    });
                }, 2600); // 2s zichtbaarheid + 600ms wobble-out
            }
    
        }, i * 3000);
    });
    
}

