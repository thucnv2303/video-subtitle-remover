const MODAL_NEW_SELECTOR = '#prompt-v2-new';
const STEP1_ADD_ID = 'step1-btn-add-prompt';
const BRIDGE_MARK = 'promptManagerNewFlowBridge';

function dispatchCanonicalNewPromptFlow() {
  let proxy = document.getElementById(STEP1_ADD_ID);
  let temporary = false;

  if (!proxy) {
    proxy = document.createElement('button');
    proxy.id = STEP1_ADD_ID;
    proxy.type = 'button';
    proxy.hidden = true;
    proxy.dataset[BRIDGE_MARK] = 'true';
    document.body.appendChild(proxy);
    temporary = true;
  }

  proxy.click();

  if (temporary) proxy.remove();
}

function installPromptManagerNewFlowBridge() {
  if (window.__promptManagerNewFlowBridgeInstalled) return;
  window.__promptManagerNewFlowBridgeInstalled = true;

  document.addEventListener('click', event => {
    const button = event.target?.closest?.(MODAL_NEW_SELECTOR);
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    dispatchCanonicalNewPromptFlow();
  }, true);
}

installPromptManagerNewFlowBridge();

export { installPromptManagerNewFlowBridge };
