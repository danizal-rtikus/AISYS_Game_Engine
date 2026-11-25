const fs = require('fs');
const path = require('path');

const runtimePath = path.join(__dirname, 'aisys-runtime.js');
const harnessPath = path.join(__dirname, '../../public/test-harness.html');
const outPath = path.join(__dirname, '../../public/standalone-test.html');

const runtime = fs.readFileSync(runtimePath, 'utf8');
const harness = fs.readFileSync(harnessPath, 'utf8');

const bundled = harness.replace('<script src="/src/runtime/aisys-runtime.js"></script>', `<script>\n${runtime}\n</script>`);
fs.writeFileSync(outPath, bundled, 'utf8');
console.log('✅ Generated standalone-test.html successfully. Size:', (bundled.length / 1024).toFixed(1), 'KB');
