export async function fetchDisclaimer() {
    console.log("📌 Disclaimer ophalen...");
    try {
      const response = await fetch("/data/disclaimer.json");
      if (!response.ok) throw new Error("Kon de disclaimer data niet laden.");
      const items = await response.json();
  
      renderDisclaimer(items);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }
  
  function renderDisclaimer(items) {
    const content = document.getElementById("disclaimer");
    if (!content) return;
  
    let html = `<h1>DISCLAIMER</h1><div class="faq-container">`;
  
    items.forEach((item) => {
      html += `
        <div class="faq-item">
          <h3>${item.title}</h3>
          <p>${item.paragraph}</p>
        </div>
      `;
    });
  
    html += `</div>`;
    content.innerHTML = html;
  }
  