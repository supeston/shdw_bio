const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify: minifyHtml } = require('html-minifier-terser');
const { minify: minifyJs } = require('terser');

async function build() {
  console.log('Starting minification build...');

  const srcDir = path.join(__dirname, 'src');
  const destDir = __dirname;

  // 1. Minify CSS
  console.log('Minifying CSS...');
  const cssInputPath = path.join(srcDir, 'style.css');
  if (fs.existsSync(cssInputPath)) {
    const cssContent = fs.readFileSync(cssInputPath, 'utf8');
    const cssMinified = new CleanCSS({ level: 1 }).minify(cssContent);
    if (cssMinified.errors.length) {
      console.error('CSS Minification Errors:', cssMinified.errors);
    }
    if (cssMinified.warnings.length) {
      console.warn('CSS Minification Warnings:', cssMinified.warnings);
    }
    fs.writeFileSync(path.join(destDir, 'style.css'), cssMinified.styles);
    console.log(`CSS minified: ${cssContent.length} bytes -> ${cssMinified.styles.length} bytes`);
  } else {
    console.warn('src/style.css not found!');
  }

  // 2. Minify JS
  console.log('Minifying JS...');
  const jsInputPath = path.join(srcDir, 'script.js');
  if (fs.existsSync(jsInputPath)) {
    const jsContent = fs.readFileSync(jsInputPath, 'utf8');
    try {
      const jsMinified = await minifyJs(jsContent, {
        compress: {
          dead_code: true,
          drop_debugger: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          hoist_funs: true,
          keep_fargs: false,
          hoist_vars: true,
          if_return: true,
          join_vars: true,
          collapse_vars: true,
          reduce_vars: true
        },
        mangle: {
          toplevel: true
        }
      });
      fs.writeFileSync(path.join(destDir, 'script.js'), jsMinified.code);
      console.log(`JS minified: ${jsContent.length} bytes -> ${jsMinified.code.length} bytes`);
    } catch (err) {
      console.error('JS Minification Error:', err);
    }
  } else {
    console.warn('src/script.js not found!');
  }

  // 3. Minify HTML
  console.log('Minifying HTML...');
  const htmlInputPath = path.join(srcDir, 'index.html');
  if (fs.existsSync(htmlInputPath)) {
    const htmlContent = fs.readFileSync(htmlInputPath, 'utf8');
    try {
      const htmlMinified = await minifyHtml(htmlContent, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeOptionalTags: true
      });
      fs.writeFileSync(path.join(destDir, 'index.html'), htmlMinified);
      console.log(`HTML minified: ${htmlContent.length} bytes -> ${htmlMinified.length} bytes`);
    } catch (err) {
      console.error('HTML Minification Error:', err);
    }
  } else {
    console.warn('src/index.html not found!');
  }

  console.log('Build completed successfully!');
}

build().catch(err => {
  console.error('Build failed:', err);
});
