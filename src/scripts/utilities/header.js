import { navigateTo } from "../router.js"; // ✅ Zorg dat navigateTo correct wordt gebruikt
import { loadFooter } from "./footer.js";
import { setupShineAnimation } from "./shineAnimation.js";

document.addEventListener("DOMContentLoaded", () => {
    setupShineAnimation();
});

export const loadHeader = async () => {
    const header = document.getElementById("header");
    if (!header) return console.error("❌ FOUT: #header niet gevonden in index.html");

    // ✅ Haal de gebruiker op uit localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        console.warn("⚠ Geen gebruiker gevonden. Laad standaard header.");
        header.innerHTML = `
            <header class="header--static">
                <h1>BRAINSMASH</h1>
                <div id="logo_brainsmash"></div>
            </header>
        `;
        return;
    }

    const role = user.role;
    console.log(`🔍 Gebruikersrol gedetecteerd: ${role}`);

    try {
        let headerHtml = "";
        
        if (role === "leerling") {
            const response = await fetch("/components/header_student.html");
            if (!response.ok) throw new Error("Kon student header niet laden.");
            headerHtml = await response.text();
            console.log("✅ Student header geladen.");
        } else if (role === "leerkracht") {
            const response = await fetch("/components/header_teacher.html");
            if (!response.ok) throw new Error("Kon teacher header niet laden.");
            headerHtml = await response.text();
            console.log("✅ Teacher header geladen.");
        } else {
            console.warn("⚠ Onbekende rol, laad standaard header.");
            header.innerHTML = `
                <header class="header--static">
                    <h1>BRAINSMASH</h1>
                    <div id="logo_brainsmash"></div>
                </header>
            `;
            return;
        }

        // ✅ Voeg de geladen header toe aan de DOM
        header.innerHTML = headerHtml;

        // ✅ Voeg event listeners toe aan navigatie links per rol
        setTimeout(() => {
            if (role === "leerling") {
                document.getElementById("dashboard_student")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/dashboard_student");
                });

                document.getElementById("nav-quizzes")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/dashboard_student");
                });

                document.getElementById("nav-leaderboard_student")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/leaderboard_student");
                });

                document.getElementById("nav-profile_student")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/profile_student");
                });

            } else if (role === "leerkracht") {
                document.getElementById("nav-dashboard-teacher")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/dashboard_teacher");
                });

                document.getElementById("nav-myquizzes")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/dashboard_teacher");
                });

                document.getElementById("nav-createquiz")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/teacher_create_quiz");
                });

                document.getElementById("nav-profile-teacher")?.addEventListener("click", (e) => {
                    e.preventDefault();
                    navigateTo("/profile_teacher");
                });
            }

            const logoutButton = document.getElementById("logoutButton");
            if (logoutButton) {
                logoutButton.addEventListener("click", logout);
            }
        }, 100);
    } catch (error) {
        console.error("❌ FOUT bij laden van header:", error);
    }
};

// ✅ Uitlogfunctie
export const logout = () => {
    console.log("🚪 Uitloggen...");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigateTo("/"); // ✅ Fix: Nu is navigateTo correct geïmporteerd
};
