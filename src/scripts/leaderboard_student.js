
import { applyBrainBackground } from "./utilities/brainBackground.js";
import { createShareComponent } from "./utilities/shareButtons.js";
import { secureFetch } from "./utilities/apiClient.js";
import { navigateTo } from "./router.js";

export const initLeaderboardStudent = async () => {
    console.log("✅ Leaderboard Student geladen.");

    const leaderboardContainer = document.querySelector("#leaderboard-container");
    if (!leaderboardContainer) {
        console.error("❌ FOUT: #leaderboard-container niet gevonden in de DOM!");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Geen token gevonden. Redirect naar login.");
        navigateTo("/");
        return;
    }

    try {
        // ✅ Haal de volledige leaderboard op (inclusief current_ranking per user)
        const leaderboardData = await secureFetch("/api/leaderboard/student", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!leaderboardData || leaderboardData.players.length === 0) {
            leaderboardContainer.innerHTML = "<p>Geen leaderboard data beschikbaar.</p>";
            return;
        }

        const userId = leaderboardData.players.find(p => p.id === getUserIdFromToken(token))?.id;
        const currentPlayer = leaderboardData.players.find(p => p.id === userId);

        renderLeaderboard(leaderboardData.players, {
            user_id: userId,
            ranking: currentPlayer?.current_ranking || "N/A",
            league: leaderboardData.league,
            league_logo: leaderboardData.league_logo
        });

    } catch (error) {
        console.error("❌ Fout bij ophalen leaderboard:", error.message);
        leaderboardContainer.innerHTML = `<p class="error">Fout bij ophalen leaderboard. Probeer later opnieuw.</p>`;
    }
};

const renderLeaderboard = (players, rankingData) => {
    const leaderboardContainer = document.querySelector("#leaderboard-container");
    leaderboardContainer.innerHTML = "";
    const userId = rankingData.user_id;

    players.forEach((player, index) => {
        setTimeout(() => {
            const isCurrentUser = player.id === userId;

            const entry = document.createElement("div");
            entry.classList.add("leaderboard-entry", "hidden-entry");
            if (isCurrentUser) entry.classList.add("highlighted-user");

            // ✨ Shine wrapper
            if (isCurrentUser) {
                const shineContainer = document.createElement("div");
                shineContainer.classList.add("shine-container");

                const shineWrapper = document.createElement("div");
                shineWrapper.classList.add("shine-wrapper");

                const shine = document.createElement("div");
                shine.classList.add("glossy-shine");

                shineWrapper.appendChild(shine);
                shineContainer.appendChild(shineWrapper);
                entry.appendChild(shineContainer);
    }

// 📦 Content wrapper
const contentWrapper = document.createElement("div");
contentWrapper.classList.add("leaderboard-content");

contentWrapper.innerHTML = `
  <div class="leaderboard-left">
      <span class="leaderboard-position">#${player.current_ranking}</span>
      <img class="leaderboard-avatar" src="${player.avatar_url || '/icons/person.svg'}" alt="${player.nickname}">
      <span class="leaderboard-nickname">${truncateNickname(player.nickname, 15)}</span>
  </div>
  <div class="leaderboard-right">
      <span class="leaderboard-xp">${player.xp_points} XP</span>
      <span class="leaderboard-qbits">${player.qbits} Qbits</span>
      <div class="popover-container league">
        <div class="popover">
            <span class="material-icons popover__icon league">info</span>
            <span class="popover__content league">
                ${player.school_name || "Onbekende school"}<br>
                ${player.program_name || "Onbekende richting"}<br>
                ${player.grade_name || "Onbekende graad"}<br>
            </span>
        </div>
      </div>
  </div>
`;

entry.appendChild(contentWrapper);
leaderboardContainer.appendChild(entry);

            setTimeout(() => {
                entry.classList.remove("hidden-entry");
                entry.classList.add("wobble-in");
            }, 0);
        }, index * 50);

        applyBrainBackground("#leaderboard-container", {
            count: 1,
            size: 70,
            opacity: 0.06,
            animate: true
        });
    });

    // ✅ Toon league logo en naam
    const leagueLogoElement = document.getElementById("league-logo");
    const leagueNameElement = document.getElementById("league-name");

    if (leagueLogoElement) {
        console.log("🏆 Debug: League logo URL received:", rankingData.league_logo);
        leagueLogoElement.classList.add("wobble-in");
        leagueLogoElement.src = rankingData.league_logo;
        leagueLogoElement.alt = `Logo van ${rankingData.league}`;
    }

    if (leagueNameElement) {
        leagueNameElement.innerText = rankingData.league;
    }

    // ✅ SOME sharing: toon huidige ranking bovenaan
    document.getElementById("user-ranking").innerText = `#${rankingData.ranking}`;

    // ✅ Voeg share component toe
    const text = `Ik sta op plaats #${rankingData.ranking} in de ${rankingData.league} League op Brainsmash! 🧠🔥`;
    const url = "https://brainsmash.be";

    const share = createShareComponent({
        text,
        url,
        targetSelector: "#league-info"
    });

    document.querySelector("#league-info").appendChild(share);

};

// ✅ Truncatie behouden
function truncateNickname(nickname, maxChars) {
    return nickname.length > maxChars ? nickname.substring(0, maxChars) + "..." : nickname;
}


const getUserIdFromToken = (token) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload?.sub;
    } catch {
        return null;
    }
};
