import { navigateTo } from "./router.js";
import { createPopoverForTeacher } from "./utilities/popover.js";
import { applyBrainBackground } from "./utilities/brainBackground.js";
import { secureFetch } from "./utilities/apiClient.js";
import { showAlert } from "./utilities/alert.js";

import { enablePopovers } from "./utilities/popoverManager.js";
enablePopovers();


export const initDashboardTeacher = async () => {

    console.log("✅ Teacher Dashboard geladen.");

    getUserName();

    const productivityLabel = document.querySelector("#teacher-productivity");
    const totalQuizzesElem = document.querySelector("#stats");
    const searchInput = document.querySelector("#search-input");
    const searchButton = document.querySelector("#search-button");

    // ✅ Haal token op uit localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Geen token gevonden. Redirect naar login.");
        navigateTo("/");
        return;
    }

    try {
        // ✅ Haal statistieken van de leerkracht op
        const teacherData = await secureFetch("/api/stats/teacher", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        // ✅ Haal globale statistieken op
        const resGlobal = await fetch("/api/stats/global", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!teacherData) return; // ⛔️ token verlopen → redirect is al gebeurd

        if (!resGlobal.ok) throw new Error("❌ Fout bij ophalen statistieken.");

        const globalData = await resGlobal.json();

        // console.log("✅ Teacher Data ontvangen:", JSON.stringify(teacherData, null, 2));
        // console.log("✅ Teacher Data ontvangen:", teacherData);
        // console.log("✅ Global Data ontvangen:", globalData);

        productivityLabel.innerHTML=`
        <span "id="teacher-productivity" class="productivity-tag label ${getProductivityLabel(teacherData[0]?.total_quizzes, globalData[0]?.avg_quizzes_per_teacher).class}">
                ${getProductivityLabel(teacherData[0]?.total_quizzes, globalData[0]?.avg_quizzes_per_teacher).text}
            </span`;

        // Data ophalen en stat-cards aanmaken met sequentiële animatie
const stats = [
    {
        value: teacherData.reduce((sum, quiz) => sum + quiz.total_attempts, 0),
        title: "keer gespeeld"
    },
    {
        value: Math.max(...teacherData.map(quiz => quiz.highest_score), 0),
        title: "hoogste score"
    },
    {
        value: teacherData[0]?.total_quizzes ?? "N/A",
        title: "quizzes",
        popover: createPopoverForTeacher("info", "avg_quizzes_per_teacher", globalData[0]?.avg_quizzes_per_teacher?.toFixed(1) ?? "N/A")
    }
];

totalQuizzesElem.innerHTML = ""; // Maak container eerst leeg

// Voeg de stat-cards sequentieel toe met vertraging
stats.forEach((stat, index) => {
    setTimeout(() => {
        const statCard = document.createElement("div");
        statCard.classList.add("stat-card", "hidden-entry"); // Eerst verborgen

        let popoverHTML = stat.popover ? `<div class="popover-container">${stat.popover}</div>` : "";

        statCard.innerHTML = `
            ${popoverHTML}
            <p class="stat-value ${stat.popover ? 'compensate_popover' : ''}">${stat.value}</p>
            <p class="stat-title ${stat.popover ? 'compensate_popover' : ''}">${stat.title}</p>
        `;

        totalQuizzesElem.appendChild(statCard);

        // Voeg animatie toe na korte vertraging
        setTimeout(() => {
            statCard.classList.remove("hidden-entry");
            statCard.classList.add("wobble-in");
        }, 100); // Zorgt ervoor dat de animatie niet direct start
    }, index * 50); // **Elke stat-card wordt 300ms later toegevoegd**

        setTimeout(() => {
            applyBrainBackground(".stat-card", {
            count: 3,
            size: 30,
            opacity: 0.04,
            animate: true
            });
        }, 100);
});


        // console.log("✅ Teacher Data ontvangen:", JSON.stringify(teacherData, null, 2));
        // console.log("✅ Global Data ontvangen:", JSON.stringify(globalData, null, 2));


        if (!teacherData || !teacherData.length) {
            console.error("❌ Leerkracht heeft geen quiz data ontvangen:", teacherData);
        } else {
            // console.log("✅ Leerkracht heeft quizzes:", teacherData.length);
        }        

        // ✅ Render quiz-statistieken met vergelijkingen
        renderQuizList(teacherData, globalData);

        // ✅ Zoekfunctionaliteit opnieuw toevoegen
        searchButton?.addEventListener("click", () => {
            const searchTerm = searchInput.value.toLowerCase();
            // console.log(searchTerm);
            const filteredQuizzes = teacherData.filter(quiz =>
                (quiz.title && quiz.title.toLowerCase().includes(searchTerm)) ||
                (quiz.subject && quiz.subject.toLowerCase().includes(searchTerm)) ||
                quiz.total_attempts?.toString().includes(searchTerm) ||
                quiz.avg_score?.toString().includes(searchTerm)
            );
            renderQuizList(filteredQuizzes, globalData);
        });

    } catch (error) {
        console.error("❌ Fout bij ophalen statistieken:", error);
    }
};

// ✅ Render de quizlijst met animatie
const renderQuizList = (quizzes, globalData) => {
    // console.log("🔍 renderQuizList - Ontvangen quizzes:", quizzes);

    const popSound = new Audio("/assets/sounds/pop.mp3");

    // ✅ Sorteer quizzen op aanmaakdatum
    quizzes.sort((a, b) => {
        const dateA = a.data?.created_at ? new Date(a.data.created_at.replace(" ", "T")) : new Date(0);
        const dateB = b.data?.created_at ? new Date(b.data.created_at.replace(" ", "T")) : new Date(0);
        return dateA - dateB;
    });    

    const quizList = document.querySelector("#quiz-list");
    if (!quizList) {
        console.error("❌ FOUT: #quiz-list niet gevonden in de DOM!");
        return;
    }

    // ✅ Toon melding als er geen quizzen zijn
    if (!quizzes || quizzes.length === 0) {
        quizList.innerHTML = `<p class="error">Geen quizzen gevonden.</p>`;
        return;
    }

    quizList.innerHTML = ""; // Maak container eerst leeg

    // ✅ Voeg quizzen sequentieel toe met animatie
    quizzes.forEach((quiz, index) => {
        setTimeout(() => {
            if (!quiz.quiz_id) {
                console.error("❌ FOUT: quiz_id ontbreekt in quiz-object:", quiz);
                return;
            }

            const popularityLabel = getPopularityLabel(
                quiz.total_attempts ?? 0, 
                globalData[0]?.avg_total_attempts ?? 0
            );
            
            const difficultyLabel = getDifficultyLabel(
                quiz.avg_score ?? 0, 
                globalData[0]?.avg_global_score ?? 0
            );        

            const quizCard = document.createElement("div");
            quizCard.classList.add("quiz-card", "hidden-entry"); // Eerst verborgen

            quizCard.innerHTML = `
                <div class="popover-container">
                    ${createPopoverForTeacher("info", "avg_times_played", globalData[0]?.avg_total_attempts?.toFixed(1) ?? "N/A")}  
                    ${createPopoverForTeacher("info", "avg_score", globalData[0]?.avg_global_score?.toFixed(0) ?? "N/A")}  
                </div>

                <h3>${quiz.title}</h3>
                <div class="label-container">
                    <p class="label ${popularityLabel.class}">${popularityLabel.text}</p>
                    <p class="label ${difficultyLabel.class}">${difficultyLabel.text}</p>
                </div>
                <p>
                    <strong>${quiz.total_attempts}</strong> keer gespeeld
                </p>
                <p>
                    <strong>${quiz.avg_score.toFixed(0)}/10</strong> gemiddeld behaald
                </p>
                
                <div class="btn-container">
                    <button class="btn edit-btn btn-success" data-quiz-id="${quiz.quiz_id}">Bewerk</button>
                    <button class="btn delete-btn btn-alert" data-quiz-id="${quiz.quiz_id}">Verwijder</button>
                </div>
            `;

            quizList.appendChild(quizCard);

            // Speel pop-geluid af na kleine pauze (rustiger effect)
            setTimeout(() => {
                popSound.currentTime = 0;
                popSound.play();
            }, index*50);

            // ✅ Start animatie na korte delay
            setTimeout(() => {
                quizCard.classList.remove("hidden-entry");
                quizCard.classList.add("wobble-in");
            }, 50); // Voorkomt direct starten van animatie

            // ✅ Voeg event listeners toe na renderen
            quizCard.querySelector(".edit-btn").addEventListener("click", event => {
                const quizId = event.target.dataset.quizId;
                if (!quizId) {
                    console.error("❌ Geen quiz ID gevonden!");
                    return;
                }
        
                // console.log(`✏️ Navigeren naar bewerkpagina voor quiz ID: ${quizId}`);
                navigateTo(`/teacher_edit_quiz?id=${quizId}`); 
            });

            quizCard.querySelector(".delete-btn").addEventListener("click", event => {
                const quizId = event.target.dataset.quizId;
                deleteQuiz(quizId);
            });

        }, index * 70); // **Elke quiz-card wordt 70ms later toegevoegd**

        setTimeout(() => {
            applyBrainBackground(".quiz-card", {
              count: 1,
              size: 70,
              opacity: 0.06,
              animate: true
            });
          }, 600);

    });
};


// ✅ Functie om productiviteit te berekenen
const getProductivityLabel = (teacherQuizzes, avgQuizzes) => {
    if (teacherQuizzes > avgQuizzes * 1.2) return { text: "Workaholic", class: "tag green" };
    if (teacherQuizzes < avgQuizzes * 0.8) return { text: "Couch Potato", class: "tag red" };
    return { text: "Gemiddeld Productief", class: "tag yellow" };
};

// ✅ Functie om populariteit correct te berekenen (ook voor 0 attempts)
const getPopularityLabel = (quizAttempts, avgAttempts) => {
    if (quizAttempts === 0) return { text: "Quiz werd nog niet gespeeld", class: "tag gray" };
    if (quizAttempts > avgAttempts * 1.2) return { text: "Erg populair", class: "tag green" };
    if (quizAttempts < avgAttempts * 0.8) return { text: "Weinig gespeeld", class: "tag red" };
    return { text: "Vaak gespeeld", class: "tag yellow" };
};

// ✅ Functie om moeilijkheid correct te berekenen (ook voor 0 scores)
const getDifficultyLabel = (quizScore, avgScore) => {
    if (quizScore === 0) return { text: "", class: "" };
    if (quizScore > avgScore * 1.2) return { text: "Erg makkelijk", class: "tag green" };
    if (quizScore < avgScore * 0.8) return { text: "Erg moeilijk", class: "tag red" };
    return { text: "Gemiddeld moeilijk", class: "tag yellow" };
};

// ✅ Quiz verwijderen met token in de header
const deleteQuiz = async (quizId) => {
    const confirmation = await showAlert("Weet je zeker dat je deze quiz wilt verwijderen?", {
        confirmButton: true,  // ✅ Zorg dat je custom showAlert dit ondersteunt!
        confirmButtonText: "Verwijder",
        cancelButton: true,
        cancelButtonText: "Annuleer"
    });

    if (!confirmation) return;

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Geen token gevonden. Redirect naar login.");
        navigateTo("/");
        return;
    }

    try {
        // console.log(`🗑️ Verzenden van DELETE request voor quiz ID: ${quizId}`);

        const res = await fetch(`/api/quizzes/${quizId}`, { 
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`❌ Fout bij verwijderen quiz. Status: ${res.status}`);
            console.error("❌ Server response:", data);
            throw new Error(data.error || "Kon quiz niet verwijderen.");
        }

        if (!res.ok) throw new Error("❌ Kon quiz niet verwijderen.");

        await showAlert("✅ Quiz succesvol verwijderd!");
        initDashboardTeacher(); // ✅ Vernieuw de lijst zonder pagina reload

    } catch (error) {
        console.error("❌ Fout bij verwijderen quiz:", error.message);
        await showAlert("Fout bij verwijderen quiz. Probeer later opnieuw.");
    }
};

//haal user uit localStorage
function getUserName() {
    const user = JSON.parse(localStorage.getItem("user"));
    const nickName = user.nickname;
    // console.log("nickname", nickName);
    displayUserName(nickName);
};

// Functie om de user dynamisch in te laden
function displayUserName (nickName) {
    const greetingElement = document.querySelector(".greeting");
    // console.log(greetingElement);
    greetingElement.innerHTML = `Welkom ${nickName}!`;
}