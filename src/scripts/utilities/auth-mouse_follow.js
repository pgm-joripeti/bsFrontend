export function enableMouseFollowEffect() {
    // console.log("✅ enableMouseFollowEffect() is aangeroepen!");

    const authContainer = document.querySelector(".auth__container");

    if (!authContainer) {
        console.error("⚠ .auth__container niet gevonden!");
        return;
    }

    authContainer.addEventListener("mousemove", (e) => {
        // console.log("🖱 Mousemove event gedetecteerd!");

        const { offsetX, offsetY, target } = e;
        const width = target.clientWidth;
        const height = target.clientHeight;

        // Versnel de beweging door een offset te gebruiken
        const xPos = ((offsetX / width) * 100) * 1.5 - 25; 
        const yPos = ((offsetY / height) * 100) * 1.5 - 25;

        target.style.setProperty("--reflection-x", `${xPos}%`);
        target.style.setProperty("--reflection-y", `${yPos}%`);

        // console.log(`✨ Reflectie aangepast: x=${xPos}%, y=${yPos}%`);
    });
}
