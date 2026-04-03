const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');
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
