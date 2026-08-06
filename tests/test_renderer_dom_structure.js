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
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (!condition) {
        console.error('FAIL: ' + message);
        exitCode = 1;
        failCount++;
    } else {
        console.log('PASS: ' + message);
        passCount++;
    }
}

// Prerequisites (not counted as assertions)
const pageHome = findNodeById(root, 'page-home');
const pageSettings = findNodeById(root, 'page-settings');
if (!pageHome) throw new Error('#page-home missing');
if (!pageSettings) throw new Error('#page-settings missing');

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
if (!mainAreaNode) throw new Error('.main-area missing');

// Check CSS contract with bounded extraction
const cssPath = path.join(__dirname, '../src/renderer/styles/main.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

function getCssRule(selector) {
    const escaped = selector.replace(/\./g, '\\.');
    const regex = new RegExp(escaped + '\\s*\\{([^}]*)\\}');
    const match = cssContent.match(regex);
    return match ? match[1] : null;
}

const pipelineContainerRule = getCssRule('.pipeline-container');
assert(pipelineContainerRule !== null, '.pipeline-container exists');
if (pipelineContainerRule) {
    assert(pipelineContainerRule.includes('display: flex;'), 'display:flex');
    assert(pipelineContainerRule.includes('flex-direction: column;'), 'flex-direction:column');
    assert(pipelineContainerRule.includes('flex: 1;'), 'flex:1');
    assert(pipelineContainerRule.includes('width: 100%;'), 'width:100%');
} else {
    assert(false, 'display:flex');
    assert(false, 'flex-direction:column');
    assert(false, 'flex:1');
    assert(false, 'width:100%');
}

const pipelineContentAreaRule = getCssRule('.pipeline-content-area');
assert(pipelineContentAreaRule && pipelineContentAreaRule.includes('display: flex;'), '.pipeline-content-area display:flex');
assert(pipelineContentAreaRule && pipelineContentAreaRule.includes('flex: 1;'), '.pipeline-content-area flex:1');

const pipelinePaneActiveRule = getCssRule('.pipeline-pane.active');
assert(pipelinePaneActiveRule && pipelinePaneActiveRule.includes('display: flex;'), '.pipeline-pane.active display:flex');

const toolkitLayout3ColRule = getCssRule('.toolkit-layout-3col');
assert(toolkitLayout3ColRule && toolkitLayout3ColRule.includes('display: flex;'), '.toolkit-layout-3col display:flex');
assert(toolkitLayout3ColRule && toolkitLayout3ColRule.includes('flex: 1;'), '.toolkit-layout-3col flex:1');

const pageHomeAncestors = getAncestors(pageHome);
assert(pageHomeAncestors.some(n => hasClass(n, 'main-area')), '#page-home inside .main-area');

const pageSettingsAncestors = getAncestors(pageSettings);
assert(pageSettingsAncestors.some(n => hasClass(n, 'main-area')), '#page-settings inside .main-area');

assert(pageHome.parent === pageSettings.parent, 'Home and Settings siblings');

let tk3col = null;
function findTk3col(node) {
    if (hasClass(node, 'toolkit-layout-3col')) return node;
    for (const child of node.children) {
        const found = findTk3col(child);
        if (found) return found;
    }
    return null;
}
tk3col = findTk3col(root);

if (tk3col) {
    const pAncestors = getAncestors(tk3col);
    assert(pAncestors.some(n => hasClass(n, 'pipeline-container')), 'toolkit wrapper under pipeline container');
    assert(!pAncestors.some(n => hasClass(n, 'col-controls') || hasClass(n, 'toolkit-sidebar')), 'toolkit wrapper not under narrow sidebar');
} else {
    assert(false, 'toolkit wrapper under pipeline container');
    assert(false, 'toolkit wrapper not under narrow sidebar');
}

const visualSelectors = [
    '.pipeline-bar-v2', '.step-chevron', '.step-chevron.active',
    '.step-title', '.step-sub', '.tk-group', '.tk-input', '.tk-slider',
    '.tk-btn', '.tk-btn-primary', '.tk-btn-danger', '.tk-btn-sm',
    '.tk-prompt-box', '.tk-prompt-list', '.tk-prompt-item',
    '.tk-prompt-item.active', '.tk-job-list', '.tk-log-console', '.tk-log-header'
];
for (const sel of visualSelectors) {
    assert(getCssRule(sel) !== null, 'Visual selector ' + sel + ' exists in CSS');
}
assert(duplicates.length === 0, 'no duplicate IDs');

console.log('TOTAL: ' + passCount + ' PASS / ' + failCount + ' FAIL');
process.exit(exitCode);
