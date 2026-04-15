const fs = require('fs');
const path = require('path');

const roots = [
  path.resolve(__dirname, '../src'),
  path.resolve(__dirname, '../../frontend/src')
];

const allowed = new Set([
  path.resolve(__dirname, '../src/utils/logger.js'),
  path.resolve(__dirname, '../src/config/database.config.js'),
  path.resolve(__dirname, '../src/config/email.config.js')
]);

const offenders = [];

const scan = (targetPath) => {
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      scan(path.join(targetPath, entry));
    }
    return;
  }
  if (!/\.(js|jsx)$/.test(targetPath)) return;
  if (allowed.has(targetPath)) return;
  const content = fs.readFileSync(targetPath, 'utf8');
  if (/\bconsole\.(log|warn|error|info|debug)\s*\(/.test(content)) {
    offenders.push(targetPath);
  }
};

for (const root of roots) {
  if (fs.existsSync(root)) scan(root);
}

if (offenders.length) {
  console.error('Disallowed console.* usage found:');
  offenders.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('No disallowed console.* usage found.');
