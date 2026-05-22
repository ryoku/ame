#!/usr/bin/env node
/**
 * Converts a Markdown file (with LaTeX math) to PDF using KaTeX + Puppeteer.
 * Usage: node md-to-pdf.mjs <input.md> [output.pdf]
 */

import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { resolve } from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const inputPath = resolve(process.argv[2] ?? (() => { console.error('Usage: node md-to-pdf.mjs <input.md> [output.pdf]'); process.exit(1); })());
const outputPath = resolve(process.argv[3] ?? inputPath.replace(/\.md$/, '.pdf'));
const htmlPath = outputPath.replace(/\.pdf$/, '._tmp_.html');

const md = readFileSync(inputPath, 'utf8');
const body = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body, {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$',  right: '$',  display: false}
    ],
    throwOnError: false
  });"></script>
<style>
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13pt;
    line-height: 1.7;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 40px;
    color: #222;
  }
  h1 { font-size: 1.8em; color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 8px; }
  h2 { font-size: 1.3em; color: #283593; margin-top: 1.8em; }
  hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
  .katex-display { margin: 1.2em 0; overflow-x: auto; }
  p { margin: 0.8em 0; }
  ul, ol { margin: 0.5em 0 0.5em 1.5em; }
</style>
</head>
<body>
${body}
</body>
</html>`;

writeFileSync(htmlPath, html);

try {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '2cm', bottom: '2cm', left: '2.5cm', right: '2.5cm' },
    printBackground: true,
  });
  await browser.close();
  console.log('✓', outputPath);
} finally {
  if (existsSync(htmlPath)) unlinkSync(htmlPath);
}
