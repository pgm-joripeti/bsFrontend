import { navigateTo } from "./router.js";
import { applyBrainBackground } from "./utilities/brainBackground.js";
import { secureFetch } from "./utilities/apiClient.js"

const API_BASE = import.meta.env.VITE_API_BASE;

export function initDashboardStudent() {
    
    console.log("✅ Dashboard Student geladen.");

    const popSound = new Audio("/assets/sounds/pop.mp3");

    // event listener voor alle knoppen met start-quiz-btn in class
    document.addEventListener("click", function (event) {
        if (event.target.classList.contains("start-quiz-btn")) {
            const quizId = event.target.getAttribute("data-quiz-id");
            if (quizId) {
                navigateTo(`/quiz?id=${quizId}`);
            }
        }
    });
    
    const quizList = document.querySelector("#quiz-list");

    // ✅ Haal het token en de user-info uit localStorage
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        console.error("❌ Geen token of gebruiker gevonden. Redirect naar login.");
        navigateTo("/");
        return;
    }

    if (user.role !== "leerling") {
        console.error("❌ Onjuiste rol. Alleen leerlingen kunnen dit dashboard zien.");
        navigateTo("/");
        return;
    }

    getAndDisplayUsername(user);

    console.log("📌 Debug: Ophalen quizzes gestart");
    // console.log("🔑 Gebruikerstoken:", token);

    secureFetch("/api/quizzes/student", {
        method: "GET",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
    .then(quizzes => {
        if (!quizzes) return; // Token was verlopen → al geredirect
        
        // console.log("✅ Debug: Quiz API response:", quizzes);

        if (quizzes.error) {
            throw new Error(quizzes.error);
        }

        if (quizzes.length === 0) {
            quizList.innerHTML = "<p class='feedback feedback--info'>Er zijn nog geen quizzen beschikbaar voor jouw richting en graad.</p>";
            return;
        }

        quizList.innerHTML = ""; // Maak container leeg

        // ✅ Voeg quizzen één voor één toe met een vertraging van 70ms
        quizzes.forEach((quiz, index) => {
            setTimeout(() => {
                const quizCard = document.createElement("div");
                quizCard.classList.add("quiz-card", "hidden-entry"); // Eerst verborgen

                quizCard.innerHTML = `
                    <h3>${quiz.title}</h3>
                    <p>${quiz.subject ? quiz.subject.subject_name : "Onbekend vak"}</p>
                    <p class="difficulty ${getDifficultyClass(quiz.difficulty)}">${quiz.difficulty}</p>
                    <button class="btn btn-success start-quiz-btn" data-quiz-id="${quiz.id}">Start Quiz</button>
                `;

                quizList.appendChild(quizCard);

                // ✅ Start de animatie na korte vertraging
                setTimeout(() => {
                    quizCard.classList.remove("hidden-entry");
                    quizCard.classList.add("wobble-in");

                    // Speel pop-geluid af na kleine pauze (rustiger effect)
                    setTimeout(() => {
                        popSound.currentTime = 0;
                        popSound.play();
                    }, index*50);

                    // ✅ Als dit de laatste kaart is → apply brains GSAP animatie
                    if (index === quizzes.length - 1) {
                        setTimeout(() => {
                        applyBrainBackground(".quiz-card", {
                            count: 8,
                            size: 70,
                            opacity: 0.06,
                            animate: true
                        });
                        }, 100); // kleine buffer om zeker te zijn dat DOM klaar is
                    }
    
                }, 50); // Voorkomt direct starten van animatie
            }, index * 70); // **Elke quiz-card wordt 70ms later toegevoegd**

        });
    })
    .catch(error => {
        console.error("❌ Fout bij ophalen quizzen:", error);
        quizList.innerHTML = `<p class="error">Fout bij ophalen quizzen. Probeer later opnieuw.</p>`;
    });
}

// Functie om de user dynamisch in te laden
function getAndDisplayUsername (user) {
    const greetingElement = document.querySelector(".greeting");
    const nickName = user.nickname;
    console.log("nickname", nickName);
    greetingElement.innerHTML = `Welkom ${nickName}!`;
}

// ✅ Functie om de juiste kleurklasse toe te kennen
function getDifficultyClass(difficulty) {
    switch (difficulty.toLowerCase()) {
        case "makkelijk": return "difficulty-easy";
        case "gemiddeld": return "difficulty-medium";
        case "moeilijk": return "difficulty-hard";
        default: return "";
    }
}

// ✅ Zorg ervoor dat startQuiz correct werkt
window.startQuiz = function(quizId) {
    navigateTo(`/quiz?id=${quizId}`);
};
