export async function fetchFAQStudent() {
    console.log("📌 Ophalen van student FAQ...");
    try {
        const response = await fetch("/data/student_FAQ.json");
        if (!response.ok) throw new Error("Kon de FAQ data niet laden.");

        const faqs = await response.json();
        renderFAQ(faqs, "FAQ Student");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

export async function fetchFAQTeacher() {
    console.log("📌 Ophalen van teacher FAQ...");
    try {
        const response = await fetch("/data/teacher_FAQ.json");
        if (!response.ok) throw new Error("Kon de FAQ data niet laden.");

        const faqs = await response.json();
        renderFAQ(faqs, "FAQ Teacher");
    } catch (error) {
        console.error("❌ Error:", error);
    }
}

// ✅ Algemene functie om de FAQ weer te geven
function renderFAQ(faqs, title) {
    const content = document.getElementById("faq");
    if (!content) return;

    let html = `<h1>${title}</h1><div class="faq-container">`;

    faqs.forEach((faq) => {
        html += `
            <div class="faq-item">
                <h3>${faq.question}</h3>
                <p>${faq.answer}</p>
            </div>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;
}
