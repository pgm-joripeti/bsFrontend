const fetchProfile = async () => {
    const res = await fetch("/api/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).access_token}` }
    });

    const data = await res.json();
    document.querySelector("#nickname").innerText = data.profile.nickname;
    document.querySelector("#school").innerText = data.profile.school;
    document.querySelector("#richting").innerText = data.profile.richting;
    document.querySelector("#xp").innerText = data.profile.xp;
    document.querySelector("#qbit").innerText = data.profile.qbit;
    document.querySelector("#avatar").src = data.profile.avatar_url || "/default-avatar.png";

    document.querySelector("#highestScore").innerText = data.quizStats.highest_score;
    document.querySelector("#completedQuizzes").innerText = data.quizStats.completed_quizzes;
    document.querySelector("#openQuizzes").innerText = data.quizStats.open_quizzes;
    document.querySelector("#bestSubject").innerText = data.quizStats.best_subject;
    document.querySelector("#worstSubject").innerText = data.quizStats.worst_subject;

    document.querySelector("#motivationText").innerText = data.motivation.text;
    document.querySelector("#motivationMeme").src = data.motivation.meme_url;

};

fetchProfile();
