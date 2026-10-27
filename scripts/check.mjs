import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'styles.css'), 'utf8');
const js = await readFile(path.join(root, 'app.js'), 'utf8');
new vm.Script(js, { filename: 'app.js' });
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate document IDs');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (/^(?:https?:|data:)/.test(match[1])) continue;
  await access(path.join(root, match[1]));
}
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error(`Missing anchor: ${match[1]}`);
}
for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) {
  if (!ids.includes(match[1])) throw new Error(`Missing controlled panel: ${match[1]}`);
}
for (const match of css.matchAll(/url\(['"]?(assets\/[^'"\)]+)['"]?\)/g)) await access(path.join(root, match[1]));
if (!html.includes('prefers-reduced-motion') && !css.includes('prefers-reduced-motion')) throw new Error('Missing reduced-motion support');
console.log('Verified JavaScript syntax, local assets, section anchors, unique IDs, tab panel references, and reduced-motion styles.');
