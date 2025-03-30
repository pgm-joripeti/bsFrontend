import { initLogin } from "./login.js";
import { initRegister } from "./register.js";
import { loadHeader } from "./utilities/header.js";
import { loadFooter } from "./utilities/footer.js";
import { initDashboardStudent } from "./dashboard_student.js";
import { initDashboardTeacher } from "./dashboard_teacher.js";
import { initLeaderboardStudent } from "./leaderboard_student.js";
import { initLeaderboardTeacher } from "./leaderboard_teacher.js";
import { fetchProfileStudent } from "./profile_student.js";
import { fetchProfileTeacher } from "./profile_teacher.js";
import { initCreateQuiz } from "./teacher_create_quiz.js";
import { initEditQuiz } from "./teacher_edit_quiz.js";
import { fetchQuestions } from "./quiz_detail.js";
import { fetchQuizResults } from "./quiz_result.js"; 
import { fetchFAQStudent, fetchFAQTeacher } from "./fetchFAQ.js"; 
import { injectOverlay, removeOverlay } from "./utilities/overlays.js";

import { showMemeWheel } from './utilities/memeWheel.js';
import { maybeTriggerMemeWheel } from "./utilities/triggerWheel.js";

const app = document.getElementById("app");

if (!app) {
    console.error("❌ FOUT: #app container niet gevonden! Controleer je index.html.");
}

// ✅ SPA-routes (zonder # in URL)
const routes = {
    "/": "views/login.html",
    "/register": "views/register.html",
    "/dashboard_student": "views/dashboard_student.html",
    "/dashboard_teacher": "views/dashboard_teacher.html",
    "/leaderboard_student": "views/leaderboard_student.html",
    "/leaderboard_teacher": "views/leaderboard_teacher.html",
    "/profile_student": "views/profile_student.html",
    "/profile_teacher": "views/profile_teacher.html",
    "/teacher_create_quiz": "views/teacher_create_quiz.html",
    "/teacher_edit_quiz": "views/teacher_edit_quiz.html", // edit quiz, op basis van create quiz, maar dan met gebruik van ?id=... query parameter
    "/quiz": "views/quiz_detail.html",
    "/quiz_result": "views/quiz_result.html",
    "/404": "views/404.html",  // ✅ Zorg dat deze 404 bestaat
    "/FAQ_student": "views/FAQ_student.html",
    "/FAQ_teacher": "views/FAQ_teacher.html"
};

// ✅ Voorkom dubbele navigatie en oneindige loops
export const navigateTo = (path) => {
    // console.log(`🚀 Navigeren naar: ${path}`);

    const url = new URL(path, window.location.origin);

    // ✅ Voorkom dubbele navigatie naar dezelfde pagina
    if (location.pathname + location.search === url.pathname + url.search) {
        console.warn(`⚠ Voorkomen van onnodige navigatie: ${path}`);
        return;
    }

    if (!routes[url.pathname]) {
        console.warn(`⚠ Route niet gevonden: ${path}`);
        if (path !== "/404") { 
            history.replaceState({}, "", "/404");
            loadView("/404");
        }
        return;
    }

    // // ✅ Reset quiz-index als de gebruiker naar een nieuwe quiz gaat
    // if (url.pathname.startsWith("/quiz")) {
    //     console.log("🔄 Reset `currentQuestionIndex` naar 0");
    //     window.currentQuestionIndex = 0;
    //     window.quizStarted = false;
    //     window.questionsFetched = false;
    // }

    removeOverlay(); // altijd de glory overlay verwijderen bij navigatie
    history.pushState({}, "", url);
    loadView(url.pathname + url.search);
};

// ✅ Laadt de juiste view en voorkomt herhaald laden
let isLoadingView = false; // ✅ Lock om herhaalde calls te voorkomen

const loadView = async (fullPath) => {
    removeOverlay();
    if (isLoadingView) {
        console.warn(`⚠ loadView() al bezig, vermijden van dubbele uitvoer voor: ${fullPath}`);
        return;
    }

    isLoadingView = true; // ✅ Zet de lock om dubbele calls te vermijden
    // console.log(`🔄 🚀 Laden van view: ${fullPath}`);

    const url = new URL(fullPath, window.location.origin);
    const viewPath = routes[url.pathname];

    if (!viewPath) {
        console.error(`❌ Route niet gevonden: ${url.pathname}`);
        navigateTo("/404");
        return;
    }

    try {
        const response = await fetch(viewPath);
        // console.log("🌐 View path:", viewPath);         // Log welk pad wordt opgevraagd
        // console.log("📥 Fetch response:", response);     // Log de volledige response
        
        if (!response.ok) throw new Error(`View ${viewPath} kon niet geladen worden.`);
        
        let html = await response.text();
        // console.log("💡 Gehaalde HTML view:", html);

        // ✅ Zorg dat de pagina alleen wordt geüpdatet als hij echt verandert
        if (document.getElementById("app").innerHTML !== html) {
            document.getElementById("app").innerHTML = `
                <div id="header"></div>
                <div id="app-content">
                    ${html}
                </div>
                <div id="footer"></div>
            `;

            await loadHeader();
            await loadFooter();

            // console.log("✅ View geladen:", fullPath);

            // we voegen class toe aan body bij login en registratie om margin-top weg te halen bij #app
            document.body.classList.remove("auth-page");
            if (url.pathname === "/" || url.pathname === "/register") {
                document.body.classList.add("auth-page");
            }
        } else {
            console.warn("⚠ View was al geladen, geen dubbele render.");
            return;
        }
          
        // ✅ Footer laadt maar één keer (niet nodig bij elke route-wijziging)
        // if (!window.footerLoaded) {
        //     loadFooter();
        //     window.footerLoaded = true;
        // }

        // ✅ Dynamisch body class aanpassen
        document.body.classList.remove("auth-page");
        if (url.pathname === "/" || url.pathname === "/register") {
            document.body.classList.add("auth-page");
        }

        // ✅ Laad de juiste functionaliteit per pagina
        switch (url.pathname) {
            case "/": initLogin(); break;
            case "/register": initRegister(); break;
            case "/dashboard_student": 
                initDashboardStudent(); 
                maybeTriggerMemeWheel(); 
                break;
            case "/dashboard_teacher": initDashboardTeacher(); break;
            case "/leaderboard_student": initLeaderboardStudent(); break;
            case "/leaderboard_teacher": initLeaderboardTeacher(); break;
            case "/profile_student": fetchProfileStudent(); break;
            case "/profile_teacher": fetchProfileTeacher(); break;
            case "/teacher_create_quiz": initCreateQuiz(); break;
            case "/teacher_edit_quiz": 
                initEditQuiz(); 
                console.log("📌 `initEditQuiz()` wordt nu aangeroepen!");
                break;
            case "/quiz": {
                const quizId = new URLSearchParams(url.search).get("id");
                if (quizId) {
                    fetchQuestions(quizId);
                } else {
                    console.error("❌ Geen quizId in de URL gevonden!");
                }
                break;
            }
            case "/quiz_result": 
                injectOverlay();
                fetchQuizResults() 
                break;
            case "/FAQ_student": fetchFAQStudent(); break;
            case "/FAQ_teacher": fetchFAQTeacher(); break;
        }
    } catch (error) {
        console.error("❌ FOUT bij laden van view:", error);
        document.getElementById("app").innerHTML = "<p class='error'>Er is een fout opgetreden bij het laden van de pagina.</p>";
    } finally {
        isLoadingView = false; // ✅ Zet de lock weer uit
    }
};

// ✅ Back en forward navigatie ondersteunen (inclusief query parameters)
window.addEventListener("popstate", () => {
    removeOverlay();
    loadView(location.pathname + location.search);
});

// ✅ Start SPA bij pageload, met behoud van query parameters -- WEG BIJ VITE
// document.addEventListener("DOMContentLoaded", () => {
//     loadHeader(); // ✅ Laad de header direct bij opstarten
//     loadView(location.pathname + location.search);
// });

// ✅ Header opnieuw laden bij route-wijziging MET VITE GEBRUIKEN WE INITROUTER (LOADHEADER EN LOADFOOTER worden via router.js > loadView() geladen)
export const initRouter = () => {
    // loadHeader();
    // loadFooter();
    loadView(location.pathname + location.search);
    };