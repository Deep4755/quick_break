// Debug script to check paths on Hostinger
const path = require('path');
const fs = require('fs');

console.log('=== PATH DEBUG ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());
console.log('process.argv[1]:', process.argv[1]);

const possiblePaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, 'src', '..', 'public'),
  path.join(process.cwd(), 'public'),
  path.join(process.cwd(), 'BACKEND', 'public'),
];

console.log('\n=== CHECKING PATHS ===');
possiblePaths.forEach((p, i) => {
  const indexExists = fs.existsSync(path.join(p, 'index.html'));
  console.log(`${i + 1}. ${p} -> index.html exists: ${indexExists}`);
  if (fs.existsSync(p)) {
    try {
      const contents = fs.readdirSync(p);
      console.log(`   Contents: ${contents.join(', ')}`);
    } catch (e) {
      console.log(`   Error reading dir: ${e.message}`);
    }
  } else {
    console.log('   Directory does not exist');
  }
});

console.log('\n=== CURRENT DIRECTORY CONTENTS ===');
try {
  const cwd = fs.readdirSync(process.cwd());
  console.log('process.cwd() contents:', cwd.join(', '));
} catch (e) {
  console.log('Error reading cwd:', e.message);
}

console.log('\n=== __dirname CONTENTS ===');
try {
  const dirname = fs.readdirSync(__dirname);
  console.log('__dirname contents:', dirname.join(', '));
} catch (e) {
  console.log('Error reading __dirname:', e.message);
}