/** Render hosted documents from Ferrule's app-owned policy data.
 * The generated HTML is the deployed artifact; edit the source JSON in the
 * game repository and pass its path here instead of maintaining another copy. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [sourcePath] = process.argv.slice(2);
assert(sourcePath, 'Pass the game repository src/app/config/legalContent.json path.');
const source = fs.readFileSync(sourcePath, 'utf8');
const content = JSON.parse(source);
const outputDirectory = fileURLToPath(new URL('..', import.meta.url));
const sourceHash = createHash('sha256').update(source).digest('hex');

function validateDocument(document) {
  assert.equal(typeof document.title, 'string');
  assert.equal(typeof document.introduction, 'string');
  assert(Array.isArray(document.sections) && document.sections.length > 0);
  const ids = new Set();
  for (const section of document.sections) {
    assert.match(section.id, /^[a-z0-9-]+$/);
    assert(!ids.has(section.id), 'Section identifiers must be unique.');
    ids.add(section.id);
    assert.equal(typeof section.title, 'string');
    assert(Array.isArray(section.paragraphs) && section.paragraphs.length > 0);
    assert(section.paragraphs.every(p => typeof p === 'string' && p.length > 0));
  }
}

for (const field of ['appName', 'updatedAt', 'updatedLabel', 'supportEmail']) {
  assert.equal(typeof content[field], 'string');
  assert(content[field].length > 0);
}
assert.equal(content.privacyUrl, 'https://achandlr.github.io/globalconquest-link/legal/privacy.html');
assert.equal(content.supportUrl, 'https://achandlr.github.io/globalconquest-link/support.html');
assert.match(content.supportEmail, /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
validateDocument(content.privacy);
validateDocument(content.support);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;',
    '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function paragraph(value) {
  const email = escapeHtml(content.supportEmail);
  const linked = escapeHtml(value).replaceAll(email,
    `<a href="mailto:${email}">${email}</a>`);
  return `    <p>${linked}</p>`;
}

function sections(document) {
  return document.sections.map(section => `  <section aria-labelledby="${section.id}">
    <h2 id="${section.id}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map(paragraph).join('\n')}
  </section>`).join('\n');
}

const styles = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f7f5ef; color: #173041;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; }
  .page { width: min(100%, 760px); margin: 0 auto; padding: 32px 24px 48px; }
  nav, footer { display: flex; flex-wrap: wrap; gap: 10px 24px; font-size: 15px; }
  nav { padding-bottom: 22px; border-bottom: 1px solid #c9c1ae; }
  a { color: #245c7a; text-underline-offset: 3px; overflow-wrap: anywhere; }
  a:hover { color: #15384c; }
  a:focus-visible { outline: 3px solid #96702e; outline-offset: 4px; border-radius: 2px; }
  h1, h2 { font-family: Georgia, "Times New Roman", serif; line-height: 1.25; }
  h1 { margin: 30px 0 8px; font-size: clamp(29px, 6vw, 36px); }
  h2 { margin: 0 0 12px; font-size: 22px; }
  .updated { margin: 0 0 24px; color: #526675; font-size: 14px; }
  p { margin: 0 0 16px; }
  .intro { font-size: 18px; margin-bottom: 28px; }
  .contact { display: inline-block; padding: 10px 16px; margin-bottom: 28px;
    border: 1px solid #96702e; border-radius: 8px; background: #fffdf7; font-weight: 600; }
  section { padding-top: 24px; margin-top: 24px; border-top: 1px solid #d6d0c2; }
  footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #c9c1ae; }
  @media (max-width: 380px) { .page { padding-inline: 18px; } }
`;

function renderDocument(document, isPrivacy) {
  const root = isPrivacy ? '../' : '';
  const privacyPath = isPrivacy ? 'privacy.html' : 'legal/privacy.html';
  const termsPath = isPrivacy ? 'terms.html' : 'legal/terms.html';
  const contact = isPrivacy ? '' : `  <a class="contact" href="mailto:${escapeHtml(content.supportEmail)}">Email Ferrule support</a>\n`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(content.appName)}: ${escapeHtml(document.title)}</title>
<!-- Generated from GlobalConquest/src/app/config/legalContent.json; SHA-256 ${sourceHash}. -->
<style>${styles}</style>
</head>
<body>
<div class="page">
  <nav aria-label="Ferrule website"><a href="${root}index.html">Ferrule</a><a href="${root}support.html">Support</a><a href="${privacyPath}">Privacy</a><a href="${termsPath}">Terms</a></nav>
  <main>
  <h1>${escapeHtml(content.appName)}: ${escapeHtml(document.title)}</h1>
  <p class="updated">Last updated: <time datetime="${escapeHtml(content.updatedAt)}">${escapeHtml(content.updatedLabel)}</time></p>
  <p class="intro">${escapeHtml(document.introduction)}</p>
${contact}${sections(document)}
  </main>
  <footer><a href="mailto:${escapeHtml(content.supportEmail)}">Contact the developer</a><a href="https://www.apple.com/legal/privacy/">Apple Privacy Policy</a></footer>
</div>
</body>
</html>
`;
}

for (const [file, document, isPrivacy] of [
  ['legal/privacy.html', content.privacy, true], ['support.html', content.support, false],
]) {
  fs.writeFileSync(path.join(outputDirectory, file), renderDocument(document, isPrivacy));
  console.log(JSON.stringify({ file, sourceHash }));
}
