import { navigateTo } from "../router.js"; // ✅ Zorg dat navigateTo correct wordt gebruikt

import { initSpectrumTracking } from "./spectrumTracking.js";

export const loadFooter = async () => {
    const footer = document.getElementById("footer");
    if (!footer) return console.error("❌ FOUT: #footer niet gevonden in index.html");

    let footerHtml = ""; // ✅ Zorg dat footerHtml altijd gedeclareerd is

    try {
        // ✅ Haal de gebruiker op uit localStorage
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user) {
            console.warn("⚠ Geen gebruiker gevonden. Laad standaard footer.");
            const response = await fetch("/components/footer.html");
            if (!response.ok) throw new Error("Kon standaard footer niet laden.");
            footerHtml = await response.text();
            console.log("✅ Standaard footer geladen.");
        } else {
            const role = user.role;
            console.log(`🔍 Gebruikersrol gedetecteerd: ${role}`);

            if (role === "leerling") {
                const response = await fetch("/components/footer_student.html");
                if (!response.ok) throw new Error("Kon student footer niet laden.");
                footerHtml = await response.text();
                console.log("✅ Student footer geladen.");
            } else if (role === "leerkracht") {
                const response = await fetch("/components/footer_teacher.html");
                if (!response.ok) throw new Error("Kon teacher footer niet laden.");
                footerHtml = await response.text();
                console.log("✅ Teacher footer geladen.");
            } else {
                console.warn("⚠ Onbekende rol, laad standaard footer.");
                const response = await fetch("/components/footer.html");
                if (!response.ok) throw new Error("Kon standaard footer niet laden.");
                footerHtml = await response.text();
                console.log("✅ Standaard footer geladen.");
            }
        }

        // ✅ Voeg de geladen footer toe aan de DOM
        footer.innerHTML = footerHtml;

        // ✅ Voeg event listeners toe na het injecteren van de footer
        addFooterEventListeners();

        // Google tracking
        initSpectrumTracking(); 

    } catch (error) {
        console.error("❌ FOUT bij laden van footer:", error);
    }
};

// ✅ Functie om event listeners toe te voegen
const addFooterEventListeners = () => {
    const faqLinkStudent = document.getElementById("nav-FAQ_student");
    const faqLinkTeacher = document.getElementById("nav-FAQ_teacher");
    const disclaimerLink = document.getElementById("nav-disclaimer");
    const contactLink = document.getElementById("nav-contact");

    if (faqLinkStudent) {
        faqLinkStudent.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("📌 Navigeren naar FAQ Student");
            navigateTo("/FAQ_student");
        });
    }

    if (faqLinkTeacher) {
        faqLinkTeacher.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("📌 Navigeren naar FAQ Teacher");
            navigateTo("/FAQ_teacher");
        });
    }

    if (disclaimerLink) {
        disclaimerLink.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("📌 Navigeren naar disclaimer");
            navigateTo("/disclaimer");
        });
    }

    if (contactLink) {
        contactLink.addEventListener("click", (event) => {
            event.preventDefault();
            console.log("📌 mailen naar brainsmash");
            const user = "hi";
            const domain = "brainsmash.be";
            window.location.href = `mailto:${user}@${domain}`;
        });
    }
};
