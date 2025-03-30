export function normalizeAnswer(input) {
    if (!input || typeof input !== "string") return "";

    return input
        .toLowerCase() // alles in kleine letters
        .normalize("NFD") // split accenttekens (é → e + ́) - // accenttekens opsplitsen
        .replace(/[\u0300-\u036f]/g, "") // accenttekens verwijderen (é → e)
        .replace(/[^\w]|_/g, "") // verwijder ALLE niet-letters/nummers (interpunctie, spaties, symbolen)
        .trim(); // overbodig na vorige stap maar ok als safety
}
