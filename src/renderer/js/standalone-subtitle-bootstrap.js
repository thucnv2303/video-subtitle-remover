const STYLE_ATTR = 'data-standalone-subtitle-remover-styles';

function installStandaloneSubtitleStyles() {
  if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/standalone-subtitle-remover.css';
  link.setAttribute(STYLE_ATTR, 'true');
  document.head.appendChild(link);
}

installStandaloneSubtitleStyles();

import './standalone-subtitle-remover.js';
import './standalone-subtitle-interactions.js';
import './standalone-output-folder.js';
