export const FLEET_CANARY_INPUT: string;
export const FLEET_CANARY_HASH: bigint;
export function fnv1a64(str: string): bigint;
export function verifyCanary(input?: string): { input: string; hash_hex: string; expected_hex: string; match: boolean };

export interface CellOpts { state?: any; witness_log?: any[]; behavior?: any; type?: string; }
export class Cell {
  state: any;
  witness_log: any[];
  behavior: any;
  type: string;
  address: string;
  constructor(opts?: CellOpts);
  computeAddress(): string;
  apply(opcode: string, ...args: any[]): any;
}
export class Edge { from: Cell; to: Cell; edge_type: string; address: string; constructor(from: Cell, to: Cell, edgeType?: string); }

export const SignalTypes: { [k: string]: string };
export class Signal { source: string; target: string; signal_type: string; payload: any; priority: number; timestamp: number; id: number; constructor(source: string, target: string, signalType: string, payload?: any, priority?: number); }
export const RoutingAlgorithm: { [k: string]: string };
export class SignalChain {
  rooms: Map<string, any>;
  routes: any[];
  stats: any;
  registerRoom(name: string): boolean;
  addRoute(from: string, to: string, algorithm: string): boolean;
  send(signal: Signal): boolean;
  receive(room: string): Signal[];
  broadcast(signal: Signal): number;
}

export interface PortDef { id: string; name: string; lat: number; lng: number; country: string; }
export interface AgentDef { id: string; name: string; persona: string; language: string; framing: string; }
export interface Curriculum { tier_1: any[]; tier_2: any[]; tier_3: any[]; framing?: string; }
export class LocaleClassroom {
  locale: string;
  portCanon: PortDef[];
  agentCanon: AgentDef[];
  curriculum: Curriculum;
  chain: SignalChain;
  cells: Map<string, Cell>;
  constructor(opts: { locale: string; portCanon: PortDef[]; agentCanon: AgentDef[]; curriculum: Curriculum });
  emitEvent(eventType: string, source: string, payload: any): boolean;
  receiveFor(roomId: string): Signal[];
  pedagogicalFraming(): string;
}
