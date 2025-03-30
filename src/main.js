// frontend/src/main.js
import './styles/style.css';
import './styles/ai.css';
import './styles/animation.css';
import './styles/badges.css';
import './styles/buttons.css';
import './styles/checkboxes.css';
import './styles/feedbacktext.css';
import './styles/labels.css';
import './styles/leaderboard.css';
import './styles/overlays.css';
import './styles/popover.css';
import './styles/profile.css';
import './styles/quiz-detail.css';
import './styles/quizcard.css';
import './styles/quizform.css';
import './styles/results.css';
import './styles/stats.css';
import './styles/404.css';
import './styles/modals.css';
import './styles/footer.css';
import './styles/faq.css';
import './styles/create-quiz.css';
import './styles/socials.css';
import './styles/scroll-focus.css';
import './styles/meme-wheel.css';
import './styles/snippet.css';

import './scripts/utilities/material_icons.js';

import { mathjax } from 'mathjax-full/es5/tex-chtml.js'; // ✅ gebruik de gebundelde es5 variant
import { navigateTo, initRouter } from './scripts/router.js';

document.addEventListener("DOMContentLoaded", () => {
  initRouter(); // zet SPA-routing weer op
});

