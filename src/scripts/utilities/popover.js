import { popoverDataForTeacher, popoverDataForStudent } from "./popoverData.js";


export function createPopoverForTeacher(icon, key, dataValue = null) {
    // haal de tekst en mogelijke externe data op
    const popoverMessage = popoverDataForTeacher[key]?.replace("{value}", dataValue ?? "geen info gevonden");

    return `
    <span class="popover">
        <span class="material-icons">${icon}</span>
        <span class="popover__content">${popoverMessage}</span>
    </span>
    `;
};

export function createPopoverForStudent(icon, key, dataValue = null) {
    // haal de tekst en mogelijke externe data op
    const popoverMessage = popoverDataForStudent[key]?.replace("{value}", dataValue ?? "geen info gevonden");

    return `
    <span class="popover">
        <span class="material-icons">${icon}</span>
        <span class="popover__content">${popoverMessage}</span>
    </span>
    `;
};