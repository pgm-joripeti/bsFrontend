export function sanitizeSnippet(input) {
    // Check of het al een geldige LaTeX expressie is, bv. \frac, \sqrt, lim enz.
    const isLatexExpression = /\\[a-zA-Z]+/.test(input);
  
    if (isLatexExpression) {
      return input; // al LaTeX, niets doen
    }
  
    // Wrap gewone strings in \text{...}
    return `\\text{${input}}`;
  }
  
