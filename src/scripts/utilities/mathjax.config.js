import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { CHTML } from 'mathjax-full/js/output/chtml.js';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

browserAdaptor();
RegisterHTMLHandler(browserAdaptor());

const tex = new TeX({
  packages: ['base', 'ams', 'textmacros'] // ✅ ondersteunt ook \text{} en \mathbb{}
});

const chtml = new CHTML({
  fontURL: '/es5/output/chtml/fonts/woff-v2/',
  scale: 1,
  matchFontHeight: false
});

const html = mathjax.document('', {
  InputJax: tex,
  OutputJax: chtml
});

export function typesetMath(mathString) {
  const node = html.convert(mathString, {
    display: true
  });
  return node.outerHTML;
}
