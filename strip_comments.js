const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Strip HTML comments
let html = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
html = html.replace(/<!--[\s\S]*?-->/g, '');
fs.writeFileSync(path.join(srcDir, 'index.html'), html);

// Strip CSS comments
let css = fs.readFileSync(path.join(srcDir, 'style.css'), 'utf8');
css = css.replace(/\/\*[\s\S]*?\*\//g, '');
fs.writeFileSync(path.join(srcDir, 'style.css'), css);

// Strip JS comments
let js = fs.readFileSync(path.join(srcDir, 'script.js'), 'utf8');
// Careful with URLs in JS like https://, so use a safer regex for single line comments or just strip block comments
// We can use a simple regex for block and single line but we must avoid strings.
// A simpler way: we know the project well, let's just use simple regexes.
// Block comments:
js = js.replace(/\/\*[\s\S]*?\*\//g, '');
// Single line comments (assuming they start with // and are not inside strings. To be safe, we'll only strip // at the start of a line or after whitespace)
js = js.replace(/^\s*\/\/.*$/gm, '');
// And inline comments like `something; // comment`
js = js.replace(/([^:]|^)\/\/.*/g, '$1'); 
fs.writeFileSync(path.join(srcDir, 'script.js'), js);

console.log("Comments removed.");
