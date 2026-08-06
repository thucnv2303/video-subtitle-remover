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

assert(pageHome !== null, '#page-home exists');
assert(pageSettings !== null, '#page-settings exists');
assert(mainAreaNode !== null, '.main-area exists');

// Check CSS contract with bounded extraction
const cssPath = path.join(__dirname, '../src/renderer/styles/main.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function getCssRule(selector) {
    // Escaped regex for selector to find its block {}
    const escaped = selector.replace(/\./g, '\\.');
    const regex = new RegExp(escaped + '\\s*\\{([^}]*)\\}');
    const match = cssContent.match(regex);
    return match ? match[1] : null;
}

const pipelineContainerRule = getCssRule('.pipeline-container');
assert(pipelineContainerRule !== null, '1. .pipeline-container rule exists.');
if (pipelineContainerRule) {
    assert(pipelineContainerRule.includes('display: flex;'), '2. Its own declarations include display:flex.');
    assert(pipelineContainerRule.includes('flex-direction: column;'), '3. Its own declarations include flex-direction:column.');
    assert(pipelineContainerRule.includes('flex: 1;'), '4. Its own declarations include flex:1.');
    assert(pipelineContainerRule.includes('width: 100%;'), '5. Its own declarations include width:100%.');
} else {
    assert(false, '2. Its own declarations include display:flex.');
    assert(false, '3. Its own declarations include flex-direction:column.');
    assert(false, '4. Its own declarations include flex:1.');
    assert(false, '5. Its own declarations include width:100%.');
}

const pipelineContentAreaRule = getCssRule('.pipeline-content-area');
assert(pipelineContentAreaRule && pipelineContentAreaRule.includes('display: flex;') && pipelineContentAreaRule.includes('flex: 1;'), '6. .pipeline-content-area rule has display:flex and flex:1.');

const pipelinePaneActiveRule = getCssRule('.pipeline-pane.active');
assert(pipelinePaneActiveRule && pipelinePaneActiveRule.includes('display: flex;'), '7. .pipeline-pane.active rule has display:flex.');

const toolkitLayout3ColRule = getCssRule('.toolkit-layout-3col');
assert(toolkitLayout3ColRule && toolkitLayout3ColRule.includes('display: flex;') && toolkitLayout3ColRule.includes('flex: 1;'), '8. .toolkit-layout-3col rule has display:flex and flex:1.');

const pageHomeAncestors = pageHome ? getAncestors(pageHome) : [];
assert(pageHomeAncestors.some(n => hasClass(n, 'main-area')), '9. #page-home remains inside .main-area.');

const pageSettingsAncestors = pageSettings ? getAncestors(pageSettings) : [];
assert(pageSettingsAncestors.some(n => hasClass(n, 'main-area')), '10. #page-settings remains inside .main-area.');

assert(pageHome && pageSettings && pageHome.parent === pageSettings.parent, '11. Home and Settings remain sibling page sections.');

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

assert(tk3col !== null, '12. .toolkit-layout-3col exists in production HTML.');
if (tk3col) {
    const pAncestors = getAncestors(tk3col);
    assert(pAncestors.some(n => hasClass(n, 'pipeline-container')), '13. It is under .pipeline-container.');
    assert(!pAncestors.some(n => hasClass(n, 'col-controls') || hasClass(n, 'toolkit-sidebar')), '14. It is not under a narrow sidebar/control column.');
} else {
    assert(false, '13. It is under .pipeline-container.');
    assert(false, '14. It is not under a narrow sidebar/control column.');
}

assert(duplicates.length === 0, '15. No duplicate IDs.');

if (exitCode !== 0) {
    console.error('16. Test exits non-zero on any failed assertion.');
}
process.exit(exitCode);

