

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailField = document.querySelector("#email");
        const passwordField = document.querySelector("#password");

        if (!emailField || !passwordField) {
            console.error("❌ FOUT: Email of wachtwoord veld niet gevonden in de DOM.");
            return;
        }

        const errorMessage = document.querySelector("#error-message");
        errorMessage.innerText = ""; // Reset foutmelding

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailField.value,
                    password: passwordField.value
                })
            });

            const data = await res.json();

            console.log("✅ Debug: Login response:", data);

            if (!res.ok || data.error) {
                errorMessage.innerText = data.error || "Login mislukt.";
                return;
            }

            // ✅ Controleer of `session` en `access_token` bestaan
            if (!data.session || !data.session.access_token) {
                console.error("❌ FOUT: Geen geldig session object in response.");
                errorMessage.innerText = "Authenticatie mislukt. Geen sessie ontvangen.";
                return;
            }

            // ✅ Opslaan in localStorage
            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.session.access_token);

            console.log("✅ Token opgeslagen:", data.session.access_token);

            // ✅ Haal de juiste role op uit `user_metadata`
            const role = data.user?.user_metadata?.role;
            console.log("✅ Debug: Gebruikersrol:", role);

            // ✅ Stuur gebruiker naar de juiste pagina
            if (role === "leerling") {
                window.location.href = "/pages/dashboard_student.html"; 
            } else if (role === "leerkracht") {
                window.location.href = "/pages/dashboard_teacher.html"; 
            } else {
                window.location.href = "/pages/dashboard.html"; // Fallback
            }
        } catch (error) {
            console.error("❌ FOUT: Probleem met login request:", error);
            errorMessage.innerText = "Er is een fout opgetreden bij het inloggen.";
        }
    });
};
