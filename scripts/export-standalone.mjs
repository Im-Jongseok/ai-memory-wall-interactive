/** Build the same React application as an offline IIFE, with only the selected paper's assets. */
import { build, createServer } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const requestedId = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
let papers;
try {
  ({ papers } = await server.ssrLoadModule('/src/papers/registry.ts'));
} finally {
  await server.close();
}
const paper = requestedId
  ? papers.find((p) => p.id === requestedId)
  : (papers.find((p) => p.id === 'ai-memory-wall') ?? papers[0]);
if (!paper) throw new Error(`등록되지 않은 논문: ${requestedId}`);
const names = new Set([
  paper.pdf,
  ...paper.pages.flatMap((p) => [p.image, p.thumbnail]),
  ...(paper.features?.hbm ? [paper.features.hbm.fallback] : []),
]);
const mime = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};
const assets = Object.fromEntries(
  await Promise.all(
    [...names].map(async (name) => {
      const file = resolve(root, 'public', name);
      if (!file.startsWith(resolve(root, 'public') + '/'))
        throw new Error(`잘못된 자산 경로: ${name}`);
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
      return [
        name,
        `data:${mime[ext] ?? 'application/octet-stream'};base64,${(await readFile(file)).toString('base64')}`,
      ];
    }),
  ),
);
// The registry middleware initializes NODE_ENV as development. Compile the browser bundle as production.
process.env.NODE_ENV = 'production';
const result = await build({
  mode: 'production',
  root,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  logLevel: 'warn',
  build: {
    write: false,
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: { entry: resolve(root, 'src/main.tsx'), name: 'PaperReview', formats: ['iife'] },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});
const chunks = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
const js = chunks
  .filter((c) => c.type === 'chunk')
  .map((c) => c.code)
  .join('\n');
const css = chunks
  .filter((c) => c.type === 'asset' && c.fileName.endsWith('.css'))
  .map((c) => c.source)
  .join('\n');
const licenses = await Promise.all(
  [
    'node_modules/react/LICENSE',
    'node_modules/react-dom/LICENSE',
    'node_modules/three/LICENSE',
    'tools/anatomy/LICENSE',
  ].map((file) => readFile(resolve(root, file), 'utf8')),
);
const escapeScript = (text) => text.replace(/<\/script/gi, '<\\/script');
const title = paper.title.replace(
  /[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
);
const html = `<!doctype html>\n<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#ffffff"><link rel="icon" href="data:,"><title>${title} — 논문 리뷰</title><style>${css}</style></head><body><div id="root"></div><script>window.__PAPER_EXPORT__=${JSON.stringify({ paperId: paper.id, assets })};\n${escapeScript(js)}\n/*\n${escapeScript(licenses.join('\n\n'))}\n*/</script></body></html>\n`;
const outIndex = args.indexOf('--out');
const output =
  outIndex >= 0 ? resolve(args[outIndex + 1]) : resolve(root, '..', paper.exportFilename);
await writeFile(output, html);
console.log(`Standalone: ${output}`);
