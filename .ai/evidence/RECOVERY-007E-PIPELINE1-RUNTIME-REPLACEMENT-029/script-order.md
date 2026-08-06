# Script Order
index.html loaded settings.js as an ES6 module before pp.js (which is deferred), meaning window._appState was initialized by store.js before pp.js executed.
