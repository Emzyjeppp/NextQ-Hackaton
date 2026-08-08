const fs = require('fs');

// Mock localStorage and BroadcastChannel
global.localStorage = {
    data: {},
    getItem(key) { return this.data[key] || null; },
    setItem(key, val) { this.data[key] = val; }
};

global.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage(msg) {}
};

global.window = {
    addEventListener: () => {}
};

// Evaluate engine.js
const engineCode = fs.readFileSync('js/engine.js', 'utf8');
eval(engineCode);

const engine = new QSmartEngine();
// Clear demo data
engine.resetDemoData();
console.log("After reset:", engine.getTickets());

const ticket = engine.ambilNomor('srv_1');
console.log("After ambil:", engine.getTickets());
