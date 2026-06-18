/**
 * Migration script: Replace all localStorage calls with tauribridge equivalents.
 * Run: node migrate-localstorage.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');

// Files to skip (already migrated or are the bridge itself)
const SKIP_FILES = [
  'tauribridge.js',
  'musicShared.js',
  'FloatingDock.jsx',
];

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(walkDir(filePath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walkDir(SRC_DIR);
let totalChanges = 0;

files.forEach(filePath => {
  const basename = path.basename(filePath);
  if (SKIP_FILES.includes(basename)) return;

  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes('localStorage')) return;
  
  let changed = false;
  
  // Replace localStorage.getItem("key") → readDataSync("key")
  if (content.includes('localStorage.getItem')) {
    content = content.replace(/localStorage\.getItem\(/g, 'readDataSync(');
    changed = true;
  }
  
  // Replace localStorage.setItem("key", value) → writeDataSync("key", value)
  if (content.includes('localStorage.setItem')) {
    content = content.replace(/localStorage\.setItem\(/g, 'writeDataSync(');
    changed = true;
  }
  
  // Replace localStorage.removeItem("key") → removeDataSync("key")
  if (content.includes('localStorage.removeItem')) {
    content = content.replace(/localStorage\.removeItem\(/g, 'removeDataSync(');
    changed = true;
  }
  
  if (changed) {
    // Add import if not already present
    if (!content.includes('tauribridge')) {
      // Determine relative path to utils/tauribridge
      const relDir = path.relative(path.dirname(filePath), path.join(SRC_DIR, 'utils'));
      let relPath = relDir.replace(/\\/g, '/');
      if (!relPath.startsWith('.')) relPath = './' + relPath;
      
      // Determine which functions are needed
      const needs = [];
      if (content.includes('readDataSync')) needs.push('readDataSync');
      if (content.includes('writeDataSync')) needs.push('writeDataSync');
      if (content.includes('removeDataSync')) needs.push('removeDataSync');
      
      const importLine = `import { ${needs.join(', ')} } from '${relPath}/tauribridge';\n`;
      
      // Add import after the last existing import
      const lastImportIdx = content.lastIndexOf('import ');
      if (lastImportIdx !== -1) {
        const lineEnd = content.indexOf('\n', lastImportIdx);
        content = content.slice(0, lineEnd + 1) + importLine + content.slice(lineEnd + 1);
      } else {
        content = importLine + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    totalChanges++;
    console.log(`✅ Updated: ${path.relative(__dirname, filePath)}`);
  }
});

console.log(`\nDone! Updated ${totalChanges} files.`);
