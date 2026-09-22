# @superinstance/cargo-line-tycoon-substrate

Polyformal Quilt substrate for cargo-line-tycoon.

## What's in this package

- **FNV-1a 64-bit** — canonical canary hash
- **Cell** — Quilt substrate atom (state, witness_log, behavior, address, type)
- **Signal Chain** — event bus (rooms, signals, routes, 6 routing algorithms)
- **LocaleClassroom** — adapter for locale-specific pedagogical canon

## The fleet canary

```
FNV-1a 64-bit hash of "café Δ 日本語" = 0x024a555471370b18d
```

This hash MUST be identical across all 6+ language ports. See the polyformalism test runner in cargo-line-tycoon/tests/canary/.

## Usage

```js
const sub = require('@superinstance/cargo-line-tycoon-substrate');

// Canary
console.log(sub.verifyCanary()); // { match: true, ... }

// Cell
const cell = new sub.Cell({ state: 'hello', type: 'test' });
console.log(cell.address); // FNV-1a 64-bit hex

// Signal chain
const chain = new sub.SignalChain();
chain.registerRoom('shanghai');
chain.registerRoom('rotterdam');
chain.addRoute('shanghai', 'rotterdam', sub.RoutingAlgorithm.OnChange);

chain.send(new sub.Signal('shanghai', 'rotterdam', sub.SignalTypes.ShipArrived, { ship_id: 'ship_1' }));
const received = chain.receive('rotterdam'); // 1 signal (OnChange dedup)

// LocaleClassroom
const classroom = new sub.LocaleClassroom({
  locale: 'en',
  portCanon: [{ id: 'shanghai', name: 'Shanghai', lat: 31.2, lng: 121.5, country: 'CN' }],
  agentCanon: [{ id: 'teacher_1', name: 'Test Teacher', persona: 'helpful', language: 'en', framing: 'socratic' }],
  curriculum: { tier_1: [], tier_2: [], tier_3: [], framing: 'socratic' },
});
```

## Polyformalism (cross-language parity)

Same input → same FNV-1a hash, byte-for-byte across:
- **TypeScript** (this package)
- **Rust** (cargo-line-tycoon/substrate/rust/)
- **C99** (cargo-line-tycoon/substrate/c/)
- **Python** (cargo-line-tycoon/substrate/py/)
