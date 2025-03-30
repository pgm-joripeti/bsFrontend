import { navigateTo } from "./router.js";
import { enableMouseFollowEffect } from "./utilities/auth-mouse_follow.js";
import { assignLeagueToUser } from "./utilities/league.js";
import { showAlert } from "./utilities/alert.js";

const API_BASE = import.meta.env.VITE_API_BASE;

export function initLogin() {
    console.log("✅ Loginpagina geladen.");
    
    setTimeout(() => {
        const loginForm = document.getElementById("loginForm");
        if (!loginForm) return;

        // console.log("✅ LoginForm gevonden.");

        // ✅ Activeer de reflectie-effecten
        enableMouseFollowEffect();

        // ✅ Fix: Event listener voor registratie-link
        const registerLink = document.getElementById("registerLink");
        if (registerLink) {
            registerLink.addEventListener("click", (event) => {
                event.preventDefault();
                navigateTo("/register");
            });
        } else {
            console.error("❌ FOUT: #registerLink niet gevonden!");
        }

        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const emailField = document.querySelector("#email");
            const passwordField = document.querySelector("#password");

            if (!emailField || !passwordField) {
                console.error("❌ FOUT: Email of wachtwoord veld niet gevonden.");
                return;
            }

            const errorMessage = document.querySelector("#error-message");
            errorMessage.innerText = "";

            try {
                const res = await fetch(`${API_BASE}/api/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailField.value, password: passwordField.value })
                });

                const data = await res.json();
                // console.log("✅ Debug: Ontvangen data van backend:", data);

                if (!res.ok || data.error) {
                    errorMessage.innerText = data.error || "Login mislukt.";
                    return;
                }

                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("token", data.session.access_token);

                // console.log("✅ Token opgeslagen:", data.session.access_token);

                const role = data.user?.role;  
                console.log("✅ Debug: Gebruikersrol:", role);

                if (!role) {
                    console.error("❌ FOUT: Rol niet gevonden in user data!", data.user);
                    errorMessage.innerText = "Er is een fout met de gebruikersrol.";
                    return;
                }

                if (role === "leerling") {
                    // ✅ League toewijzen of updaten
                    await assignLeagueToUser(data.user.id);
                    navigateTo("/dashboard_student");
                } else if (role === "leerkracht") {
                    navigateTo("/dashboard_teacher");
                } else {
                    navigateTo("/");
                }
            } catch (error) {
                console.error("❌ FOUT: Probleem met login request:", error);
                errorMessage.innerText = "Er is een fout opgetreden bij het inloggen.";
            }
        });
    }, 100);

    // ✅ Password reset link
    const resetLink = document.getElementById("resetPasswordLink");
    if (resetLink) {
        resetLink.addEventListener("click", async (event) => {
            event.preventDefault();
            const email = document.querySelector("#email")?.value.trim();

            if (!email) {
                showAlert("Vul eerst je e-mailadres in.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email })
                });

                const data = await res.json();

                if (res.ok) {
                    showAlert("Check je e-mail voor een reset-link.");
                } else {
                    showAlert(data.error || "Kon geen reset e-mail versturen.");
                }
            } catch (error) {
                console.error("❌ Fout bij reset:", error);
                showAlert("Er ging iets mis. Probeer opnieuw.");
            }
        });
    }
}

