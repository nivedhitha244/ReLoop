const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'buyer', 'Sidebar.jsx');
let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldLines = `  const displayName = "Nivi world";\n  const initials = "NW";`;
const newLines = `  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.email?.split('@')[0] || 'Buyer';\n  const initials = displayName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'BP';`;

if (!src.includes(oldLines)) {
  console.error('ERROR: Target string not found! Current lines 15-16:');
  src.split('\n').slice(13, 18).forEach((l, i) => console.log(`  ${i+14}: ${l}`));
  process.exit(1);
}

src = src.replace(oldLines, newLines);
fs.writeFileSync(filePath, src, 'utf8');
console.log('SUCCESS: Sidebar.jsx patched — displayName and initials now read from currentUser prop.');
