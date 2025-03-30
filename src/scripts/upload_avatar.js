export const uploadAvatar = async () => {
    const fileInput = document.querySelector("#avatarUpload");
    const file = fileInput.files[0];

    if (!file) {
        return alert("Selecteer een afbeelding");
    }

    // ✅ FormData object aanmaken met correcte 'name'
    const formData = new FormData();
    formData.append("avatar", file); // 🔹 Belangrijk: de naam moet "avatar" zijn! Dit moet overeen komen met de naam in Multer middleware

    const res = await fetch("/api/avatar/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("user")).access_token}` },
        body: formData
    });

    if (res.ok) {
        const data = await res.json();
        document.querySelector("#avatar").src = data.avatar_url;
    } else {
        alert("Upload mislukt!");
    }
};

