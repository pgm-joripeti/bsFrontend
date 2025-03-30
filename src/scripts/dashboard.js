const fetchQuizzes = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    const res = await fetch("/api/quizzes", {
        method: "GET",
        headers: { Authorization: `Bearer ${user.access_token}` }
    });

    const quizzes = await res.json();
    const quizContainer = document.querySelector("#quizContainer");

    quizzes.forEach(quiz => {
        const quizCard = document.createElement("div");
        quizCard.classList.add("quiz-card");
        quizCard.innerHTML = `
            <h3>${quiz.titel}</h3>
            <p>${quiz.moeilijkheidsgraad}</p>
            <p>Leerkracht: ${quiz.leerkracht}</p>
            <button onclick="startQuiz('${quiz.id}')">Start</button>
        `;
        quizContainer.appendChild(quizCard);
    });
};

const startQuiz = (quizId) => {
    window.location.href = `quiz.html?id=${quizId}`;
};

fetchQuizzes();
