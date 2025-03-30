import fs from 'fs-extra';
import path from 'path';

const sourceDir = 'node_modules/mathlive/dist/fonts';
const destDir = 'public/mathlive/fonts';

// Mapping van KaTeX → MathFont namen
const mappings = {
  'KaTeX_Main-Regular.woff2': 'MathFont_Main-Regular.woff2',
  'KaTeX_Main-Bold.woff2': 'MathFont_Main-Bold.woff2',
  'KaTeX_Main-Italic.woff2': 'MathFont_Main-Italic.woff2',
  'KaTeX_Math-Italic.woff2': 'MathFont_Math-Italic.woff2',
  'KaTeX_Size1-Regular.woff2': 'MathFont_Size1-Regular.woff2',
  'KaTeX_Size2-Regular.woff2': 'MathFont_Size2-Regular.woff2',
  'KaTeX_Size3-Regular.woff2': 'MathFont_Size3-Regular.woff2',
  'KaTeX_Size4-Regular.woff2': 'MathFont_Size4-Regular.woff2',
  'KaTeX_Typewriter-Regular.woff2': 'MathFont_Typewriter-Regular.woff2',
};

async function copyFonts() {
  await fs.ensureDir(destDir);
  for (const [src, dest] of Object.entries(mappings)) {
    const srcPath = path.join(sourceDir, src);
    const destPath = path.join(destDir, dest);
    try {
      await fs.copyFile(srcPath, destPath);
      console.log(`✅ Gekopieerd: ${src} → ${dest}`);
    } catch (err) {
      console.error(`❌ Fout bij kopiëren ${src}:`, err.message);
    }
  }
}

copyFonts();
