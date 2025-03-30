import { navigateTo } from "../router.js";

export async function assignLeagueToUser(userId) {
    console.log("🔍 Controleren of gebruiker een league heeft...");

    const token = localStorage.getItem("token");
    if (!userId) {
        console.error("❌ Geen geldige gebruiker ID ontvangen!");
        navigateTo("/");
        return;
    }

    if (!token) {
        console.error("❌ Geen geldige token gevonden! Redirect naar login.");
        navigateTo("/");
        return;
    }

    try {
        // ✅ Stap 1: Haal gebruikersinfo op
        const res = await fetch(`/api/leagues/${userId}/league`, {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            }
        });

        if (!res.ok) throw new Error("Kon league-informatie niet ophalen");

        const { role, league, assigned_at } = await res.json();

        console.log("🏆 Debug: API response:", { role, league, assigned_at });

        // ✅ Stap 2: Controleer of de gebruiker een **student** is
        if (role !== "leerling") {
            console.log("⏩ Gebruiker is geen leerling, geen league nodig.");
            return;
        }

        // ✅ Stap 3: Check of de student al een league heeft
        if (league !== null && assigned_at) {
            const daysSinceAssigned = (Date.now() - new Date(assigned_at).getTime()) / (1000 * 60 * 60 * 24);
            console.log(`📅 Gebruiker zit al ${daysSinceAssigned.toFixed(1)} dagen in deze league.`);
            
            if (daysSinceAssigned < 7) {
                console.log("✅ Gebruiker blijft in dezelfde league.");
                return;
            }

            console.log("🔄 Gebruiker zit langer dan 7 dagen in deze league. Nieuwe league nodig.");
        } else {
            console.log("⚠️ Gebruiker heeft nog geen league! Nieuwe league wordt toegewezen...");
        }

        // ✅ Stap 4: Wijs een nieuwe league toe als nodig
        const assignRes = await fetch(`/api/leagues/${userId}/assign-league`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!assignRes.ok) throw new Error("Kon nieuwe league niet toewijzen");

        const { league: newLeague } = await assignRes.json();
        console.log("✅ Nieuwe league toegewezen:", newLeague);

    } catch (error) {
        console.error("❌ Fout bij league-toewijzing:", error.message);
    }
}
