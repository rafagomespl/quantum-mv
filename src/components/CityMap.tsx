import { useEffect, useState } from 'react';
import {
  FACILITIES,
  CLIENTS,
  DIST,
  KIND_LABEL,
  KIND_LETTER,
  formatBRL,
  type Asg,
} from '../lib/problem';
import { useReducedMotion } from '../lib/hooks';

interface CityMapProps {
  open: number[];
  asg: Asg[];
  failed: number[];
  protection: boolean;
  rescued: number[];
  offline: number[];
  onToggle: (f: number) => void;
  shakeKey: number;
}

type Tip = { type: 'client' | 'facility'; idx: number } | null;

function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

const fmtKm = (km: number) => `${km.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km`;

export default function CityMap({
  open,
  asg,
  failed,
  protection,
  rescued,
  offline,
  onToggle,
  shakeKey,
}: CityMapProps) {
  const reduced = useReducedMotion();
  const [tip, setTip] = useState<Tip>(null);
  const [shaking, setShaking] = useState(false);

  const openSet = new Set(open);
  const failedSet = new Set(failed);
  const rescuedSet = new Set(rescued);
  const offlineSet = new Set(offline);

  useEffect(() => {
    if (shakeKey === 0 || reduced) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), 500);
    return () => clearTimeout(t);
  }, [shakeKey, reduced]);

  const primaryServedCount = (f: number) => asg.filter((a) => a.p === f).length;

  return (
    <div className={`relative ${shaking ? 'do-shake' : ''}`}>
      <svg
        viewBox="0 0 800 520"
        className="block h-auto w-full"
        role="img"
        aria-label="Mapa da cidade com estações candidatas e clientes conectados"
      >
        <defs>
          <radialGradient id="mapGlow" cx="42%" cy="38%" r="75%">
            <stop offset="0%" stopColor="rgba(79,216,232,0.07)" />
            <stop offset="55%" stopColor="rgba(10,18,32,0)" />
            <stop offset="100%" stopColor="rgba(255,180,84,0.045)" />
          </radialGradient>
          <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0 H0 V50" fill="none" stroke="rgba(120,180,220,0.06)" strokeWidth="1" />
          </pattern>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* fundo da cidade */}
        <rect width="800" height="520" fill="#0a1322" />
        <rect width="800" height="520" fill="url(#mapGlow)" />
        <rect width="800" height="520" fill="url(#mapGrid)" />
        <rect x="92" y="58" width="150" height="92" rx="10" fill="rgba(255,255,255,0.02)" />
        <rect x="300" y="330" width="150" height="90" rx="10" fill="rgba(255,255,255,0.02)" />
        <rect x="480" y="190" width="130" height="84" rx="10" fill="rgba(255,255,255,0.02)" />
        <rect x="70" y="300" width="120" height="92" rx="14" fill="rgba(111,227,165,0.05)" stroke="rgba(111,227,165,0.14)" strokeDasharray="4 5" />
        <text x="86" y="322" fontSize="9" fontFamily="Space Mono, monospace" fill="rgba(111,227,165,0.4)">parque</text>
        <path
          d="M 622 0 C 600 120, 664 210, 634 310 C 606 405, 664 470, 646 520"
          fill="none"
          stroke="rgba(80,150,200,0.10)"
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M 622 0 C 600 120, 664 210, 634 310 C 606 405, 664 470, 646 520"
          fill="none"
          stroke="rgba(130,190,230,0.14)"
          strokeWidth="1.4"
          strokeDasharray="8 10"
        />

        {/* arestas: backup primeiro (abaixo), primário depois */}
        <g>
          {CLIENTS.map((c, ci) => {
            if (offlineSet.has(ci)) return null;
            const a = asg[ci];
            const isRescued = rescuedSet.has(ci);
            const bTarget = FACILITIES[a.b];
            const pTarget = FACILITIES[a.p];
            const backupEdge =
              protection && a.b !== a.p && !failedSet.has(a.b) && !isRescued ? (
                <line
                  key={`b${ci}`}
                  x1={c.x} y1={c.y} x2={bTarget.x} y2={bTarget.y}
                  stroke="#ffb454" strokeWidth="1.3" strokeDasharray="3 7"
                  opacity="0.5" className={reduced ? undefined : 'edge-backup'}
                />
              ) : null;
            const primaryEdge = isRescued ? (
              <line
                key={`r${ci}`}
                x1={c.x} y1={c.y} x2={bTarget.x} y2={bTarget.y}
                stroke="#ffb454" strokeWidth="2.4" filter="url(#softGlow)"
                className={reduced ? undefined : 'edge-rescue'}
              />
            ) : (
              <line
                key={`p${ci}`}
                x1={c.x} y1={c.y} x2={pTarget.x} y2={pTarget.y}
                stroke="#4fd8e8" strokeWidth="1.6" opacity="0.68"
              />
            );
            return (
              <g key={`e${ci}`}>
                {backupEdge}
                {primaryEdge}
              </g>
            );
          })}
        </g>

        {/* pacotes de dados fluindo pelas rotas primárias */}
        {!reduced &&
          CLIENTS.map((c, ci) => {
            if (offlineSet.has(ci) || rescuedSet.has(ci)) return null;
            const p = FACILITIES[asg[ci].p];
            return (
              <circle key={`pk${ci}`} r="2.3" fill="#b7f4fb" opacity="0.9">
                <animateMotion
                  dur={`${(2.3 + ci * 0.37).toFixed(2)}s`}
                  repeatCount="indefinite"
                  path={`M ${c.x} ${c.y} L ${p.x} ${p.y}`}
                />
              </circle>
            );
          })}

        {/* clientes */}
        {CLIENTS.map((c, ci) => {
          const off = offlineSet.has(ci);
          const resc = rescuedSet.has(ci);
          const stroke = off ? '#ff6b7a' : resc ? '#ff97a1' : '#ffb454';
          return (
            <g
              key={c.code}
              transform={`translate(${c.x},${c.y})`}
              className="client-node"
              onMouseEnter={() => setTip({ type: 'client', idx: ci })}
              onMouseLeave={() => setTip(null)}
            >
              <circle r="11" fill="#0e1a2c" stroke={stroke} strokeWidth="1.7" opacity={off ? 0.55 : 1} />
              <text
                textAnchor="middle" dy="3.5" fontSize="9.5" fontWeight="700"
                fontFamily="Space Mono, monospace" fill={off ? '#7f97ad' : '#eaf4fb'}
              >
                {KIND_LETTER[c.kind]}
              </text>
              <text y="25" textAnchor="middle" fontSize="9" fontFamily="Space Mono, monospace" fill="#7f97ad">
                {c.code}
              </text>
              {off && (
                <g stroke="#ff6b7a" strokeWidth="2" strokeLinecap="round">
                  <line x1="-15" y1="-15" x2="-9" y2="-9" />
                  <line x1="-9" y1="-15" x2="-15" y2="-9" />
                </g>
              )}
            </g>
          );
        })}

        {/* estações candidatas */}
        {FACILITIES.map((f) => {
          const isOpen = openSet.has(f.id);
          const isFailed = failedSet.has(f.id);
          const stroke = isFailed ? '#ff6b7a' : isOpen ? '#4fd8e8' : 'rgba(127,151,173,0.38)';
          const icon = isFailed ? '#ff6b7a' : isOpen ? '#8beef7' : '#7f97ad';
          return (
            <g
              key={f.code}
              transform={`translate(${f.x},${f.y})`}
              className="map-node"
              role="button"
              tabIndex={0}
              aria-label={`Estação ${f.code} ${f.name} — ${isFailed ? 'em falha' : isOpen ? 'aberta' : 'fechada'}. Clique para alternar.`}
              onClick={() => onToggle(f.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggle(f.id);
                }
              }}
              onMouseEnter={() => setTip({ type: 'facility', idx: f.id })}
              onMouseLeave={() => setTip(null)}
              onBlur={() => setTip(null)}
            >
              {isOpen && !isFailed && !reduced && (
                <path d={hexPath(0, 0, 24)} fill="none" stroke="#4fd8e8" strokeWidth="1.2" className="hex-pulse" />
              )}
              <path
                d={hexPath(0, 0, 17)}
                fill={isOpen ? 'rgba(79,216,232,0.10)' : '#0c1726'}
                stroke={stroke}
                strokeWidth={isOpen ? 1.9 : 1.2}
              />
              <g stroke={icon} strokeWidth="1.5" strokeLinecap="round" fill="none">
                <path d="M-5 6.5 L0 -7 L5 6.5" />
                <line x1="-2.7" y1="1.6" x2="2.7" y2="1.6" />
              </g>
              <circle cy="-7" r="1.4" fill={icon} />
              {isFailed && (
                <g stroke="#ff6b7a" strokeWidth="2.4" strokeLinecap="round" opacity="0.95">
                  <line x1="-8" y1="-8" x2="8" y2="8" />
                  <line x1="8" y1="-8" x2="-8" y2="8" />
                </g>
              )}
              <text y="33" textAnchor="middle" fontSize="9.5" fontFamily="Space Mono, monospace" fill={isOpen ? '#8beef7' : '#7f97ad'}>
                {f.code}
              </text>
            </g>
          );
        })}
      </svg>

      {/* tooltip */}
      {tip && (() => {
        const x = tip.type === 'client' ? CLIENTS[tip.idx].x : FACILITIES[tip.idx].x;
        const y = tip.type === 'client' ? CLIENTS[tip.idx].y : FACILITIES[tip.idx].y;
        const flip = y < 120;
        return (
          <div
            className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 border border-line bg-ink-850/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm"
            style={{
              left: `${(x / 800) * 100}%`,
              top: `${(y / 520) * 100}%`,
              transform: flip
                ? 'translate(-50%, 24px)'
                : 'translate(-50%, calc(-100% - 20px))',
            }}
          >
            {tip.type === 'client' ? (() => {
              const c = CLIENTS[tip.idx];
              const a = asg[tip.idx];
              const off = offlineSet.has(tip.idx);
              const resc = rescuedSet.has(tip.idx);
              return (
                <>
                  <p className="font-display text-sm font-bold text-mist-100">
                    {c.code} · {KIND_LABEL[c.kind]}
                  </p>
                  <div className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-mist-300">
                    <p>
                      <span className="text-qubit-300">primário</span> {FACILITIES[a.p].code} {FACILITIES[a.p].name}
                      <span className="text-mist-500"> · {fmtKm(DIST[tip.idx][a.p])}</span>
                    </p>
                    <p>
                      <span className="text-solar-400">backup</span>{' '}
                      {protection && a.b !== a.p
                        ? `${FACILITIES[a.b].code} ${FACILITIES[a.b].name} · ${fmtKm(DIST[tip.idx][a.b])}`
                        : '—'}
                    </p>
                    <p className={off ? 'text-coral-400' : resc ? 'text-solar-400' : 'text-moss-400'}>
                      {off ? '▲ fora do ar' : resc ? '● operando via backup' : '● serviço normal'}
                    </p>
                  </div>
                </>
              );
            })() : (() => {
              const f = FACILITIES[tip.idx];
              const isOpen = openSet.has(f.id);
              const isFailed = failedSet.has(f.id);
              return (
                <>
                  <p className="font-display text-sm font-bold text-mist-100">
                    {f.code} · {f.name}
                  </p>
                  <div className="mt-1.5 space-y-1 font-mono text-[11px] leading-snug text-mist-300">
                    <p>custo fixo <span className="text-mist-100">{formatBRL(f.cost)}/mês</span></p>
                    <p>atende <span className="text-mist-100">{primaryServedCount(f.id)}</span> clientes (primária)</p>
                    <p className={isFailed ? 'text-coral-400' : isOpen ? 'text-qubit-300' : 'text-mist-500'}>
                      {isFailed ? '▲ em falha — derrubada' : isOpen ? '● aberta' : '○ fechada · clique p/ abrir'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        );
      })()}
    </div>
  );
}
