const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../src/renderer/index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Strip comments
html = html.replace(/<!--[\s\S]*?-->/g, '');

const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr', '!doctype']);

const root = { tagName: 'root', children: [] };
const stack = [root];
const ids = new Set();
const duplicates = [];

const tagRegex = /<\/?([a-zA-Z0-9\-!]+)([^>]*)>/g;
let match;

while ((match = tagRegex.exec(html)) !== null) {
    const isClosing = match[0].startsWith('</');
    const tagName = match[1].toLowerCase();
    const attrs = match[2];

    if (!isClosing) {
        const idMatch = attrs.match(/id=(?:["']([^"']+)["']|([^>\s]+))/i);
        const id = idMatch ? (idMatch[1] || idMatch[2]) : null;
        if (id) {
            if (ids.has(id)) duplicates.push(id);
            ids.add(id);
        }

        const classMatch = attrs.match(/class=(?:["']([^"']+)["']|([^>\s]+))/i);
        const className = classMatch ? (classMatch[1] || classMatch[2]) : null;

        const node = { tagName, id, className, parent: stack[stack.length - 1], children: [] };
        stack[stack.length - 1].children.push(node);

        const isSelfClosing = attrs.endsWith('/') || voidElements.has(tagName) || tagName.startsWith('!doctype');
        if (!isSelfClosing) {
            stack.push(node);
        }
    } else {
        // Closing tag
        let i = stack.length - 1;
        while (i > 0 && stack[i].tagName !== tagName) {
            i--;
        }
        if (i > 0) {
            stack.length = i; // Pop everything up to the matching tag
        }
    }
}

function findNodeById(node, id) {
    if (node.id === id) return node;
    for (const child of node.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}

function hasClass(node, cls) {
    if (!node || !node.className) return false;
    return node.className.split(/\s+/).includes(cls);
}

function getAncestors(node) {
    const ancestors = [];
    let curr = node.parent;
    while (curr && curr.tagName !== 'root') {
        ancestors.push(curr);
        curr = curr.parent;
    }
    return ancestors;
}

let exitCode = 0;
function assert(condition, message) {
    if (!condition) {
        console.error('FAIL: ' + message);
        exitCode = 1;
    } else {
        console.log('PASS: ' + message);
    }
}

// Assertions
const pageHome = findNodeById(root, 'page-home');
const pageSettings = findNodeById(root, 'page-settings');
const mainArea = root.children.flatMap(c => c.children).find(n => hasClass(n, 'main-area')) || 
                 getAncestors(pageHome || root).find(n => hasClass(n, 'main-area')); // brute search

let mainAreaFound = false;
function findMainArea(node) {
    if (hasClass(node, 'main-area')) {
        mainAreaFound = true;
        return node;
    }
    for (const child of node.children) {
        const found = findMainArea(child);
        if (found) return found;
    }
    return null;
}
const mainAreaNode = findMainArea(root);

assert(pageHome !== null, '1. #page-home exists.');
assert(pageSettings !== null, '2. #page-settings exists.');
assert(mainAreaNode !== null, '3. .main-area exists.');

const pageHomeAncestors = pageHome ? getAncestors(pageHome) : [];
const pageSettingsAncestors = pageSettings ? getAncestors(pageSettings) : [];

assert(pageHomeAncestors.some(n => hasClass(n, 'main-area')), '4. #page-home is contained within .main-area.');
assert(pageSettingsAncestors.some(n => hasClass(n, 'main-area')), '5. #page-settings is contained within .main-area.');

assert(pageHome && pageSettings && pageHome.parent === pageSettings.parent, '6. #page-home and #page-settings are page-level sections under the intended application container.');

const step2Content = findNodeById(root, 'step-2-content');
const step2Ancestors = step2Content ? getAncestors(step2Content) : [];
assert(step2Ancestors.some(n => n.id === 'page-home'), '7. #step-2-content is contained within #page-home.');

const settingsAncestors = pageSettings ? getAncestors(pageSettings) : [];
assert(!settingsAncestors.some(n => n.id === 'step-2-content'), '8. Pipeline 2 markup does not contain #page-settings.');

assert(ids.has('ai-provider') && ids.has('ai-api-key'), '9. Required Settings IDs exist.');
assert(ids.has('step1-ai-model') && ids.has('btn-start-all'), '10. Required Pipeline 1 IDs exist.');
assert(duplicates.length === 0, '11. No duplicate IDs exist in the parsed production document. (Duplicates: ' + duplicates.join(', ') + ')');

// Check CSS contract
const cssPath = path.join(__dirname, '../src/renderer/styles/main.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(cssContent.includes('.pipeline-container') && cssContent.includes('flex: 1'), '12. CSS contains the intended width/flex/grid contract for Home (.pipeline-container).');
assert(cssContent.includes('.toolkit-layout-3col') && cssContent.includes('display: flex'), '13. CSS contains flex contract for .toolkit-layout-3col, preventing narrow left-column fallback.');

const toolkit3col = root.children.flatMap(c => c.children).find(n => hasClass(n, 'toolkit-layout-3col')) || findMainArea(root).children.find(n => hasClass(n, 'toolkit-layout-3col'));

let tk3col = null;
function findTk3col(node) {
    if (hasClass(node, 'toolkit-layout-3col')) {
        tk3col = node;
        return node;
    }
    for (const child of node.children) {
        if (findTk3col(child)) return child;
    }
    return null;
}
findTk3col(root);

assert(tk3col !== null, '14. Pipeline 1 main wrapper (.toolkit-layout-3col) exists.');
if (tk3col) {
    const pAncestors = getAncestors(tk3col);
    assert(pAncestors.some(n => hasClass(n, 'pipeline-container')), '15. Pipeline 1 wrapper has expected parent hierarchy (.pipeline-container).');
    assert(!pAncestors.some(n => hasClass(n, 'col-controls')), '16. Pipeline 1 wrapper is not nested inside a narrow sidebar/job column.');
}

process.exit(exitCode);
