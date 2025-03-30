// utilities/mathJax.js
export function typesetMath(element = null) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        return element
            ? window.MathJax.typesetPromise([element]) // ✅ Alleen dat element
            : window.MathJax.typesetPromise();         // fallback: hele pagina
    }
}
