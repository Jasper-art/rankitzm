const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(res));
    } else if (/\.tsx$/.test(entry.name)) {
      files.push(res);
    }
  }
  return files;
}

const files = walk(path.resolve(process.cwd(), 'src'));
const paths = new Set();
const re = /navigate\s*\(\s*['"`]{1}([^'"`]+)['"`]{1}/g;
for (const f of files) {
  const c = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(c))) {
    paths.add(m[1]);
  }
}
console.log([...paths].sort().join('\n'));
