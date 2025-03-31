let alertModal = null;
let alertOverlay = null;

export async function showAlert(message, options = {}) {
    const {
        shareComponent = null,
        confirmButton = false,
        confirmButtonText = "OK",
        cancelButton = false,
        cancelButtonText = "Annuleer"
    } = options;

    if (!alertModal) {
        const html = await fetch("/components/alertModal.html").then(r => r.text());
        const temp = document.createElement("div");
        temp.innerHTML = html;
        alertModal = temp.querySelector("#alertModal");
        if (!alertModal) {
            console.error("❌ alertModal kon niet gevonden worden in HTML:", html);
            return;
        }

        document.body.appendChild(alertModal);
        console.log("📌 Modal toegevoegd aan body?", document.getElementById("alertModal"));

    }

    if (!alertOverlay) {
        alertOverlay = document.createElement("div");
        alertOverlay.className = "alert-overlay";
        document.body.appendChild(alertOverlay);
    }

    await new Promise(requestAnimationFrame); // wacht één frame
    const alertText = document.getElementById("alertModalText");
    if (alertText) {
        alertText.innerText = message;
    } else {
        console.error("❌ #alertModalText niet gevonden in showAlert!");
    }

    const alertIcon = document.getElementById("alertModalIcon");
    const type = options.type || "info";

    if (alertIcon) {
        alertIcon.className = "material-icons alert-icon"; // reset class

        switch (type) {
            case "success":
                alertIcon.innerText = "check_circle";
                alertIcon.style.color = "var(--color-success)";
                break;
            case "error":
                alertIcon.innerText = "error";
                alertIcon.style.color = "var(--color-error)";
                break;
            case "warning":
                alertIcon.innerText = "warning";
                alertIcon.style.color = "var(--color-warning)";
                break;
            default:
                alertIcon.innerText = "info";
                alertIcon.style.color = "var(--color-primary)";
        }
    }


    // ✅ Injecteer shareComponent als aanwezig
    const shareZone = document.getElementById("alertModalShareZone");
    if (shareZone) {
        shareZone.innerHTML = ""; // Reset
        if (shareComponent) shareZone.appendChild(shareComponent); // Append nieuwe share knoppen
    } else {
        console.warn("⚠️ Geen share zone gevonden in alertModal.");
    }

    // ✅ Dynamische knoppen (confirm/cancel/default close)
    const buttonsContainer = document.getElementById("alertModalButtons");
    buttonsContainer.innerHTML = ""; // reset bestaande knoppen

    return new Promise(resolve => {
        const closeModal = (result = false) => {
            alertModal.classList.remove("wobble-in--alert");
            alertModal.classList.add("wobble-out--alert");
            setTimeout(() => {
                alertModal.classList.remove("wobble-out--alert");
                alertModal.classList.add("hidden");
                alertOverlay.style.display = "none";
                resolve(result);
            }, 800);
        };

        // const closeX = document.getElementById("alertModalClose");
        // if (closeX) {
        //     closeX.onclick = () => closeModal();
        // }

        alertOverlay.onclick = () => closeModal(false);

        // Bevestigingsknop (optioneel)
        if (confirmButton) {
            const confirmBtn = document.createElement("button");
            confirmBtn.className = "btn btn-alert";
            confirmBtn.innerText = confirmButtonText;
            confirmBtn.onclick = () => closeModal(true);
            buttonsContainer.appendChild(confirmBtn);
        }

        // Annuleerknop (optioneel)
        if (cancelButton) {
            const cancelBtn = document.createElement("button");
            cancelBtn.className = "btn btn-secondary";
            cancelBtn.innerText = cancelButtonText;
            cancelBtn.onclick = () => closeModal(false);
            buttonsContainer.appendChild(cancelBtn);
        }

        // Standaard sluitknop indien geen confirm/cancel
        if (!confirmButton && !cancelButton) {
            const closeBtn = document.createElement("button");
            closeBtn.className = "btn btn-primary";
            closeBtn.innerText = "Sluiten";
            closeBtn.onclick = () => closeModal();
            buttonsContainer.appendChild(closeBtn);
        }

        // Toon modal met animatie
        alertModal.classList.remove("hidden", "wobble-out--alert");
        void alertModal.offsetWidth;
        alertModal.classList.add("wobble-in--alert");
        alertOverlay.style.display = "block";
    });
}
