const fs = require('fs');
const path = require('path');

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function normalizeToTwoSpaces(content) {
  const lines = content.split('\n');
  const leadingCounts = [];

  for (const line of lines) {
    const match = line.match(/^(\s*)/);
    if (match && line.trim().length > 0) {
      let leading = match[1];
      leading = leading.replace(/\t/g, '  ');
      const count = leading.length;
      if (count > 0 && !leadingCounts.includes(count)) {
        leadingCounts.push(count);
      }
    }
  }

  const veryLargeCounts = leadingCounts.filter((c) => c >= 8);
  const largeCounts = veryLargeCounts.length > 0 ? veryLargeCounts : leadingCounts.filter((c) => c >= 4);
  const stepLarge = largeCounts.length > 0 ? largeCounts.reduce(gcd) : 2;
  const stepSmall = 2;

  return lines
    .map((line) => {
      const match = line.match(/^(\s*)(.*)$/);
      const leading = match[1];
      const rest = match[2];
      if (!leading) return line;
      const expanded = leading.replace(/\t/g, '  ');
      const spaceCount = expanded.length;
      const step = spaceCount >= 4 ? stepLarge : stepSmall;
      const levels = Math.round(spaceCount / step);
      return '  '.repeat(levels) + rest;
    })
    .join('\n');
}

const themeDir = path.join(__dirname, '..');
const exts = ['.php', '.scss'];

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules' && e.name !== 'scripts') {
      walk(full, files);
    } else if (exts.includes(path.extname(e.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(themeDir);
for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const normalized = normalizeToTwoSpaces(raw);
  if (raw !== normalized) {
    fs.writeFileSync(file, normalized, 'utf8');
    console.log('Updated:', path.relative(themeDir, file));
  }
}
console.log('Done. Processed', files.length, 'files.');
