const path = require('path');
const fs = require('fs/promises');
const fg = require('fast-glob');
const esbuild = require('esbuild');

const backendRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(backendRoot, '..');
const distRoot = path.join(backendRoot, 'dist');
const pdfAssetNames = ['letterhead.png', 'siyinqaba.png', 'watermark.png'];

async function copyPath(sourceRelPath) {
  const source = path.join(backendRoot, sourceRelPath);
  const destination = path.join(distRoot, sourceRelPath);
  await fs.cp(source, destination, { recursive: true });
}

async function pathExists(candidate) {
  try {
    await fs.access(candidate);
    return true;
  } catch (_) {
    return false;
  }
}

async function findPdfAsset(fileName) {
  const candidates = [
    path.join(backendRoot, 'assets', fileName),
    path.join(repoRoot, 'frontend', 'public', fileName),
    path.join(repoRoot, 'docs', fileName)
  ];

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }

  throw new Error(`Required PDF asset not found: ${fileName}`);
}

async function copyPdfAssets() {
  const destinationDir = path.join(distRoot, 'assets');
  await fs.mkdir(destinationDir, { recursive: true });

  for (const fileName of pdfAssetNames) {
    const source = await findPdfAsset(fileName);
    await fs.copyFile(source, path.join(destinationDir, fileName));
  }
}

async function build() {
  await fs.rm(distRoot, { recursive: true, force: true });

  const sourceEntries = await fg(['server.js', 'src/**/*.js'], {
    cwd: backendRoot,
    onlyFiles: true,
    dot: false
  });

  if (!sourceEntries.length) {
    throw new Error('No backend source files found for build.');
  }

  await esbuild.build({
    entryPoints: sourceEntries,
    outdir: distRoot,
    outbase: '.',
    platform: 'node',
    format: 'cjs',
    target: ['node18'],
    sourcemap: true,
    bundle: false,
    logLevel: 'info'
  });

  const filesToCopy = [
    'src/templates',
    'assets'
  ];

  for (const relativePath of filesToCopy) {
    try {
      await copyPath(relativePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  await copyPdfAssets();
}

build().catch((error) => {
  console.error('Backend build failed.');
  console.error(error);
  process.exit(1);
});
