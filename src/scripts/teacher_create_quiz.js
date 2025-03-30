import { navigateTo } from "./router.js"; // ✅ Zorg ervoor dat navigateTo beschikbaar is
// import { MathfieldElement } from 'mathlive';
// import Mathlive from 'mathlive/dist/mathlive.mjs';
import { showAlert } from "./utilities/alert.js";
import confetti from "canvas-confetti";
import { applyBrainBackground } from "./utilities/brainBackground.js";
import { createShareComponent } from "./utilities/shareButtons.js";
import { secureFetch } from "./utilities/apiClient.js";

// ✅ Mathlive fonts configuratie
// window.MathfieldElement = MathfieldElement;
// window.MathfieldElement.fontsDirectory = '/mathlive/fonts';

// window.MathfieldElement = Mathlive.MathfieldElement;
// window.MathfieldElement.fontsDirectory = '/mathlive/fonts';

export const initCreateQuiz = async () => {
    console.log("✅ Teacher Create Quiz pagina geladen.");

    // ✅ Dropdowns laden
    await loadDropdownData("programs", "program", "program_name", "Kies een richting");
    await loadDropdownData("grades", "grade", "grade_name", "Kies een graad");
    await loadDropdownData("subjects", "course", "subject_name", "Kies een vak");

    const quizForm = document.querySelector("#quizForm");
    if (quizForm) {
        quizForm.addEventListener("submit", submitQuiz);
        console.log("✅ submitQuiz event listener toegevoegd aan #quizForm.");
    } else {
        console.error("❌ FOUT: #quizForm niet gevonden in de DOM!");
    }

    const addQuestionBtn = document.querySelector("#addQuestionBtn");
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener("click", addQuestion);
        console.log("✅ Event listener toegevoegd aan 'Voeg Vraag Toe' knop.");
    } else {
        console.error("❌ FOUT: Knop #addQuestionBtn niet gevonden! Controleer je HTML.");
    }

    applyBrainBackground(".createquiz-header", {
        count: 8,
        size: 70,
        opacity: 0.09,
        animate: true
      });      
};

// const vragen = [];

// ✅ **Dropdowns vullen**
const loadDropdownData = async (table, dropdownId, columnName, placeholderText) => {
    try {
        const res = await secureFetch(`/api/${table}`);
        // if (!res.ok) throw new Error(`Fout bij ophalen van ${table}`); deze zou crashen met secureFetch, omdat die al json teruggeeft en res.ok bestaat niet meer

        const data =  res;
        if (!data) return;

        const dropdown = document.querySelector(`#${dropdownId}`);
        dropdown.innerHTML = `<option value="">${placeholderText}</option>`; 

        data.sort((a, b) => a[columnName].localeCompare(b[columnName])); 
        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item[columnName];
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error(`❌ Fout bij laden van ${table}:`, error);
    }
};

// ✅ **Vraag toevoegen**
const addQuestion = (showRemoveBtn = true) => {
    console.log("✅ Voeg Vraag Toe knop werd geklikt!");

    const vragenContainer = document.querySelector("#vragenContainer");
    if (!vragenContainer) {
        console.error("❌ FOUT: #vragenContainer niet gevonden in de DOM!");
        return;
    }

    const vraagIndex = document.querySelectorAll(".vraag-blok").length;

    const vraagDiv = document.createElement("div");
    vraagDiv.classList.add("vraag-blok", "wobble-in");

    vraagDiv.setAttribute("id", `vraag-${vraagIndex}`); // 🔥 Uniek ID per vraagblok

    vraagDiv.innerHTML = `
    <h3 class="vraag-titel">Vraag ${vraagIndex + 1}</h3>
    <div class="addquestion-wrapper">
        <input type="text" placeholder="Vraagtekst" id="vraagText${vraagIndex}" required>

        <label for="snippetType">Extra Snippet:</label>
        <select id="snippetType${vraagIndex}" name="snippet_type">
            <option value="">Geen</option>
            <option value="math">Wiskundige formule</option>
            <option value="code">Code snippet</option>
            <option value="excel">Excel uitleg</option>
            <option value="science">Wetenschappelijke formule</option>
            <option value="image">Afbeelding (grafiek, schema...)</option>
        </select>

        <div id="snippetFieldContainer${vraagIndex}" class="snippet-container"></div>


        <select id="vraagType${vraagIndex}" class="vraagType" data-index="${vraagIndex}">
            <option value="">Selecteer vraagtype</option>
            <option value="multiple_choice">Meerkeuze</option>
            <option value="open">Open</option>
        </select>

        <div id="optionsContainer${vraagIndex}" style="display: none;">
            <input type="text" placeholder="Optie 1" id="optie1_${vraagIndex}">
            <input type="text" placeholder="Optie 2" id="optie2_${vraagIndex}">
            <input type="text" placeholder="Optie 3" id="optie3_${vraagIndex}">
            <input type="text" placeholder="Optie 4" id="optie4_${vraagIndex}">
        </div>
        <div class="multipleCorrections-wrapper">
            <label for="multipleCorrect${vraagIndex}">Meerdere correcte antwoorden?</label>
            <input type="checkbox" id="multipleCorrect${vraagIndex}" class="multipleCorrect-checkbox" data-index="${vraagIndex}">
        </div>

        <div id="correctAnswersContainer${vraagIndex}">
            <input type="text" placeholder="Vul correct antwoord in" id="correctAnswer${vraagIndex}" required>
        </div>
        <button type="button" class="addCorrectAnswerBtn hidden btn btn-primary" data-index="${vraagIndex}">+ Voeg Correct Antwoord Toe</button>
        <div class="timelimit-wrapper">
            <label>Tijdslimiet (s):</label>
            <select id="timeLimit${vraagIndex}">
                <option value="10">10s</option>
                <option value="20">20s</option>
                <option value="30">30s</option>
                <option value="60">60s</option>
                <option value="120">2 minuten</option>
                <option value="300">5 minuten</option>
            </select>
        </div>
    </div>
    ${showRemoveBtn ? `
        <button type="button" class="removeQuestionBtn btn btn-alert" data-index="${vraagIndex}">Verwijder Vraag</button>
        ` : ""}
    `;

    vragenContainer.appendChild(vraagDiv);
    vraagDiv.classList.add("vraag-blok", "wobble-in");
    vragenContainer.appendChild(vraagDiv);

    // 🧠 Verwijder de wobble-in class na de animatie
    setTimeout(() => {
        vraagDiv.classList.remove("wobble-in");
    }, 800); // zelfde als in CSS animatie

    // ✅ Scroll pas daarna naar het element
    setTimeout(() => {
        vraagDiv.scrollIntoView({ behavior: "smooth", block: "start" });

        vraagDiv.classList.add("scroll-focus");
        setTimeout(() => vraagDiv.classList.remove            ("scroll-focus"), 2000);
    }, 850); // iets na de wobble, zodat visuele flow klopt


    // Dynamische snippet logica
const snippetSelect = document.querySelector(`#vraag-${vraagIndex} select[name="snippet_type"]`);
const snippetContainer = document.getElementById(`snippetFieldContainer${vraagIndex}`);

if (snippetSelect) {
    snippetSelect.addEventListener("change", () => {
        const value = snippetSelect.value;
        snippetContainer.innerHTML = ""; // Clear existing content

        if (value === "math") {
            snippetContainer.innerHTML = `<math-field id="mathField${vraagIndex}" style="width: 100%; min-height: 3rem;"></math-field>`;
            const mathfield = document.querySelector(`#mathField${vraagIndex}`);
            if (mathfield) {
                mathfield.virtualKeyboardMode = "onfocus";
            }
        }

        if (value === "code") {
            snippetContainer.innerHTML = `<textarea id="codeSnippet${vraagIndex}" placeholder="Plak hier je code..." rows="6" style="width: 100%; font-family: monospace;"></textarea>`;
        }

        if (value === "excel") {
            snippetContainer.innerHTML = `<textarea id="excelSnippet${vraagIndex}" placeholder="Omschrijf de Excel-berekening..." rows="4" style="width: 100%;"></textarea>`;
        }

        if (value === "science") {
            snippetContainer.innerHTML = `<math-field id="mathField${vraagIndex}" style="width: 100%; min-height: 3rem;"></math-field>`;
            const mathfield = document.querySelector(`#mathField${vraagIndex}`);
            if (mathfield) {
                mathfield.virtualKeyboardMode = "onfocus";
            }
        }

        if (value === "image") {
            snippetContainer.innerHTML = `
              <label for="imageSnippet${vraagIndex}">
                <span class="material-icons image-snippet__icon">photo_camera</span>
              </label>
              <input type="file" accept="image/*" id="imageSnippet${vraagIndex}" class="image-snippet__input" hidden />
              <div class="image-snippet__preview" id="imagePreview${vraagIndex}"></div>
            `;
          }  


          if (value !== "") {
            snippetContainer.style.marginBottom = "1rem";
          }
          
          
            const imageInput = document.getElementById(`imageSnippet${vraagIndex}`);
            const preview = document.getElementById(`imagePreview${vraagIndex}`);

            if (imageInput) {
                imageInput.addEventListener("change", () => {
                    const file = imageInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = e => {
                            preview.innerHTML = `
                                <img src="${e.target.result}" alt="Preview" class="image-snippet__thumb" />
                            `;
                        };
                        reader.readAsDataURL(file);
                    } else {
                        preview.innerHTML = "";
                    }
                });
            }
    });
}  

    document.getElementById(`vraagType${vraagIndex}`).addEventListener("change", () => toggleOptions(vraagIndex));
    document.getElementById(`multipleCorrect${vraagIndex}`).addEventListener("change", () => toggleCorrectAnswerButton(vraagIndex));

    console.log(`✅ Vraag ${vraagIndex} toegevoegd.`);

    setTimeout(() => {
        applyBrainBackground(".addquestion-wrapper", {
          count: 7,
          size: 70,
          opacity: 0.08,
          animate: true
        });
      }, 100);

      // ✅ Automatisch scrollen naar nieuw vraagblok
    setTimeout(() => {
        vraagDiv.scrollIntoView({
        behavior: "smooth",
        block: "start"
        });
    }, 150); // ietsje delay zodat DOM helemaal klaar is
  
};

// ✅ **Event delegation om verwijderknoppen correct te laten werken**
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("removeQuestionBtn")) {
        const vraagIndex = event.target.getAttribute("data-index");
        removeQuestion(vraagIndex);
    }
});

// ✅ **Vraag verwijderen**
const removeQuestion = (index) => {
    const vraagElement = document.getElementById(`vraag-${index}`);
    if (vraagElement) {
        vraagElement.classList.add("wobble-out");

        setTimeout(() => {
            vraagElement.remove();
            console.log(`❌ Vraag ${index} verwijderd.`);
        }, 300);
        
    } else {
        console.error(`❌ FOUT: Vraag ${index} niet gevonden!`);
    }
};


// ✅ **Opties tonen of verbergen op basis van vraagtype**
const toggleOptions = (index) => {
    const typeSelect = document.getElementById(`vraagType${index}`);
    const optionsContainer = document.getElementById(`optionsContainer${index}`);

    if (typeSelect.value === "multiple_choice") {
        optionsContainer.style.display = "block";
    } else {
        optionsContainer.style.display = "none";
    }
};

// ✅ **Toon "Voeg Correct Antwoord Toe" knop alleen als checkbox is aangevinkt**
const toggleCorrectAnswerButton = (index) => {
    const multipleCorrect = document.getElementById(`multipleCorrect${index}`).checked;
    const addCorrectAnswerBtn = document.querySelector(`.addCorrectAnswerBtn[data-index="${index}"]`);

    if (multipleCorrect) {
        addCorrectAnswerBtn.classList.remove("hidden");
    } else {
        addCorrectAnswerBtn.classList.add("hidden");
        
        // ✅ **Verwijder extra correcte antwoordvelden als checkbox wordt uitgezet**
        const correctAnswersContainer = document.getElementById(`correctAnswersContainer${index}`);
        correctAnswersContainer.innerHTML = `<input type="text" placeholder="Vul correct antwoord in" id="correctAnswer${index}" required>`;
    }
};

// ✅ **Correct antwoord toevoegen bij klikken op de knop**
const addCorrectAnswer = async (index) => {
    const correctAnswerContainer = document.getElementById(`correctAnswersContainer${index}`);
    
    // Controleer of het extra inputveld al bestaat
    const existingInputs = correctAnswerContainer.querySelectorAll("input");
    if (existingInputs.length >= 3) { // Voorkom oneindige toevoeging
        await showAlert("Je kan maximaal 3 extra correcte antwoorden toevoegen.");
        return;
    }

    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.placeholder = `Extra correct antwoord`;
    newInput.classList.add("extra-correct-answer");
    correctAnswerContainer.appendChild(newInput);
};

// ✅ **Event listeners toevoegen na het genereren van de vraag**
// ✅ Event delegation voor "Voeg correct antwoord toe" knop
document.addEventListener("click", (event) => {
    if (event.target.classList.contains("addCorrectAnswerBtn")) {
        addCorrectAnswer(event.target.dataset.index);
    }
});

// ✅ **Quiz opslaan**
const submitQuiz = async (event) => {
    event.preventDefault();

    const errorMessage = document.querySelector("#error-message");
    errorMessage.textContent = "";
    errorMessage.style.color = "var(--red-200)";

    const user = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!user || !token) {
        errorMessage.textContent = "Je bent niet ingelogd. Log opnieuw in.";
        return;
    }

    const vraagBlokken = Array.from(document.querySelectorAll(".vraag-blok"));
    if (vraagBlokken.length !== 10) {
        await showAlert("Elke quiz moet exact 10 vragen bevatten!");
        return;
    }

    const validationErrors = [];
    for (let index = 0; index < vraagBlokken.length; index++) {
        const vraagText = document.querySelector(`#vraagText${index}`)?.value.trim();
        const vraagType = document.querySelector(`#vraagType${index}`)?.value;
        const multipleCorrect = document.querySelector(`#multipleCorrect${index}`)?.checked;

        let correctAnswers = [];
        if (multipleCorrect) {
            document.querySelectorAll(`#correctAnswersContainer${index} input`).forEach(input => {
                if (input.value.trim()) correctAnswers.push(input.value.trim());
            });
        } else {
            correctAnswers = [document.querySelector(`#correctAnswer${index}`)?.value.trim()];
        }

        let options = [];
        if (vraagType === "multiple_choice") {
            options = [
                document.querySelector(`#optie1_${index}`)?.value.trim(),
                document.querySelector(`#optie2_${index}`)?.value.trim(),
                document.querySelector(`#optie3_${index}`)?.value.trim(),
                document.querySelector(`#optie4_${index}`)?.value.trim()
            ].filter(opt => opt);
        }

        if (!vraagText) validationErrors.push(`Vraag ${index + 1} mist een vraagtekst.`);
        if (!vraagType) validationErrors.push(`Vraag ${index + 1} heeft geen vraagtype geselecteerd.`);
        if (vraagType === "multiple_choice" && options.length < 4) validationErrors.push(`Vraag ${index + 1} heeft minder dan 4 antwoordopties.`);
        if (correctAnswers.length === 0) validationErrors.push(`Vraag ${index + 1} heeft geen correct antwoord.`);
    }

    if (validationErrors.length > 0) {
        errorMessage.innerHTML = validationErrors.map(e => `<p>${e}</p>`).join("");
        errorMessage.style.display = "block";
        return;
    } else {
        errorMessage.innerHTML = "";
        errorMessage.style.display = "none";
    }

    const quizData = {
        title: document.querySelector("#title").value,
        subject_id: document.querySelector("#course").value,
        difficulty: document.querySelector("#difficulty").value,
        program_ids: Array.from(document.querySelector("#program").selectedOptions)
            .map(opt => opt.value)
            .filter(val => val !== ""),
        grade_id: document.querySelector("#grade").value,
        // teacher_id: user.id
    }; 

    const vragenData = await Promise.all(
        vraagBlokken.map(async (_, index) => {
            const vraagType = document.querySelector(`#vraagType${index}`).value;
            let options = [];
            if (vraagType === "multiple_choice") {
                options = [
                    document.querySelector(`#optie1_${index}`)?.value.trim(),
                    document.querySelector(`#optie2_${index}`)?.value.trim(),
                    document.querySelector(`#optie3_${index}`)?.value.trim(),
                    document.querySelector(`#optie4_${index}`)?.value.trim()
                ].filter(opt => opt);
            }

            let correctAnswers = [];
            const multipleCorrect = document.querySelector(`#multipleCorrect${index}`)?.checked;
            if (multipleCorrect) {
                document.querySelectorAll(`#correctAnswersContainer${index} input`).forEach(input => {
                    if (input.value.trim()) correctAnswers.push(input.value.trim());
                });
            } else {
                correctAnswers = [document.querySelector(`#correctAnswer${index}`)?.value.trim()];
            }

            const snippetType = document.querySelector(`#snippetType${index}`)?.value || null;
            let snippetValue = null;
            let imageUrl = null;

            if (snippetType === "math") snippetValue = document.querySelector(`#mathField${index}`)?.getValue();
            if (snippetType === "code") snippetValue = document.querySelector(`#codeSnippet${index}`)?.value?.trim();
            if (snippetType === "excel") snippetValue = document.querySelector(`#excelSnippet${index}`)?.value?.trim();

            if (snippetType === "image") {
                const fileInput = document.querySelector(`#imageSnippet${index}`);
                const file = fileInput?.files?.[0];
                if (file) {
                    const filePath = `snippet_${Date.now()}_${file.name}`;
                    const formData = new FormData();
                    formData.append("file", file);

                    const uploadRes = await fetch(`/api/supabase/upload?path=${filePath}`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData
                    });

                    const { url } = await uploadRes.json();
                    imageUrl = url;
                }
            }

            return {
                question_text: document.querySelector(`#vraagText${index}`).value.trim(),
                type: vraagType,
                options: vraagType === "multiple_choice" ? options : null,
                correct_answers: correctAnswers,
                time_limit: parseInt(document.querySelector(`#timeLimit${index}`).value),
                snippet_type: snippetType === "image" ? "image" : snippetType,
                snippet_value: snippetType === "image" ? null : snippetValue,
                image_url: imageUrl
            };
        })
    );

    try {
        console.log("🚀 Payload:", {
            ...quizData,
            questions: vragenData
          });
          console.log("🧠 Questions:", vragenData);
          
        const quizRes = await secureFetch("/api/quizzes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ ...quizData, questions: vragenData })
        });

        if (!quizRes.error) {
            await showAlert("Quiz succesvol aangemaakt!");
            confetti({
                particleCount: 200,
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                origin: {
                  x: Math.random(),
                  y: Math.random() - 0.2
                }
              });              
            navigateTo("/dashboard_teacher");
        } else {
            errorMessage.textContent = `Fout bij opslaan quiz: ${quizRes.error}`;
        }
    } catch (error) {
        console.error("❌ Fout bij opslaan quiz:", error);
        errorMessage.textContent = "Er is een fout opgetreden. Probeer opnieuw.";
    }
};

export { loadDropdownData, addQuestion };
