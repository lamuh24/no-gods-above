const assert = require('assert');
const fs = require('fs');
const path = require('path');

const rendererSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'debugRenderer.ts'), 'utf8');
const styleSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'debug', 'style.css'), 'utf8');

assert.match(rendererSource, /new ResizeObserver\(\(\) => this\.resize\(\)\)/, 'renderer must observe container-size changes');
assert.match(rendererSource, /this\.hostResizeObserver\?\.observe\(host\)/, 'renderer must bind the actual viewport host');
assert.match(rendererSource, /this\.hostResizeObserver\?\.disconnect\(\)/, 'renderer must release the observer on dispose');
assert.match(styleSource, /\.viewport canvas \{[^}]*max-width:\s*100%[^}]*max-height:\s*100%/s, 'canvas needs a CSS containment fallback');

console.log('Debug renderer responsive canvas V1 tests passed: container observation, disposal, and CSS containment are present.');
