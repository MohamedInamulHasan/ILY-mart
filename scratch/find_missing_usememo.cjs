const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
    if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const hasUseMemoCall = /\buseMemo\s*\(/.test(content);
    if (hasUseMemoCall) {
        const hasUseMemoImport = /import\s+[^;]*\buseMemo\b[^;]*from\s+['"]react['"]/.test(content);
        const hasReactDot = /React\.useMemo/.test(content);
        if (!hasUseMemoImport && !hasReactDot) {
            console.log('REAL Missing useMemo in:', filePath);
        }
    }
}

function traverse(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
        if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
        const p = path.join(dir, item);
        if (fs.statSync(p).isDirectory()) {
            traverse(p);
        } else {
            checkFile(p);
        }
    }
}

traverse('src');
console.log('Done scanning src');
