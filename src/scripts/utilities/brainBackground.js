
import { gsap } from "gsap";

export function applyBrainBackground(targetSelector, options = {}) {
  const targets = document.querySelectorAll(targetSelector);
  const {
    imageUrl = "/assets/visuals/brainsplash.png", // ✅ met leading slash!
    count = 6,
    size = 80,
    opacity = 0.1,
    animate = true
  } = options;

  targets.forEach((target) => {
    target.style.position = "relative";
    // target.style.overflow = "hidden";

    const backgroundLayer = document.createElement("div");
    backgroundLayer.classList.add("brain-bg-layer");
    Object.assign(backgroundLayer.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: "0",
      overflow: "hidden"
    });

    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.src = imageUrl;
      const rotation = Math.floor(Math.random() * 360);
      img.dataset.baseRotation = rotation;
      img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      img.alt = "Brainsmash background logo";
      Object.assign(img.style, {
        position: "absolute",
        width: `${size}px`,
        opacity,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`
      });

      backgroundLayer.appendChild(img);

      if (animate) {
        gsap.to(img, {
            y: "+=15",
            rotation: `+=${Math.random() > 0.5 ? 8 : -8}`,
            duration: 3 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: Math.random()
          });                  
      }
    }

    target.prepend(backgroundLayer);

    Array.from(target.children).forEach((child) => {
      if (child !== backgroundLayer) {
        child.style.position ||= "relative";
        child.style.zIndex ||= 1;
      }
    });
  });

  // parallax effect op brains background
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
  
    document.querySelectorAll(".brain-bg-layer img").forEach((img, i) => {
      const speed = 0.05 + (i % 5) * 0.02; // verschillend per image
      img.style.transform = `
        translate(-50%, -50%)
        translateY(${scrollY * speed}px)
        rotate(${img.dataset.baseRotation}deg)
      `;
    });
  });  
}
