import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pkgPath = path.join(projectRoot, 'package.json');
const srcWorkerPath = path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const srcPkgPath = path.join(projectRoot, 'node_modules', 'pdfjs-dist', 'package.json');
const destWorkerPath = path.join(projectRoot, 'public', 'pdf.worker.min.mjs');

function fail(msg) {
  console.error(`[sync-pdf-worker] ERROR: ${msg}`);
  process.exit(1);
}

try {
  if (!fs.existsSync(pkgPath)) {
    fail(`Could not find package.json at ${pkgPath}`);
  }
  const rootPkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const targetVersion = rootPkg.dependencies?.['pdfjs-dist'];

  if (!fs.existsSync(srcPkgPath)) {
    fail(`pdfjs-dist is not installed in node_modules at ${srcPkgPath}. Run npm install first.`);
  }
  const installedPkg = JSON.parse(fs.readFileSync(srcPkgPath, 'utf8'));
  const installedVersion = installedPkg.version;

  if (targetVersion && !targetVersion.includes(installedVersion) && targetVersion !== installedVersion) {
    fail(`Version mismatch: package.json specifies "${targetVersion}" but node_modules has "${installedVersion}".`);
  }

  if (!fs.existsSync(srcWorkerPath)) {
    fail(`Worker build not found at ${srcWorkerPath}.`);
  }

  const srcBytes = fs.readFileSync(srcWorkerPath);
  if (srcBytes.length === 0) {
    fail(`Source worker file at ${srcWorkerPath} is empty.`);
  }

  fs.copyFileSync(srcWorkerPath, destWorkerPath);

  const destBytes = fs.readFileSync(destWorkerPath);
  if (destBytes.length !== srcBytes.length) {
    fail(`Byte count mismatch after copy: expected ${srcBytes.length}, got ${destBytes.length}`);
  }

  console.log(`[sync-pdf-worker] Successfully synchronized pdf.worker.min.mjs (${installedVersion}, ${destBytes.length} bytes).`);
} catch (err) {
  fail(err instanceof Error ? err.stack || err.message : String(err));
}
