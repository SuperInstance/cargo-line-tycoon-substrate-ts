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

## Phase 0 — world-model (`src/world.js`)

The shared game kernel both the toy and the full game run on, added on top of
`Cell` unchanged (`src/index.js` is not modified by this module):

- **`SeededRNG`** — deterministic PRNG (mulberry32, seeded via `fnv1a64` of the
  seed string). Same seed ⇒ same draw sequence, on every machine, forever.
- **`World`** — a booked, append-only tick loop. `world.tick(step)` advances the
  compressed clock; `world.book(entry)` appends any event to the witness-log;
  `world.bookLedger({debit, credit, amount, memo})` books a double-entry money
  movement in integer minor units (identity never floats — a non-integer or
  negative `amount` throws). `world.stateHash()` hashes the whole run so far.
- **Game cell factories** — `makeCompanyCell`, `makeShipCell`, `makeRouteCell`,
  `makePortCell`, `makeMarketCell`. Each returns a normal, content-addressed
  `Cell` (identical state ⇒ identical address); `EntityStore` (`world.entities`)
  tracks the *current* cell address per mutable entity id while every prior
  version stays in `world.cells`, so nothing is ever overwritten in place.

**The law this buys:** replay ≡ live. Feed a fresh `World` booted from the same
seed the same ordered sequence of actions and you get a byte-identical
witness-log and `stateHash()`, every time — see `test-world.js`.

```js
const { World, makeShipCell } = require('@superinstance/cargo-line-tycoon-substrate/src/world.js');

const world = new World({ seed: 'my-run-1' });
world.entities.put('ship_1', makeShipCell({
  id: 'ship_1', companyId: 'co_1', classId: 'feeder',
  capacityTeu: 800, speedKn: 14, positionPortId: 'los_angeles',
}));
world.tick((w) => {
  const drift = w.rng.float(-0.03, 0.03); // deterministic, seed-derived
  w.book({ type: 'market_drift', port_id: 'seattle', drift });
});
console.log(world.stateHash());
```

Run `npm test` (or `node test.js && node test-world.js`) to check both the
original canary/cell/signal-chain/locale suite and the Phase 0 replay-
determinism suite are green.
