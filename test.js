const sub = require('./src/index.js');

// 1. Canary
const canary = sub.verifyCanary();
console.log('Canary:', canary.hash_hex, 'match:', canary.match);

// 2. Cell
const c = new sub.Cell({ state: 'hello', type: 'test' });
console.log('Cell address:', c.address);

// 3. Signal chain
const chain = new sub.SignalChain();
chain.registerRoom('shanghai');
chain.registerRoom('rotterdam');
chain.addRoute('shanghai', 'rotterdam', sub.RoutingAlgorithm.OnChange);
chain.send(new sub.Signal('shanghai', 'rotterdam', sub.SignalTypes.ShipArrived, { ship_id: 'ship_1' }));
chain.send(new sub.Signal('shanghai', 'rotterdam', sub.SignalTypes.ShipArrived, { ship_id: 'ship_1' })); // Should be dropped (OnChange)
console.log('Rotterdam received:', chain.receive('rotterdam').length, 'signals');

// 4. Locale
const classroom = new sub.LocaleClassroom({
  locale: 'en-test',
  portCanon: [{ id: 'shanghai', name: 'Shanghai', lat: 31.2, lng: 121.5, country: 'CN' }],
  agentCanon: [{ id: 'teacher_1', name: 'Test Teacher', persona: 'helpful', language: 'en', framing: 'socratic' }],
  curriculum: { tier_1: [], tier_2: [], tier_3: [], framing: 'socratic' },
});
console.log('Locale classroom:', classroom.locale, 'framing:', classroom.pedagogicalFraming());
