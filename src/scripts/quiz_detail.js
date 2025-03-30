import { navigateTo } from "./router.js";
import { normalizeAnswer } from "./utilities/normalizeAnswer.js";
import { sanitizeSnippet } from "./utilities/sanitizeLatex.js";
// import { typesetMath } from './utilities/mathjax.config.js';
import { applyBrainBackground } from "./utilities/brainBackground.js";
import { secureFetch } from "./utilities/apiClient.js";
import { typesetMath } from './utilities/mathJax.js';

const API_BASE = import.meta.env.VITE_API_BASE;

function renderQuestion(q) {
  questionEl.innerHTML = q.text; // met LaTeX
  typesetMath(); // triggert MathJax
}

// let isLoading = false;
let currentQuestionIndex = 0;
let questions = [];
let timer;
let timeLeft = 20;
let score = 0;
let quizId;
let userId;

let hasSubmitted = false;

// ✅ Haal quizvragen op en start quiz
export async function fetchQuestions(quizIdParam) {
    // console.log("🚀 fetchQuestions() AANGEROEPEN met quizId:", quizIdParam);

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("🚨 Geen token gevonden! Stuur gebruiker terug naar login.");
        navigateTo("/");
        return;
    }

    try {
        const response = await secureFetch(`/api/quizzes/${quizIdParam}/questions`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        questions =  response;
        if (!questions || !questions.length) {
            document.getElementById("feedback").innerText = "Geen vragen gevonden.";
            return;
        }

        // console.log("✅ Vragen succesvol opgehaald:", questions);
        quizId = quizIdParam;
        currentQuestionIndex = 0; // **🚀 START ALTIJD BIJ VRAAG 1**
        loadQuestion(currentQuestionIndex);
    } catch (error) {
        console.error("❌ Error in fetchQuestions:", error);
        document.getElementById("feedback").innerText = "Fout bij laden van de quiz.";
    }
}

export async function fetchQuizDetails(quizId) {
    const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    });

    if (!response.ok) {
        console.error("❌ Kon quiz details niet ophalen.");
        return;
    }

    const quiz = await response.json();
    document.getElementById("quiz-title").innerText = quiz.title;
}

function startQuiz() {
    console.log("🚀 startQuiz() AANGEROEPEN!");

    const user = JSON.parse(localStorage.getItem("user"));
    userId = user?.id; // Haal de "id" key op uit het user object

    if (!quizId || !userId) {
        document.getElementById("feedback").innerText = "Quiz of gebruiker niet gevonden.";
        return;
    }

    if (questions.length === 0) {
        console.error("🚨 Geen vragen beschikbaar, kan quiz niet starten.");
        document.getElementById("feedback").innerText = "Geen vragen beschikbaar.";
        return;
    }

    // ✅ Reset de vraagindex als de quiz start
    // console.log("🔄 Reset `currentQuestionIndex` naar 0 bij start quiz");
    currentQuestionIndex = 0;
    score = 0; // ✅ Reset score bij nieuwe quiz

    console.log("📌 Controleer eerste vraag:", questions[0]);

    console.log("🔄 Start quiz met de eerste vraag...");
    loadQuestion(currentQuestionIndex);
    
}
  
async function loadQuestion(index) {

    hasSubmitted = false; // ✅ bij elke nieuwe vraag resetten

    if (!document.getElementById("quiz-container")) {
        console.error("🚨 quiz-container niet gevonden in de DOM!");
        return;
    }

    if (index >= questions.length) {
        console.log("🏁 Alle vragen beantwoord. Quiz beëindigen...");
        finishQuiz();
        return;
    }

    const questionData = questions[index];
    console.log(`📝 Laadt vraag ${index + 1}:`, questionData);

    document.getElementById("questionText").textContent = questionData.question_text;

    const snippetWrapper = document.getElementById("snippet");
    snippetWrapper.innerHTML = ""; // Clear previous content

    // 🔢 Math en Science → als block weergegeven (MathJax)
    if (questionData.snippet_type === "math" || questionData.snippet_type === "science") {
        const mathBlock = document.createElement("div");
        const sanitizedSnippet = sanitizeSnippet(questionData.snippet_value);
        mathBlock.innerHTML = `\\[${sanitizedSnippet}\\]`; // ✅ inline vervangen door block-notatie
        mathBlock.classList.add("snippet-math");
        snippetWrapper.appendChild(mathBlock);
    
        await MathJax.typesetPromise([mathBlock]); // ✅ expliciet renderen
    }    

    // 💻 Code of Excel uitleg
    if ((questionData.snippet_type === "code" || questionData.snippet_type === "excel") &&
    !questionData.snippet_value?.includes("$$")) {

    const pre = document.createElement("pre");
    pre.textContent = questionData.snippet_value || "";
    pre.classList.add("snippet-code");
    snippetWrapper.appendChild(pre);

    } else if (questionData.snippet_type === "code" && questionData.snippet_value?.includes("$$")) {
        // LaTeX fout ingeslikt in code-snippet => render dan maar als math
        const fallback = document.createElement("div");
        fallback.innerHTML = `\\[${sanitizeSnippet(questionData.snippet_value)}\\]`;
        fallback.classList.add("snippet-math");
        snippetWrapper.appendChild(fallback);
        await MathJax.typesetPromise([fallback]);
    }

    // 🖼️ Afbeelding bij de vraag
    if (questionData.image_url) {
        const img = document.createElement("img");
        img.src = questionData.image_url;
        img.alt = "Afbeelding bij de vraag";
        // img.style.maxWidth = "100%";
        // img.style.marginTop = "1rem";
        img.classList.add("snippet-image");
        snippetWrapper.appendChild(img);
    }

    document.getElementById("answers").innerHTML = "";
    document.getElementById("feedback").innerText = "";

    setupSpeechButton(questionData.question_text); // ✅ Spraakfunctie activeren

    timeLeft = questionData.time_limit || 20;
    document.getElementById("timeLeft").innerText = timeLeft;

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            document.getElementById("timeLeft").innerText = timeLeft;
        } else {
            clearInterval(timer);
            submitAnswer("", true);
        }
    }, 1000);

    if (questionData.type === "multiple_choice" && questionData.options) {
        for (const option of questionData.options) {
            const label = document.createElement("label");
            label.textContent = option;
            label.classList.add("checkbox-label"); // 👈 geen Math-class!

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = option;
            checkbox.name = "answer";
    
            const wrapper = document.createElement("div");
            wrapper.classList.add("checkbox-wrapper");
            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
    
            document.getElementById("answers").appendChild(wrapper);
        }  
    } else {
        const answerWrapper = document.getElementById("answers");

        answerWrapper.innerHTML = ""; // clear
        answerWrapper.classList.add("multiple-choice-layout");

        // 🆕 Voeg één gezamelijke container toe
        const answerGroup = document.createElement("div");
        answerGroup.classList.add("answer-group");
        answerWrapper.appendChild(answerGroup);
    
        // Snippet dropdown
        const snippetSelect = document.createElement("select");
        snippetSelect.innerHTML = `
            <option value="">Antwoordtype</option>
            <option value="text">Tekst</option>
            <option value="math">Wiskundige formule</option>
            <option value="code">Code</option>
            <option value="excel">Excel</option>
        `;
        snippetSelect.id = "answerSnippetType";
        answerGroup.appendChild(snippetSelect);

        // Inputveld placeholder
        const answerInput = document.createElement("div");
        answerInput.id = "answerSnippetInput";
        answerGroup.appendChild(answerInput);
    
        snippetSelect.addEventListener("change", () => {
            const value = snippetSelect.value;
            answerInput.innerHTML = "";
        
            if (value === "text") {
                const input = document.createElement("input");
                input.type = "text";
                input.id = "userAnswer";
                input.classList.add("snippet-input", "snippet-text");
                answerInput.appendChild(input);
            }
        
            if (value === "math") {
                const mathField = document.createElement("math-field");
                mathField.id = "mathAnswer";
                mathField.classList.add("snippet-input", "snippet-math");
                answerInput.appendChild(mathField);
            }
        
            if (value === "code" || value === "excel") {
                const textarea = document.createElement("textarea");
                textarea.id = "userAnswer";
                textarea.placeholder = "Typ hier je antwoord...";
                textarea.classList.add("snippet-input", `snippet-${value}`);
                answerInput.appendChild(textarea);
            }
        });        

        applyBrainBackground("#quiz-container", {
            count: 8,
            size: 70,
            opacity: 0.09,
            animate: true
          });  
            
        await typesetMath(document.getElementById("questionText"));
 
    }
    

    const nextButton = document.getElementById("next-question-btn");
    if (nextButton) {
        nextButton.innerText = (index === questions.length - 1) ? "Dien in" : "Volgende Vraag";
        nextButton.disabled = false; // ✅ Heractiveer knop bij elke nieuwe vraag
        nextButton.onclick = () => {
            nextButton.disabled = true; // ✅ Disable knop direct na klik
            let userInput = "";

            if (questionData.type === "multiple_choice") {
                const checkedBoxes = document.querySelectorAll('input[name="answer"]:checked');
                userInput = Array.from(checkedBoxes).map(cb => cb.value);
            } else {
                const selectedType = document.getElementById("answerSnippetType")?.value;

                if (selectedType === "math") {
                    userInput = document.getElementById("mathAnswer")?.getValue();
                } else {
                    userInput = document.getElementById("userAnswer")?.value?.trim();
                }
            }
            submitAnswer(userInput, false);
        };
    } else {
        console.error("🚨 next-question-btn niet gevonden in de DOM!");
    }
}

// ✅ Tekst-naar-spraak functie
function textToSpeech(text) {
    if (!window.speechSynthesis) {
        console.warn("❌ Spraakondersteuning niet beschikbaar in deze browser.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "nl-BE"; // ✅ Nederlands
    window.speechSynthesis.speak(utterance);
}

// ✅ Zorg ervoor dat de knop correct gekoppeld wordt
function setupSpeechButton(questionText) {
    const speakBtn = document.getElementById("speakBtn");
    if (speakBtn) {
        speakBtn.onclick = () => textToSpeech(questionText);
    } else {
        console.error("🚨 speakBtn niet gevonden in de DOM!");
    }
}

function playSound(isCorrect) {
    const audio = new Audio(isCorrect ? "/assets/sounds/success.mp3" : "/assets/sounds/error.mp3");
    audio.play();
}

function updateProgressBar() {
    const progressElement = document.getElementById("progress");
    if (!progressElement) {
        console.error("❌ Progress bar niet gevonden in de DOM!");
        return;
    }

    const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
    console.log(`📊 Update progress: ${progressPercentage.toFixed(2)}%`);
    
    progressElement.style.width = `${progressPercentage}%`;
}

async function submitAnswer(userInput, isTimeout) {
    console.log(`🚀 submitAnswer() AANGEROEPEN! Timeout: ${isTimeout}`);

    if (hasSubmitted) return; // ✅ VERMIJD DUBBELLE CALLS
    hasSubmitted = true;

    clearInterval(timer);

    if (currentQuestionIndex >= questions.length) {
        console.error("🚨 Geen verdere vragen beschikbaar!");
        return;
    }

    const questionData = questions[currentQuestionIndex];

    if (!questionData || !questionData.id) {
        console.error("🚨 Vraagdata is undefined! currentQuestionIndex:", currentQuestionIndex);
        return;
    }

    const token = localStorage.getItem("token");

    console.log("⏱️ Voor submit: score =", score);

    try {
        const response = await fetch(`${API_BASE}/api/quizzes/${quizId}/answer`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ questionId: questionData.id, userAnswer: userInput })
        });

        if (!response.ok) throw new Error("Fout bij indienen antwoord.");
        const result = await response.json();

        // console.log("📌 API response ontvangen:", result);
        // console.log("📌 Verwachte juiste antwoorden:", questionData.correct_answers);

        let isCorrect = result.correct;
        let correctAnswers = result.correctAnswer || result.correct_answers || questionData.correct_answers || [];
        if (!Array.isArray(correctAnswers)) {
            correctAnswers = [correctAnswers]; // ✅ Zorg dat het altijd een array is
        }

        // console.log("✅ Correcte antwoorden ontvangen:", correctAnswers);

        isCorrect = false;

        if (questionData.type === "multiple_choice") {
            const normalizedUser = (userInput || []).map(a => normalizeAnswer(a));
            const normalizedCorrect = correctAnswers.map(a => normalizeAnswer(a));

            // Vergelijk sets (ongeacht volgorde of casing)
            const userSet = new Set(normalizedUser);
            const correctSet = new Set(normalizedCorrect);

            isCorrect =
                userSet.size === correctSet.size &&
                [...userSet].every(answer => correctSet.has(answer));
        } else {
            const userAnswerNormalized = normalizeAnswer(userInput);
            isCorrect = correctAnswers.some(correct => normalizeAnswer(correct) === userAnswerNormalized);
        }

        if (isCorrect) {
            score += 1; // ✅ Altijd +1 bij correcte vraag
            console.log(`✅ Correct! Score verhoogd met 1. Totale score: ${score}`);
            document.getElementById("feedback").innerText = "✅ Juist!";
            playSound(true); // ✅ Speel success.mp3 af
        } else {
            console.log("❌ Verkeerd antwoord. Geen score toegevoegd.");
            const feedbackEl = document.getElementById("feedback");

            const renderedAnswers = correctAnswers.map(ans => `
              <span class="correct-answer-tag">${ans}</span>
            `);
            
            feedbackEl.innerHTML = `
              <div class="text-feedback">
                Fout! <strong>${renderedAnswers.join(" of ")}</strong>
              </div>
            `;

            playSound(false); // ✅ Speel error.mp3 af

            // ✅ MathJax renderen op alle correct antwoorden (asynchroon)
            window.MathJax.typesetPromise([feedbackEl]).then(() => {
                console.log("✅ Correct antwoord gerenderd met Mathjax");
            }).catch(err => console.error("❌ MathJax rendering error:", err));
        }

        // ✅ Progress bar updaten
        updateProgressBar();
        
        // 🚀 Controleer of er nog een volgende vraag is voordat we de index verhogen
        if (currentQuestionIndex + 1 < questions.length) {
            setTimeout(() => {
                currentQuestionIndex++;
                loadQuestion(currentQuestionIndex);
            }, 2000);
        } else {
            setTimeout(() => {
                console.log("🏁 Geen vragen meer, quiz is voltooid!");
                finishQuiz();
            }, 2000); // zelfde delay zodat laatste feedback correct verwerkt wordt
        }
        
    } catch (error) {
        console.error("❌ Fout bij indienen antwoord:", error);
        document.getElementById("feedback").innerText = "Fout bij verwerken van het antwoord.";
    }
}

async function finishQuiz() {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user")); // ✅ Haal user op
    const userId = user?.id; // ✅ Zorg dat userId correct wordt opgehaald

    console.log("🏁 Quiz voltooid! Verzend data naar backend...");
    // console.log("🔍 quizId:", quizId);
    // console.log("🔍 userId:", userId); // ✅ Nu MOET deze correct zijn
    console.log("🔍 score (Qbits verdiend):", score);

    if (!userId) {
        console.error("❌ Geen userId gevonden! Quizresultaten kunnen niet worden opgeslagen.");
        return;
    }

    console.log("📤 Verzenden naar backend: score =", score);

    try {
        const res = await fetch(`${API_BASE}/api/quizzes/${quizId}/finish`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ 
                userId, 
                qbitsEarned: score, 
                xpEarned: 2 }) // ✅ UserId wordt correct doorgestuurd
        });

        if (!res.ok) {
            console.error("❌ Quizresultaten NIET opgeslagen!");
            return;
          }
          
        console.log("✅ Quizresultaten succesvol opgeslagen!");

        // 🎧 Prepareer badgeSound (unlock audio) ; we maken audio kanaal vrij voor newbadge sound (drum-roll) omdat dit anders niet wordt afgespeeld ; deze code geldt als "trigger" om het straks af te spelen (indien er nieuwe badges zijn)
        const badgeSound = new Audio("/assets/sounds/drum-roll.mp3");
        badgeSound.play().then(() => {
            badgeSound.pause();
            badgeSound.currentTime = 0;
        }).catch(() => {
            console.warn("⚠️ Kan drum-roll niet vooraf voorbereiden.");
        });

        sessionStorage.setItem("allowAudio", "true");
        navigateTo(`/quiz_result?id=${quizId}`);
        
    } catch (error) {
        console.error("❌ Fout bij voltooien quiz:", error);
        document.getElementById("feedback").innerText = "Fout bij opslaan van de quizresultaten.";
    }
}

// AI functionaliteit
// ✅ Voeg AI Tip Modal en AI Tip Container Dynamisch Toe
document.addEventListener("DOMContentLoaded", () => {
    const aiModalHTML = `
        <div id="aiTipModal" class="ai-modal">
            <p>Een AI-tip kost je <strong>30 Qbits</strong>. Wil je doorgaan?</p>
            <div class="btn-container">
                <button id="confirmAiTip" class="btn btn-success">OK</button>
                <button id="cancelAiTip" class="btn btn-alert">Annuleer</button>
            </div>
        </div>`;

    const aiTipContainerHTML = `
        <div id="aiTipContainer" class="ai-tip-container wobble-in">
            <button id="closeAiTip" class="ai-tip__close">
                <span class="material-icons">close</span>
            </button>
            <p id="aiTipText"></p>
        </div>`;

        const qbitModalHTML = `
        <div id="qbitModal" class="ai-tip-container wobble-in">
            <button id="closeQbitModal" class="ai-tip__close">
                <span class="material-icons">close</span>
            </button>
            <p class="ai-tip__title">Niet genoeg Qbits</p>
            <p class="ai-tip__content">
                Je hebt onvoldoende Qbits om een AI-tip te gebruiken.<br>
                Een tip kost <strong>30 Qbits</strong>, maar je hebt er momenteel <span id="currentQbitCount">?</span>.
            </p>
            <div class="btn-container" style="margin-top: var(--margin_s);">
                <button id="koopQbitsBtn" class="btn btn-success">Koop Qbits</button>
            </div>
        </div>`;    

    document.body.insertAdjacentHTML("beforeend", aiModalHTML);
    document.body.insertAdjacentHTML("beforeend", aiTipContainerHTML);
    document.body.insertAdjacentHTML("beforeend", qbitModalHTML);

    console.log("📌 AI Tip Modal en AI Tip Container zijn dynamisch toegevoegd.");

// ✅ Voeg de eventlistener toe zodra de knop is toegevoegd
const koopBtn = document.getElementById("koopQbitsBtn");
if (koopBtn) {
    koopBtn.addEventListener("click", async () => {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`${API_BASE}/api/payments/create-checkout-session`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ userId: user.id })
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("❌ Er ging iets mis bij het aanmaken van de betaalpagina.");
            }
        } catch (err) {
            console.error("❌ Fout bij starten van betaling:", err);
        }
    });
} else {
    console.warn("⚠️ koopQbitsBtn niet gevonden op DOMContentLoaded.");
}

console.log("📌 AI Tip Modal en AI Tip Container zijn dynamisch toegevoegd.");
});

document.body.addEventListener("click", async (event) => {
    if (event.target.id === "aiTipBtn" || event.target.closest("#aiTipBtn")) {
      const qbits = await fetchQbitBalance();
      const aiTipModal = document.getElementById("aiTipModal");
      const qbitModal = document.getElementById("qbitModal");
      const overlay = document.getElementById("aiTipOverlay");
  
      if (qbits >= 30) {
        // Toon AI modal
        if (aiTipModal) {
          aiTipModal.style.opacity = "0";
          aiTipModal.style.transform = "translate(-50%, -50%) scale(0.9)";
          aiTipModal.style.display = "block";
          setTimeout(() => {
            aiTipModal.style.opacity = "1";
            aiTipModal.style.transform = "translate(-50%, -50%) scale(1)";
          }, 10);
        }
      } else {
        // Toon Qbit modal
        document.getElementById("currentQbitCount").innerText = qbits;
        if (qbitModal) qbitModal.classList.add("show");
        if (overlay) overlay.classList.add("show");
      }
    }
  });
  

// ✅ Sluit de AI Tip Bevestigingsmodal
document.body.addEventListener("click", (event) => {
    if (event.target.id === "cancelAiTip") {
        console.log("❌ AI Tip geannuleerd.");
        const aiTipModal = document.getElementById("aiTipModal");

        if (aiTipModal) {
            aiTipModal.style.opacity = "0"; 
            aiTipModal.style.transform = "translate(-50%, -50%) scale(0.9)";
            setTimeout(() => aiTipModal.style.display = "none", 200);
        }
    }
});

document.body.addEventListener("click", (event) => {
    if (event.target.id === "closeQbitModal" || event.target.closest("#closeQbitModal")) {
      const qbitModal = document.getElementById("qbitModal");
      const overlay = document.getElementById("aiTipOverlay");
      if (qbitModal) qbitModal.classList.remove("show");
      if (overlay) overlay.classList.remove("show");
    }
  });
  

// spinner
document.addEventListener("DOMContentLoaded", () => {
    // Voeg overlay en loader toe aan body
    const aiOverlayHTML = `<div id="aiTipOverlay" class="ai-tip-overlay"></div>`;
    const aiLoaderHTML = `
        <div id="aiTipLoader" class="ai-tip-loader">
            <div class="ai-tip-spinner"></div>
            <p>AI is aan het nadenken...</p>
        </div>`;

        document.body.insertAdjacentHTML("beforeend", aiOverlayHTML);
        document.body.insertAdjacentHTML("beforeend", aiLoaderHTML);
        console.log("📌 AI Tip Overlay en Loader dynamisch toegevoegd.");
});

// ✅ Vraag de AI Tip op en Toon in AI Tip Container
document.body.addEventListener("click", async (event) => {
    if (event.target.id === "confirmAiTip") {
        console.log("✅ AI Tip wordt opgevraagd...");

        const aiTipContainer = document.getElementById("aiTipContainer");
        const aiTipText = document.getElementById("aiTipText");
        const aiTipModal = document.getElementById("aiTipModal");
        const aiTipLoader = document.getElementById("aiTipLoader");
        const aiTipOverlay = document.getElementById("aiTipOverlay");

        if (aiTipModal) aiTipModal.style.display = "none"; // Sluit de bevestigingsmodal
        if (aiTipLoader) aiTipLoader.classList.add("show"); // Toon loader
        if (aiTipOverlay) aiTipOverlay.classList.add("show"); // Toon donkere overlay

        const questionData = questions[currentQuestionIndex];
        const questionText = document.getElementById("questionText")?.innerText;
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.id) {
            alert("Je moet ingelogd zijn om een AI-tip te krijgen.");
            return;
        }

        try {
            const questionData = questions[currentQuestionIndex];

            console.log("🧠 Verstuur AI Tip met:", {
            userId: user.id,
            quizId,
            questionText,
            snippet_type: questionData.snippet_type,
            snippet_value: questionData.snippet_value,
            image_url: questionData.image_url
            });

            const response = await fetch(`${API_BASE}/api/quizzes/ai-tip`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    quizId,
                    questionText,
                    snippet_type: questionData.snippet_type,
                    snippet_value: questionData.snippet_value,
                    image_url: questionData.image_url
                })
            });


            if (!response.ok) throw new Error("Kon geen AI-tip ophalen.");
            const data = await response.json();

            console.log("💡 AI Tip ontvangen:", data.aiTip);

            // **Verberg loader + overlay vóór het tonen van de AI Tip**
            if (aiTipLoader) aiTipLoader.classList.remove("show");
            if (aiTipOverlay) aiTipOverlay.classList.remove("show");
            setTimeout(() => {
                aiTipLoader.style.visibility = "hidden";
                aiTipOverlay.style.visibility = "hidden";
            }, 300); // Zorg dat ze volledig verdwijnen

            // ✅ Eerst tekst invullen, daarna zichtbaar maken!
            aiTipText.innerHTML = `
                <p class="ai-tip__title">💡 AI TIP </p>
                <p class="ai-tip__content">${data.aiTip}</p>
            `;

            // **Reset eventuele oude animatie en start de wobble-in opnieuw**
            aiTipContainer.classList.remove("wobble-out");
            void aiTipContainer.offsetWidth; // 🔥 Forceer reflow zodat animatie opnieuw werkt!
            aiTipContainer.classList.add("show"); // Activeer wobble-in effect

        } catch (error) {
            console.error("❌ Fout bij ophalen AI-tip:", error);
            alert("Kon geen AI-tip ophalen.");
        }
    }
});

// ✅ Sluit de AI Tip Container met de X-knop zonder verspringing
document.body.addEventListener("click", (event) => {
    if (event.target.id === "closeAiTip" || event.target.closest("#closeAiTip")) {
        console.log("❌ AI Tip sluiten met wobble-out effect.");
        const aiTipContainer = document.getElementById("aiTipContainer");

        if (aiTipContainer) {
            aiTipContainer.classList.remove("show"); // Verwijder wobble-in klasse
            aiTipContainer.classList.add("wobble-out"); // Voeg wobble-out animatie toe

            // **Verwijder de wobble-out klasse en verberg de container na animatie**
            setTimeout(() => {
                aiTipContainer.style.visibility = "hidden";
                aiTipContainer.classList.remove("wobble-out"); // Reset zodat hij opnieuw werkt
            }, 800); // 800ms = duur van de animatie
        }
    }
});

async function fetchQbitBalance() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/api/student/qbits`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Fout bij ophalen Qbit-balans.");
        const data = await res.json();
        return data.qbits;
    } catch (error) {
        console.error("❌ Fout bij ophalen Qbits:", error);
        return 0;
    }
}



