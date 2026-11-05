const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'buyer', 'GreetingBanner.jsx');
let src = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add displayName derivation and fix date default after the function signature line
const oldBlock = `export default function GreetingBanner({ user }) {\n  const dateStr = user?.weather?.date || "Tue, 22 Apr 2025";`;
const newBlock = `export default function GreetingBanner({ user }) {\n  const displayName = user?.name || user?.fullName || 'there';\n  const dateStr = user?.weather?.date || new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });`;

if (!src.includes(oldBlock)) {
  console.error('Block 1 not found. Showing lines 4-8:');
  src.split('\n').slice(3, 8).forEach((l, i) => console.log(`  ${i+4}: ${JSON.stringify(l)}`));
  process.exit(1);
}
src = src.replace(oldBlock, newBlock);

// 2. Replace hardcoded name in JSX
const oldHeading = `<h1 className="banner-heading">Welcome, Nivi world!</h1>`;
const newHeading = `<h1 className="banner-heading">Welcome, {displayName}!</h1>`;

if (!src.includes(oldHeading)) {
  console.error('Heading not found. Showing all h1 lines:');
  src.split('\n').filter(l => l.includes('h1')).forEach(l => console.log(' ', JSON.stringify(l)));
  process.exit(1);
}
src = src.replace(oldHeading, newHeading);

fs.writeFileSync(filePath, src, 'utf8');
console.log('SUCCESS: GreetingBanner.jsx patched — Welcome greeting now uses user.name from prop.');

