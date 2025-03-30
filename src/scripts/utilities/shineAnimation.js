export const setupShineAnimation = () => {
    const activationLink = document.querySelector(".activationLink");

    if (!activationLink) return;

    const triggerAnimation = () => {
        activationLink.classList.add("animate-shine");

        setTimeout(() => {
            activationLink.classList.remove("animate-shine");
        }, 600); // animatieduur
    };

    triggerAnimation(); // Start meteen
    setInterval(triggerAnimation, 3000); // herhalen
};
