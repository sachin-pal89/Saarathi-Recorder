const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix relative imports to add .js extension
  content = content.replace(/from '\.\/([^']+)'/g, "from './$1.js'");
  content = content.replace(/from '\.\.\/([^']+)'/g, "from '../$1.js'");
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${filePath}`);
}

function fixImportsInDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImportsInDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  }
}

// Fix all imports in the dist directory
fixImportsInDirectory('./dist');
console.log('All imports fixed!');
