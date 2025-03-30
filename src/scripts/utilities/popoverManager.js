export function enablePopovers() {
    document.addEventListener("mouseover", (e) => {
        const trigger = e.target.closest(".popover");

        if (!trigger || trigger._popoverActive) return;

        const originalContent = trigger.querySelector(".popover__content");
        if (!originalContent) return;

        // Clone & move naar body
        const floatingPopover = originalContent.cloneNode(true);
        floatingPopover.classList.add("popover__floating");

        document.body.appendChild(floatingPopover);
        trigger._popoverActive = true;
        trigger._popoverElement = floatingPopover;

        // Positioneer het nieuwe element
        const rect = trigger.getBoundingClientRect();
        floatingPopover.style.left = `${rect.left + rect.width / 2}px`;
        floatingPopover.style.top = `${rect.top + window.scrollY}px`;
        floatingPopover.style.zIndex = '2147483647';
        floatingPopover.style.position = 'absolute';
        floatingPopover.style.pointerEvents = 'none'; // blijft veilig


        // fade-in effect
        requestAnimationFrame(() => {
            floatingPopover.classList.add("visible");
        });
    });

    document.addEventListener("mouseout", (e) => {
        const trigger = e.target.closest(".popover");

        if (trigger && trigger._popoverElement) {
            trigger._popoverElement.remove();
            trigger._popoverElement = null;
            trigger._popoverActive = false;
        }
    });
}
