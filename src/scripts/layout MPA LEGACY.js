document.addEventListener("DOMContentLoaded", async () => {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "/pages/login.html";
        return;
    }

    // ✅ Pak de juiste role uit user_metadata
    const role = user.user_metadata?.role || user.role; // Fallback als role verkeerd is opgeslagen

    console.log("✅ Debug: Geregistreerde rol:", role);

    // ✅ Controleer of een leerling per ongeluk op de teacher-dashboard komt
    if (role === "leerling" && window.location.pathname.includes("teacher_dashboard.html")) {
        console.warn("🚨 Leerling probeert toegang te krijgen tot het leerkracht-dashboard. Redirect naar student_dashboard.");
        window.location.href = "/pages/dashboard_student.html";
        return;
    }

    // ✅ Controleer of een leerkracht per ongeluk op de student-dashboard komt
    if (role === "leerkracht" && window.location.pathname.includes("student_dashboard.html")) {
        console.warn("🚨 Leerkracht probeert toegang te krijgen tot het leerling-dashboard. Redirect naar teacher_dashboard.");
        window.location.href = "/pages/dashboard_teacher.html";
        return;
    }

    const headerFile = role === "leerling" ? "header_student.html" : "header_teacher.html";

    try {
        const headerResponse = await fetch(`/components/${headerFile}`);
        if (!headerResponse.ok) throw new Error(`HTTP error! Status: ${headerResponse.status}`);

        const footerResponse = await fetch("/components/footer.html");
        if (!footerResponse.ok) throw new Error(`HTTP error! Status: ${footerResponse.status}`);

        const headerElement = document.querySelector("#header");
        const footerElement = document.querySelector("#footer");

        if (!headerElement || !footerElement) {
            console.error("Element #header of #footer bestaat niet in de HTML.");
            return;
        }

        headerElement.innerHTML = await headerResponse.text();
        footerElement.innerHTML = await footerResponse.text();

        // **Nu pas de logout functionaliteit toevoegen, nadat de header is geladen**
        setTimeout(() => {
            const logoutButton = document.querySelector("#logoutBtn");
            if (logoutButton) {
                logoutButton.addEventListener("click", () => {
                    localStorage.removeItem("user");
                    window.location.href = "/pages/login.html";
                });
            } else {
                console.warn("Logout knop niet gevonden.");
            }
        }, 0);

    } catch (error) {
        console.error("Fout bij het laden van de header of footer:", error);
    }
});
