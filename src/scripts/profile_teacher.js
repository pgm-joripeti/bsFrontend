import { secureFetch } from "./utilities/apiClient.js";
import { applyBrainBackground } from "./utilities/brainBackground.js";

export const fetchProfileTeacher = async () => {
    console.log("✅ Profiel Teacher geladen.");

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
        console.error("❌ Geen access token gevonden.");
        return;
    }

    try {
        const res = await secureFetch("/api/teacher/profile", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const data =  res; //onze secureFetch returned res al als json (dus niet nog ns data = res.json())

        // ✅ Controleer of data bestaat
        if (!data || !data.profile) {
            throw new Error("❌ Profielgegevens ontbreken in de API-respons.");
            return
        }

        // 🔹 Profielgegevens invullen
        document.querySelector("#nickname").innerText = data.profile.nickname || "Nog geen nickname";
        document.querySelector("#email").innerText = data.profile.email || "";
        document.querySelector("#school").innerText = data.profile.school?.school_name || "";
        document.querySelector("#program").innerText = data.profile.program?.program_name || "";

        // ✅ Quiz-statistieken correct verwerken
        if (Array.isArray(data.quizStats) && data.quizStats.length > 0) {
            // console.log("📊 Teacher quiz statistieken opgehaald:", data.quizStats);

            const totalQuizzes = data.quizStats.length;
            const totalAttempts = data.quizStats.reduce((sum, quiz) => sum + quiz.total_attempts, 0);
            const avgScore =
                data.quizStats.reduce((sum, quiz) => sum + quiz.avg_score, 0) / (totalQuizzes || 1); // Voorkom deling door 0

            // Bepaal de best presterende quiz (hoogste gemiddelde score)
            const bestQuiz = data.quizStats.reduce((best, quiz) => (quiz.avg_score > (best.avg_score || 0) ? quiz : best), { title: "Nog geen gegevens beschikbaar" });

            document.querySelector("#totalQuizzes").innerText = totalQuizzes;
            document.querySelector("#totalAttempts").innerText = totalAttempts;
            document.querySelector("#avgScore").innerText = avgScore.toFixed(2);
            document.querySelector("#bestQuiz").innerText = bestQuiz.title;
        } else {
            console.warn("⚠️ Geen quizstatistieken beschikbaar voor deze leerkracht.");
            document.querySelector("#totalQuizzes").innerText = 0;
            document.querySelector("#totalAttempts").innerText = 0;
            document.querySelector("#avgScore").innerText = "0";
            document.querySelector("#bestQuiz").innerText = "Nog geen gegevens beschikbaar";
        }
        
        // 🔹 Avatar tonen of Material Icon als fallback
        const avatarElement = document.querySelector("#avatar");
        const iconElement = document.querySelector("#avatarIcon");

        if (typeof data.profile.avatar_url === "string" && data.profile.avatar_url.startsWith("http")) {
            const uniqueUrl = `${data.profile.avatar_url}?t=${new Date().getTime()}`;
            console.log("✅ Profiel heeft avatar:", uniqueUrl);
            avatarElement.src = uniqueUrl;
            avatarElement.style.display = "block";
            if (iconElement) iconElement.style.display = "none"; // Verberg het icon
        } else {
            avatarElement.style.display = "none";
            if (iconElement) iconElement.style.display = "block"; // Toon het icon als er geen avatar is
        }

        // **Automatisch uploaden zodra een bestand wordt gekozen**
        const avatarUpload = document.querySelector("#avatarUpload");
        if (avatarUpload) {
            avatarUpload.addEventListener("change", uploadAvatar);
            console.log("✅ Event listener toegevoegd aan avatar upload.");
        } else {
            console.error("❌ FOUT: #avatarUpload niet gevonden in de DOM!");
        }

    } catch (error) {
        console.error("❌ Fout bij ophalen profiel:", error);
    }


    applyBrainBackground(".profile__container", {
        count: 8,
        size: 70,
        opacity: 0.06,
        animate: true
      });      

      setTimeout(() => {
        applyBrainBackground(".stats__card", {
          count: 3,
          size: 40,
          opacity: 0.07,
          animate: true
        });
      }, 100);
};

const uploadAvatar = async () => {
    const fileInput = document.querySelector("#avatarUpload");
    const file = fileInput?.files[0];

    if (!file) return;

    const accessToken = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const res = await fetch("/api/teacher/profile/upload-avatar", {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body: formData
        });

        const data = await res.json();

        if (res.ok && data.avatar_url) {
            document.querySelector("#avatar").src = data.avatar_url;
            document.querySelector("#avatar").style.display = "block";
            document.querySelector("#avatarIcon").style.display = "none"; // 🔥 Verberg het icon
        } else {
            console.error("❌ Fout bij uploaden avatar", data);
        }
    } catch (error) {
        console.error("❌ Fout bij uploaden avatar:", error);
    }
};
