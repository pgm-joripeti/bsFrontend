import { secureFetch } from "./utilities/apiClient";

const API_BASE = import.meta.env.VITE_API_BASE;

export const initLeaderboardTeacher = async () => {
    console.log("✅ Leaderboard Teacher geladen.");

    const leaderboardContainer = document.querySelector("#leaderboard");
    const userRankingElem = document.querySelector("#userRanking");

    if (!leaderboardContainer || !userRankingElem) {
        console.error("❌ FOUT: Leaderboard container of ranking element niet gevonden!");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        console.error("❌ Geen token gevonden. Redirect naar login.");
        navigateTo("/"); // ✅ Gebruik SPA navigatie
        return;
    }

    try {
        // ✅ Haal het volledige leaderboard op
        const leaderboardData = await secureFetch("/api/leaderboard", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            }
        });

        if (!leaderboardData || leaderboardData.length === 0) {
            leaderboardContainer.innerHTML = "<p>Geen leaderboard data beschikbaar.</p>";
            return;
        }

        renderLeaderboard(leaderboardData);

        // ✅ Haal de persoonlijke ranking van de leerkracht op
        const rankingRes = await fetch(`${API_BASE}/api/leaderboard/ranking`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        const rankingData = await rankingRes.json();
        if (!rankingRes.ok) throw new Error(rankingData.error || "Kon ranking niet ophalen");

        userRankingElem.innerText = `🏅 Jouw positie: #${rankingData.ranking}`;

    } catch (error) {
        console.error("❌ Fout bij ophalen leaderboard:", error.message);
        leaderboardContainer.innerHTML = `<p class="error">Fout bij ophalen leaderboard. Probeer later opnieuw.</p>`;
    }
};

const renderLeaderboard = (leaderboardData) => {
    const leaderboardContainer = document.querySelector("#leaderboard");
    leaderboardContainer.innerHTML = `
        <h2>🏆 Leaderboard - Leerkrachten</h2>
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Positie</th>
                    <th>Nickname</th>
                    <th>Score</th>
                    <th>Badge</th>
                    <th>School</th>
                </tr>
            </thead>
            <tbody>
                ${leaderboardData.map((teacher, index) => `
                    <tr>
                        <td>#${index + 1}</td>
                        <td>${teacher.nickname}</td>
                        <td>${teacher.score}</td>
                        <td>${teacher.badge || "-"}</td>
                        <td>${teacher.school}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
};
