import { navigateTo } from "./router.js";
import { enableMouseFollowEffect } from "./utilities/auth-mouse_follow.js";
import { showAlert } from "./utilities/alert.js";

const API_BASE = import.meta.env.VITE_API_BASE;

// ✅ Haal de scholen op
async function fetchScholen() {
    try {
        const res = await fetch(`${API_BASE}/api/database/schools`);
        if (!res.ok) throw new Error("Kan scholen niet laden.");
        const data = await res.json();
        
        const selectElement = document.getElementById("school");
        if (!selectElement) return console.error("❌ FOUT: Element #school niet gevonden!");

        selectElement.innerHTML = '<option value="">Selecteer een school</option>';

        data.sort((a, b) => a.school_name.localeCompare(b.school_name, 'nl', { sensitivity: 'base' }));
        data.forEach((school) => {
            const option = document.createElement("option");
            option.value = school.id;
            option.textContent = school.school_name;
            selectElement.appendChild(option);
        });

        console.log("✅ Scholen geladen.");
    } catch (error) {
        console.error("❌ FOUT bij het ophalen van scholen:", error);
    }
}

// ✅ Haal de graden op
async function fetchGraden() {
    try {
        const res = await fetch(`${API_BASE}/api/database/grades`);
        if (!res.ok) throw new Error("Kan graden niet laden.");
        const data = await res.json();

        const selectElement = document.getElementById("grade");
        if (!selectElement) return console.error("❌ FOUT: Element #grade niet gevonden!");

        selectElement.innerHTML = '<option value="">Selecteer een graad</option>';

        data.sort((a, b) => a.grade_name.localeCompare(b.grade_name, 'nl', { sensitivity: 'base' }));
        data.forEach((grade) => {
            const option = document.createElement("option");
            option.value = grade.id;
            option.textContent = grade.grade_name;
            selectElement.appendChild(option);
        });

        console.log("✅ Graden geladen.");
    } catch (error) {
        console.error("❌ FOUT bij het ophalen van graden:", error);
    }
}

// ✅ Haal de richtingen op
async function fetchRichtingen() {
    try {
        const res = await fetch(`${API_BASE}/api/database/programs`);
        if (!res.ok) throw new Error("Kan richtingen niet laden.");
        const data = await res.json();

        const selectElement = document.getElementById("program");
        if (!selectElement) return console.error("❌ FOUT: Element #program niet gevonden!");

        selectElement.innerHTML = '<option value="">Selecteer een richting</option>';

        data.sort((a, b) => a.program_name.localeCompare(b.program_name, 'nl', { sensitivity: 'base' }));
        data.forEach((program) => {
            const option = document.createElement("option");
            option.value = program.id;
            option.textContent = program.program_name;
            selectElement.appendChild(option);
        });

        console.log("✅ Richtingen geladen.");
    } catch (error) {
        console.error("❌ FOUT bij het ophalen van richtingen:", error);
    }
}

// ✅ Init Registerpagina
export async function initRegister() {
    console.log("✅ Registerpagina geladen, ophalen van select opties...");

    setTimeout(() => {
        const registerForm = document.getElementById("registerForm");

        if (!registerForm) {
            console.error("❌ FOUT: Registerformulier niet gevonden! DOM is nog niet volledig geladen.");
            return;
        }

        console.log("✅ RegisterForm gevonden, ophalen van data...");

        // ✅ Activeer de reflectie-effecten
        enableMouseFollowEffect();

        fetchScholen();
        fetchGraden();
        fetchRichtingen();

        // ✅ Fix: Event listener voor "Log in" link
        const loginLink = document.getElementById("loginLink");
        if (loginLink) {
            loginLink.addEventListener("click", (event) => {
                event.preventDefault();
                navigateTo("/");
            });
        } else {
            console.error("❌ FOUT: #loginLink niet gevonden!");
        }

        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullName = document.querySelector("#full_name")?.value.trim();
            const nickname = document.querySelector("#nickname")?.value.trim();
            const email = document.querySelector("#email")?.value.trim();
            const password = document.querySelector("#password")?.value.trim();
            const role = document.querySelector("#role")?.value.trim();
            const schoolId = document.querySelector("#school")?.value.trim();
            const program = document.querySelector("#program")?.value.trim();
            const grade = document.querySelector("#grade")?.value.trim();

            if (!fullName || !nickname || !email || !password || !role || !schoolId || !program || !grade) {
                await showAlert("Vul alle velden in.");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        full_name: fullName,
                        nickname,
                        email,
                        password,
                        role,
                        school_id: schoolId,
                        program_id: program,
                        grade_id: grade
                    })
                });

                const data = await res.json();

                if (data.error) {
                    await showAlert("Registratie mislukt: " + data.error);
                } else {
                    await showAlert("Succesvol geregistreerd! Check je mailbox voor verificatie!");
                    navigateTo("/");
                }
            } catch (error) {
                console.error("❌ FOUT bij registratie:", error);
                alert("Er is een fout opgetreden bij het registreren. Probeer opnieuw.");
            }
        });
    }, 100);
}
