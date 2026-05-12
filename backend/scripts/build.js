const path = require('path');
const fs = require('fs/promises');
const fg = require('fast-glob');
const esbuild = require('esbuild');

const backendRoot = path.resolve(__dirname, '..');
const distRoot = path.join(backendRoot, 'dist');

async function copyPath(sourceRelPath) {
  const source = path.join(backendRoot, sourceRelPath);
  const destination = path.join(distRoot, sourceRelPath);
  await fs.cp(source, destination, { recursive: true });
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
}

build().catch((error) => {
  console.error('Backend build failed.');
  console.error(error);
  process.exit(1);
});
