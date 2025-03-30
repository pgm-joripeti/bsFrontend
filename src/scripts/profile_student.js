import { secureFetch } from "./utilities/apiClient.js";
import { applyBrainBackground } from "./utilities/brainBackground.js";

const API_BASE = import.meta.env.VITE_API_BASE;

export const fetchProfileStudent = async () => {
    console.log("✅ Profiel Student geladen.");

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
        console.error("❌ Geen access token gevonden.");
        return;
    }

    // 🔹 Avatar tonen of het Material Icon tonen
    const avatarElement = document.querySelector("#avatar");
    const iconElement = document.querySelector("#avatarIcon");

    try {
        const res = await secureFetch("/api/student/profile", {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        const data = res;

        // console.log("📊 API Response voor student:", data); // 🔍 Log de volledige API-response

        if (!data) return;

        // ✅ Controleer of data correct is
        if (!data || !data.profile) {
            throw new Error("❌ Profielgegevens ontbreken in de API-respons.");
        }

        // 🔹 Profielgegevens invullen
        document.querySelector("#nickname").innerText = data.profile.nickname || "Nog geen nickname";
        document.querySelector("#email").innerText = data.profile.email || "";
        document.querySelector("#school").innerText = data.profile.school?.school_name || "";
        document.querySelector("#richting").innerText = data.profile.program?.program_name || "";
        document.querySelector("#grade").innerText = data.profile.grade?.grade_name || "";

        // Fetch badges
        getBadges();

        // ✅ League direct tonen vanuit `profile`
        const leagueName = data.profile.leagues?.name || "Onbekende League";
        document.querySelector("#leaguePopoverContent").innerText = `Je zit in de ${leagueName} league!`;

        // ✅ Controleer de structuur van quizStats
        if (data.quizStats && typeof data.quizStats === "object") {
            const stats = data.quizStats;
        
            console.log("📊 Student quiz statistieken opgehaald:", stats);
        
            document.querySelector("#completedQuizzes").innerText = stats.completed_quizzes || 0;
            document.querySelector("#totalAttempts").innerText = stats.total_attempts || 0;
            document.querySelector("#avgScore").innerText = stats.avg_score?.toFixed(2) || "0";
            document.querySelector("#bestScore").innerText = stats.best_score || 0;
            document.querySelector("#currentRanking").innerText = stats.current_ranking || "N/A";
            document.querySelector("#xpPoints").innerText = stats.xp_points || 0;
            document.querySelector("#qbits").innerText = stats.qbits || 0;
        } else {
            console.warn("⚠️ Geen quizstatistieken beschikbaar voor deze student.");
            document.querySelector("#completedQuizzes").innerText = 0;
            document.querySelector("#totalAttempts").innerText = 0;
            document.querySelector("#avgScore").innerText = "0";
            document.querySelector("#bestScore").innerText = 0;
            document.querySelector("#currentRanking").innerText = "N/A";
            document.querySelector("#xpPoints").innerText = 0;
            document.querySelector("#qbits").innerText = 0;
        }
        

        if (typeof data.profile.avatar_url === "string" && data.profile.avatar_url.startsWith("http")) {
            const uniqueUrl = `${data.profile.avatar_url}?t=${new Date().getTime()}`;
            console.log("✅ Profiel heeft avatar:", uniqueUrl);
            avatarElement.src = uniqueUrl;
            avatarElement.style.display = "block";
            if (iconElement) iconElement.style.display = "none"; // Verberg het icon
        } else {
            // 🔧 Toon standaard afbeelding als er geen avatar is
            avatarElement.src = "/icons/person.svg"; // standaard SVG van person icon
            avatarElement.style.display = "block";
            if (iconElement) iconElement.style.display = "none"; // verberg het Material Icon
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
};

const uploadAvatar = async () => {
    const fileInput = document.querySelector("#avatarUpload");
    const file = fileInput?.files[0];

    if (!file) return;

    const accessToken = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("avatar", file);

    try {
        const res = await fetch(`${API_BASE}/api/student/profile/upload-avatar`, {
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

export const getBadges = async (userId) => {
    console.log("🎖️ Fetching badges for student...");

    const accessToken = localStorage.getItem("token");
    if (!accessToken) {
        console.error("❌ No access token found.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/student/profile`, {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!res.ok) throw new Error("❌ Error fetching badges.");

        const data = await res.json();
        if (!data || !data.badges) {
            console.warn("⚠️ No badges found for this student.");
            return;
        }

        console.log("📛 Retrieved badges:", data.badges);
        displayBadges(data.badges);
    } catch (error) {
        console.error("❌ Error fetching badges:", error);
    }
};

const displayBadges = (badges) => {
    const badgeContainer = document.querySelector("#badgeContainer");

    if (!badgeContainer) {
        console.error("❌ Badge container not found in the DOM!");
        return;
    }

    // Clear existing badges
    badgeContainer.innerHTML = "";

    if (badges.length === 0) {
        badgeContainer.innerHTML = `<p class="no-badges">Nog geen badges verdiend</p>`;
        return;
    }

    badges.forEach(badge => {
        const badgeElement = document.createElement("div");
        badgeElement.innerHTML = `
            <div class="badge wobble-in">
                <img src="${badge.icon_url}" alt="${badge.id}" class="badge__image">
                <div class="popover-container">
                    <div class="popover">
                        <span class="material-icons popover__icon badge-info-icon">info</span>
                        <span id="badgePopoverContent" class="popover__content badge-info-content">
                            ${badge.description}
                        </span>
                    </div>
                </div>
            </div>
        `;
        badgeContainer.appendChild(badgeElement);
    });

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
