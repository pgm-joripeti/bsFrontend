import { navigateTo } from "./router.js";
import { loadDropdownData, addQuestion } from "./teacher_create_quiz.js"; // ✅ Hergebruik vraag functionaliteit
// import 'mathlive';
import { showAlert } from "./utilities/alert.js";
import { secureFetch } from "./utilities/apiClient.js";
import { createShareComponent } from "./utilities/shareButtons.js";
import confetti from "canvas-confetti";

// ✅ Mathlive fonts configuratie
// window.MathfieldElement = MathfieldElement;
// window.MathfieldElement.fontsDirectory = '/mathlive/fonts';

// window.MathfieldElement = Mathlive.MathfieldElement;
// window.MathfieldElement.fontsDirectory = '/mathlive/fonts';

export const initEditQuiz = async () => {
    console.log("✅ Edit Quiz pagina geladen.");

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("id");

    if (!quizId) {
        console.error("❌ Geen quiz ID gevonden. Redirect naar dashboard.");
        navigateTo("/dashboard_teacher");
        return;
    }

    console.log(`🔍 Quiz bewerken met ID: ${quizId}`);

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Geen token gevonden. Redirect naar login.");
        navigateTo("/");
        return;
    }

    // console.log(`token opgehaald uit localStorage: ${token}`);

    try {
        console.log(`🔄 Ophalen quizgegevens voor quiz ID: ${quizId}`);

        // ✅ Haal quizgegevens op
        const quizData = await secureFetch(`/api/quizzes/${quizId}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json" 
            }
        });

        console.log(`📡 Server Response Status: ${quizData.status}`);
        console.log("Quizdata: ", quizData)
        
        // Check of er geen fout is
        if (!quizData || quizData.error) {
            throw new Error(quizData?.error || "Onbekende fout bij ophalen quiz");
        }
        
        if (!quizData) return

        // ✅ Dropdowns correct vullen met bestaande waarden
        await loadDropdownData("subjects", "course", "subject_name", "Kies een vak");
        await loadDropdownData("programs", "program", "program_name", "Kies een richting");
        await loadDropdownData("grades", "grade", "grade_name", "Kies een graad");

        // ✅ Vul formulier met quizgegevens
        document.querySelector("#title").value = quizData.title;
        document.querySelector("#course").value = quizData.subject_id;
        document.querySelector("#difficulty").value = quizData.difficulty;
        // document.querySelector("#program").value = quizData.program_id;
        document.querySelector("#grade").value = quizData.grade_id;
        // programs dropdown
        const programDropdown = document.querySelector("#program");
        Array.from(programDropdown.options).forEach(option => {
            option.selected = quizData.programs.some(program => program.id === option.value);
        });


        // ✅ Injecteer bestaande vragen
        injectQuestions(quizData.questions);

        // ✅ Form submissie updaten voor bewerken
        const quizForm = document.querySelector("#quizForm");
        quizForm.addEventListener("submit", (event) => submitUpdatedQuiz(event, quizId));

        // ✅ Event listener voor verwijderen
        document.querySelector("#deleteQuizBtn").addEventListener("click", () => deleteQuiz(quizId));

    } catch (error) {
        console.error("❌ Fout bij ophalen quiz data:", error);
    }
};

// ✅ **Vragen correct inladen in het formulier**
const injectQuestions = (questions) => {
    const vragenContainer = document.querySelector("#vragenContainer");
    vragenContainer.innerHTML = "";

    questions.forEach((question, index) => {
        addQuestion(false); // voeg vraag toe

        setTimeout(() => {
            // DOM-elementen ophalen (nu pas beschikbaar)
            const vraagText = document.querySelector(`#vraagText${index}`);
            const vraagType = document.querySelector(`#vraagType${index}`);
            const optionsContainer = document.getElementById(`optionsContainer${index}`);
            const timeLimit = document.querySelector(`#timeLimit${index}`);
            const correctAnswersContainer = document.getElementById(`correctAnswersContainer${index}`);
            const snippetSelect = document.querySelector(`#vraag-${index} select[name="snippet_type"]`);
            const snippetContainer = document.getElementById(`snippetFieldContainer${index}`);

            // ✅ Vul standaardvelden
            vraagText.value = question.question_text;
            vraagType.value = question.type;
            timeLimit.value = question.time_limit;

            // ✅ Multiple choice opties
            if (question.type === "multiple_choice") {
                optionsContainer.style.display = "block";
                document.querySelector(`#optie1_${index}`).value = question.options?.[0] ?? "";
                document.querySelector(`#optie2_${index}`).value = question.options?.[1] ?? "";
                document.querySelector(`#optie3_${index}`).value = question.options?.[2] ?? "";
                document.querySelector(`#optie4_${index}`).value = question.options?.[3] ?? "";
            }

            // ✅ Correct answers
            correctAnswersContainer.innerHTML = "";
            question.correct_answers.forEach((answer, i) => {
                const input = document.createElement("input");
                input.type = "text";
                input.value = answer;
                input.placeholder = `Correct antwoord ${i + 1}`;
                correctAnswersContainer.appendChild(input);
            });

            // ✅ SNIPPET dropdown en waarde
            if (question.snippet_type) {
                snippetSelect.value = question.snippet_type;
                snippetSelect.dispatchEvent(new Event("change")); // trigger visuele update

                setTimeout(() => {
                    if (question.snippet_type === "math" || question.snippet_type === "science") {
                        const mathField = snippetContainer.querySelector("math-field");
                        if (mathField && question.snippet_value) {
                            mathField.value = question.snippet_value;
                            mathField.virtualKeyboardMode = "onfocus"; // ✅ nieuwe correcte manier
                        }
                    }                    

                    if (question.snippet_type === "code") {
                        const textarea = document.querySelector(`#codeSnippet${index}`);
                        if (textarea) textarea.value = question.snippet_value ?? "";
                    }

                    if (question.snippet_type === "excel") {
                        const textarea = document.querySelector(`#excelSnippet${index}`);
                        if (textarea) textarea.value = question.snippet_value ?? "";
                    }

                    if (question.snippet_type === "image") {
                        const fileInput = snippetContainer.querySelector(`#imageSnippet${index}`);
                        if (fileInput && question.image_url) {
                            fileInput.dataset.url = question.image_url; // ✅ Zorgt dat het later opgepikt wordt
                        }
                        const preview = document.createElement("img");
                        preview.src = question.image_url;
                        preview.alt = "Huidige afbeelding";
                        preview.style.maxWidth = "100%";
                        preview.style.marginTop = "0.5rem";
                        snippetContainer.appendChild(preview);                        
                    }
                }, 50); // wacht tot snippet UI gerenderd is
            }
        }, 100); // wacht tot `addQuestion()` volledig klaar is
    });

    console.log("✅ Vragen succesvol ingeladen in formulier inclusief snippets.");
};

// ✅ **Quiz updaten bij submissie**
const submitUpdatedQuiz = async (event, quizId) => {
    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        await showAlert("❌ Je bent niet ingelogd. Log opnieuw in.");
        return;
    }

    const quizData = {
        title: document.querySelector("#title").value,
        subject_id: document.querySelector("#course").value,
        difficulty: document.querySelector("#difficulty").value,
        program_ids: Array.from(document.querySelector("#program").selectedOptions).map(o => o.value), // ✅ multi-select ondersteuning
        grade_id: document.querySelector("#grade").value
    };

    const vraagBlocks = document.querySelectorAll(".vraag-blok");

    const vragenData = await Promise.all(
        Array.from(vraagBlocks).map(async (blok, index) => {
          const vraagType = document.querySelector(`#vraagType${index}`).value;
          const snippetType = document.querySelector(`#snippetType${index}`)?.value || null;
      
          let snippetValue = null;
          let imageUrl = null;
      
          if (snippetType === "math" || snippetType === "science") {
            snippetValue = document.querySelector(`#mathField${index}`)?.getValue?.() || null;
          }
          if (snippetType === "code") {
            snippetValue = document.querySelector(`#codeSnippet${index}`)?.value?.trim() || null;
          }
          if (snippetType === "excel") {
            snippetValue = document.querySelector(`#excelSnippet${index}`)?.value?.trim() || null;
          }
          if (snippetType === "image") {
            const fileInput = document.querySelector(`#imageSnippet${index}`);
            const file = fileInput?.files?.[0];
      
            if (file) {
              const filePath = `snippet_${Date.now()}_${file.name}`;
              const formData = new FormData();
              formData.append("file", file);
      
              const uploadRes = await fetch(`http://localhost:3000/api/supabase/upload?path=${filePath}`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              });
      
              const { url } = await uploadRes.json();
              imageUrl = url;
            } else {
              imageUrl = fileInput?.dataset?.url || null;
            }
          }
      
          return {
            question_text: document.querySelector(`#vraagText${index}`).value.trim(),
            type: vraagType,
            options: vraagType === "multiple_choice"
              ? [
                  document.querySelector(`#optie1_${index}`).value.trim(),
                  document.querySelector(`#optie2_${index}`).value.trim(),
                  document.querySelector(`#optie3_${index}`).value.trim(),
                  document.querySelector(`#optie4_${index}`).value.trim(),
                ].filter(opt => opt !== "")
              : null,
            correct_answers: Array.from(document.querySelectorAll(`#correctAnswersContainer${index} input`))
              .map(input => input.value.trim())
              .filter(answer => answer !== ""),
            time_limit: parseInt(document.querySelector(`#timeLimit${index}`).value),
            snippet_type: snippetType,
            snippet_value: snippetType !== "image" ? snippetValue : null,
            image_url: snippetType === "image" ? imageUrl : null
          };
        })
      );

    // ✅ Stuur geüpdatete quiz naar backend
    try {
        const res = await fetch(`/api/quizzes/${quizId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ...quizData, questions: vragenData })
        });

        if (!res.ok) throw new Error("❌ Quiz kon niet geüpdatet worden.");

        const myShareComponent = createShareComponent({
            text: "Ik heb net een quiz aangepast in Brainsmash!",
            url: "https://brainsmash.be",
            targetSelector: "#screenshot-target"
          });

        await showAlert("✅ Quiz succesvol geüpdatet!", { shareComponent: myShareComponent });

        confetti({
        particleCount: 120,
        angle: 90,
        spread: 100,
        origin: { y: 0.5 }
        });

        navigateTo("/dashboard_teacher");
    } catch (error) {
        console.error("❌ Fout bij updaten quiz:", error);
        await showAlert("Er is een fout opgetreden. Probeer opnieuw.");
    }
};

// ✅ **Quiz verwijderen**
const deleteQuiz = async (quizId) => {
    const confirmation = await showAlert("Weet je zeker dat je deze quiz wilt verwijderen?", {
        confirmButton: true,
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
        const res = await fetch(`/api/quizzes/${quizId}`, { 
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("❌ Kon quiz niet verwijderen.");

        await showAlert("✅ Quiz succesvol verwijderd!");
        navigateTo("/dashboard_teacher");

    } catch (error) {
        console.error("❌ Fout bij verwijderen quiz:", error);
        await showAlert("Er is een fout opgetreden.");
    }
};