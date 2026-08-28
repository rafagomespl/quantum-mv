/* ============================================================
   RAP — Problema de Alocação Confiável (Reliable Assignment)
   Modelo: escolher k estações para abrir e conectar cada cliente
   a uma estação PRIMÁRIA e a uma estação BACKUP.
   custo = Σ abertura + Σ rota primária + q · Σ rota de backup
   ============================================================ */

export interface Facility {
  id: number;
  code: string;
  name: string;
  x: number;
  y: number;
  cost: number; // custo fixo de abertura (R$/mês)
}

export type Kind = 'hospital' | 'escola' | 'mercado' | 'residencial';

export interface Client {
  id: number;
  code: string;
  kind: Kind;
  x: number;
  y: number;
}

export interface Asg {
  p: number; // estação primária (índice em FACILITIES)
  b: number; // estação de backup
}

export interface Solution {
  open: number[];
  asg: Asg[];
  opening: number;
  primary: number;
  backup: number;
  expected: number; // q × backup
  total: number;
}

export const KM_PER_PX = 1 / 55; // o mapa (800px) ≈ 14,5 km de cidade
export const TRANSPORT = 12; // R$ por km de rota / mês

export const FACILITIES: Facility[] = [
  { id: 0, code: 'F1', name: 'Centro', x: 400, y: 255, cost: 430 },
  { id: 1, code: 'F2', name: 'Alvorada', x: 150, y: 115, cost: 210 },
  { id: 2, code: 'F3', name: 'Ribeirão', x: 655, y: 105, cost: 240 },
  { id: 3, code: 'F4', name: 'Colina', x: 115, y: 385, cost: 190 },
  { id: 4, code: 'F5', name: 'Vale Verde', x: 300, y: 435, cost: 230 },
  { id: 5, code: 'F6', name: 'Porto', x: 695, y: 425, cost: 260 },
  { id: 6, code: 'F7', name: 'Est. Norte', x: 430, y: 85, cost: 310 },
  { id: 7, code: 'F8', name: 'Campos', x: 565, y: 300, cost: 220 },
  { id: 8, code: 'F9', name: 'Serra', x: 215, y: 240, cost: 200 },
  { id: 9, code: 'F10', name: 'Lagoa', x: 742, y: 262, cost: 250 },
];

export const CLIENTS: Client[] = [
  { id: 0, code: 'D1', kind: 'hospital', x: 330, y: 150 },
  { id: 1, code: 'D2', kind: 'residencial', x: 480, y: 175 },
  { id: 2, code: 'D3', kind: 'mercado', x: 250, y: 320 },
  { id: 3, code: 'D4', kind: 'escola', x: 560, y: 150 },
  { id: 4, code: 'D5', kind: 'residencial', x: 85, y: 215 },
  { id: 5, code: 'D6', kind: 'hospital', x: 620, y: 360 },
  { id: 6, code: 'D7', kind: 'mercado', x: 375, y: 340 },
  { id: 7, code: 'D8', kind: 'escola', x: 175, y: 460 },
  { id: 8, code: 'D9', kind: 'residencial', x: 718, y: 168 },
  { id: 9, code: 'D10', kind: 'hospital', x: 460, y: 445 },
  { id: 10, code: 'D11', kind: 'escola', x: 90, y: 70 },
  { id: 11, code: 'D12', kind: 'mercado', x: 735, y: 330 },
];

export const KIND_LABEL: Record<Kind, string> = {
  hospital: 'Hospital',
  escola: 'Escola',
  mercado: 'Mercado',
  residencial: 'Residencial',
};

export const KIND_LETTER: Record<Kind, string> = {
  hospital: 'H',
  escola: 'E',
  mercado: 'M',
  residencial: 'R',
};

/** matriz de distâncias [cliente][estação] em km */
export const DIST: number[][] = CLIENTS.map((c) =>
  FACILITIES.map((f) => Math.hypot(c.x - f.x, c.y - f.y) * KM_PER_PX),
);

/** avalia um conjunto de estações abertas (a alocação ótima é derivada) */
export function evaluate(open: number[], q: number, protection: boolean): Solution {
  const sortedOpen = [...open].sort((a, b) => a - b);
  let opening = 0;
  for (const f of sortedOpen) opening += FACILITIES[f].cost;

  let primary = 0;
  let backup = 0;
  const asg: Asg[] = CLIENTS.map((_, c) => {
    const ranked = [...sortedOpen].sort((a, b) => DIST[c][a] - DIST[c][b]);
    const p = ranked[0];
    const b = protection && ranked.length > 1 ? ranked[1] : ranked[0];
    primary += DIST[c][p] * TRANSPORT;
    backup += DIST[c][b] * TRANSPORT;
    return { p, b };
  });

  const expected = protection ? backup * q : 0;
  return {
    open: sortedOpen,
    asg,
    opening,
    primary,
    backup,
    expected,
    total: opening + primary + expected,
  };
}

/* ---------------- annealing (busca inspirada em quantum annealing) ---------------- */

export interface TunnelEvent {
  iter: number;
  dE: number;
}

export interface Improvement {
  iter: number;
  sol: Solution;
}

export interface AnnealResult {
  iters: number;
  initial: Solution;
  best: Solution;
  history: number[]; // melhor custo após cada iteração
  tunnels: TunnelEvent[];
  improvements: Improvement[];
  evaluated: number;
  k: number;
  q: number;
  protection: boolean;
}

function randomSubset(n: number, k: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}

export function anneal(k: number, q: number, protection: boolean, iters = 680): AnnealResult {
  const T0 = 300;
  const T1 = 0.6;

  let cur = randomSubset(FACILITIES.length, k);
  let curSol = evaluate(cur, q, protection);
  let curCost = curSol.total;

  let best = curSol;
  const improvements: Improvement[] = [{ iter: 0, sol: curSol }];
  const tunnels: TunnelEvent[] = [];
  const history: number[] = [];

  const all = FACILITIES.map((_, i) => i);

  for (let i = 0; i < iters; i++) {
    const T = T0 * Math.pow(T1 / T0, i / iters);

    // movimento: trocar uma estação aberta por uma fechada
    const outIdx = Math.floor(Math.random() * cur.length);
    const closed = all.filter((f) => !cur.includes(f));
    const inF = closed[Math.floor(Math.random() * closed.length)];
    const next = [...cur];
    next[outIdx] = inF;

    const nextSol = evaluate(next, q, protection);
    const dE = nextSol.total - curCost;

    if (dE < 0 || Math.random() < Math.exp(-dE / T)) {
      cur = next;
      curCost = nextSol.total;
      curSol = nextSol;
      if (dE > 0.01 && tunnels.length < 200) tunnels.push({ iter: i, dE });
      if (curCost < best.total - 0.001) {
        best = curSol;
        improvements.push({ iter: i + 1, sol: curSol });
      }
    }
    history.push(best.total);
  }

  return {
    iters,
    initial: improvements[0].sol,
    best,
    history,
    tunnels,
    improvements,
    evaluated: iters,
    k,
    q,
    protection,
  };
}

/* ---------------- métricas auxiliares ---------------- */

export function comb(n: number, k: number): number {
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

/** tamanho do espaço de busca: combinações de estações × alocações possíveis */
export function searchSpaceSize(k: number, protection: boolean): number {
  const sets = comb(FACILITIES.length, k);
  const perClient = protection ? k * (k - 1) : k;
  return sets * Math.pow(perClient, CLIENTS.length);
}

export interface FailureImpact {
  affected: number[];
  rescued: number[];
  offline: number[];
  extraCost: number;
}

export function failureImpact(asg: Asg[], failed: number[], protection: boolean): FailureImpact {
  const failedSet = new Set(failed);
  const affected: number[] = [];
  const rescued: number[] = [];
  const offline: number[] = [];
  let extraCost = 0;

  asg.forEach((a, c) => {
    if (failedSet.has(a.p)) {
      affected.push(c);
      if (protection && a.b !== a.p && !failedSet.has(a.b)) {
        rescued.push(c);
        extraCost += DIST[c][a.b] * TRANSPORT;
      } else {
        offline.push(c);
      }
    }
  });

  return { affected, rescued, offline, extraCost };
}

/* ---------------- formatação pt-BR ---------------- */

const brl = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function formatBRL(n: number): string {
  return `R$ ${brl.format(Math.round(n))}`;
}

export function formatBig(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} trilhões`;
  if (n >= 1e9) return `${(n / 1e9).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} bilhões`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} milhões`;
  return brl.format(n);
}
