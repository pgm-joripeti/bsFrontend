import { navigateTo } from "../router";

export async function secureFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    // voeg standaard headers toe als ze niet bestaan
    options.headers = {
        ...options.headers,
        "Authorization": `Bearer ${token}`,
        "Content-Type": options.headers?.["Content-Type"] || "application/json"
    };

    const res = await fetch(url, options);

    if (res.status === 401) {
        navigateTo("/");
        return null;
    }

    return await res.json();
}
