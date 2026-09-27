// Phase 0 predicate: a scripted game run replays bit-for-bit —
// same seed + same inputs => identical witness-log / state hash.
//
// Run with: node test-world.js

const assert = require('assert');
const {
  SeededRNG, World,
  makeCompanyCell, makeShipCell, makeRouteCell, makePortCell, makeMarketCell,
} = require('./src/world.js');

let passed = 0;
function check(label, fn) {
  fn();
  passed++;
  console.log(`  ok — ${label}`);
}

console.log('SeededRNG determinism');
check('same seed => identical draw sequence', () => {
  const a = new SeededRNG('run-1');
  const b = new SeededRNG('run-1');
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  assert.deepStrictEqual(seqA, seqB);
});
check('different seed => different draw sequence', () => {
  const a = new SeededRNG('run-1');
  const b = new SeededRNG('run-2');
  assert.notStrictEqual(a.next(), b.next());
});
check('draws stay within [0, 1)', () => {
  const r = new SeededRNG('bounds');
  for (let i = 0; i < 500; i++) {
    const v = r.next();
    assert.ok(v >= 0 && v < 1, `draw out of range: ${v}`);
  }
});

console.log('Game cell factories');
check('cells are content-addressed and typed', () => {
  const p1 = makePortCell({ id: 'los_angeles', name: 'Port of Los Angeles', lat: 33.7395, lng: -118.261, country: 'US', annualTeus: 9000000, tier: 1 });
  const p2 = makePortCell({ id: 'los_angeles', name: 'Port of Los Angeles', lat: 33.7395, lng: -118.261, country: 'US', annualTeus: 9000000, tier: 1 });
  assert.strictEqual(p1.type, 'port');
  assert.strictEqual(p1.address, p2.address, 'identical state must hash identically (content-addressed)');
});
check('different state -> different address', () => {
  const s1 = makeShipCell({ id: 'ship_1', companyId: 'co_1', classId: 'feeder', capacityTeu: 800, speedKn: 14, positionPortId: 'los_angeles' });
  const s2 = makeShipCell({ id: 'ship_1', companyId: 'co_1', classId: 'feeder', capacityTeu: 800, speedKn: 14, positionPortId: 'seattle' });
  assert.notStrictEqual(s1.address, s2.address);
});

// ─────────────────────────────────────────────────────────────────────
// A scripted, minimal game run: found a company, buy a ship, book a
// route, run it for a handful of ticks with stochastic (but seeded)
// market drift, and hash the resulting world twice from scratch.
// ─────────────────────────────────────────────────────────────────────

function scriptedRun(seed) {
  const world = new World({ seed });

  world.entities.put('co_1', makeCompanyCell({ id: 'co_1', name: 'Casey Shipping', cashMinorUnits: 500000000 }));
  world.entities.put('port:los_angeles', makePortCell({ id: 'los_angeles', name: 'Port of Los Angeles', lat: 33.7395, lng: -118.261, country: 'US', annualTeus: 9000000, tier: 1 }));
  world.entities.put('port:seattle', makePortCell({ id: 'seattle', name: 'Port of Seattle', lat: 47.5903, lng: -122.3343, country: 'US', annualTeus: 1900000, tier: 2 }));
  world.entities.put('market:los_angeles', makeMarketCell({ portId: 'los_angeles', commodity: 'electronics', basePrice: 1000, price: 1000, demand: 1.0 }));
  world.entities.put('market:seattle', makeMarketCell({ portId: 'seattle', commodity: 'electronics', basePrice: 1200, price: 1200, demand: 1.0 }));

  world.entities.put('ship_1', makeShipCell({ id: 'ship_1', companyId: 'co_1', classId: 'feeder', capacityTeu: 800, speedKn: 14, positionPortId: 'los_angeles' }));
  world.bookLedger({ debit: 'co_1', credit: 'shipyard', amount: 20000000, memo: 'buy ship_1 (feeder)' });

  world.entities.put('route_1', makeRouteCell({ id: 'route_1', companyId: 'co_1', fromPortId: 'los_angeles', toPortId: 'seattle', distanceNm: 960, assignedShipIds: ['ship_1'] }));

  for (let i = 0; i < 12; i++) {
    world.tick((w) => {
      // Deterministic per-tick "market drift" driven only by w.rng — this is
      // exactly the class of stochastic draw the replay predicate exists to
      // pin down (weather/demand/event timing in the real engine).
      const drift = w.rng.float(-0.03, 0.03);
      w.book({ type: 'market_drift', port_id: 'seattle', drift });

      if (w.tick_no === 6) {
        // A scripted "arrival" event: book a ledger entry for delivered cargo.
        w.bookLedger({ debit: 'buyer', credit: 'co_1', amount: 5_000_00, memo: 'cargo delivered route_1' });
      }
    });
  }

  return world;
}

console.log('Phase 0 predicate: replay determinism');
check('same seed + same scripted inputs => identical witness-log', () => {
  const w1 = scriptedRun('canary-seed-42');
  const w2 = scriptedRun('canary-seed-42');
  assert.strictEqual(w1.stateHash(), w2.stateHash(), 'state hashes must match on replay');
  assert.deepStrictEqual(
    w1.witness_log.map((e) => JSON.stringify(e)),
    w2.witness_log.map((e) => JSON.stringify(e)),
    'witness logs must be byte-identical on replay',
  );
});
check('different seed => different witness-log (sanity: the test can actually fail)', () => {
  const w1 = scriptedRun('canary-seed-42');
  const w3 = scriptedRun('canary-seed-43');
  assert.notStrictEqual(w1.stateHash(), w3.stateHash());
});
check('ledger rejects non-integer / negative amounts (money never floats)', () => {
  const w = new World({ seed: 'money-law' });
  assert.throws(() => w.bookLedger({ debit: 'a', credit: 'b', amount: 1.5, memo: 'bad' }));
  assert.throws(() => w.bookLedger({ debit: 'a', credit: 'b', amount: -1, memo: 'bad' }));
});

console.log(`\n${passed} checks passed.`);
