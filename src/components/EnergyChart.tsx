import { formatBRL, type TunnelEvent } from '../lib/problem';

interface EnergyChartProps {
  history: number[];
  tunnels: TunnelEvent[];
  iters: number;
}

const W = 340;
const H = 130;
const PAD = 10;

/** curva do melhor custo ao longo das iterações do annealing */
export default function EnergyChart({ history, tunnels, iters }: EnergyChartProps) {
  if (history.length < 2) {
    return (
      <div className="flex h-[130px] items-center justify-center border border-dashed border-line bg-ink-900/40">
        <p className="font-mono text-xs text-mist-500">
          // execute a otimização para ver a curva de energia
        </p>
      </div>
    );
  }

  const min = Math.min(...history);
  const max = Math.max(...history);
  const span = max - min || 1;

  const x = (i: number) => PAD + (i / (iters - 1)) * (W - PAD * 2);
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - PAD * 2);

  const pts = history.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const lastX = x(history.length - 1);
  const lastY = y(history[history.length - 1]);
  const area = `M${pts.replace(/ /g, ' L')} L ${lastX.toFixed(1)},${H - 3} L ${PAD},${H - 3} Z`;

  return (
    <div className="relative border border-line bg-ink-900/40">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-[130px] w-full" preserveAspectRatio="none" aria-hidden="true">
        <path d={area} fill="rgba(79,216,232,0.10)" />
        <polyline points={pts} fill="none" stroke="#4fd8e8" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <line x1={PAD} x2={W - PAD} y1={y(min)} y2={y(min)} stroke="rgba(255,180,84,0.35)" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
        {tunnels
          .filter((t) => t.iter < history.length)
          .map((t, i) => (
            <line
              key={i}
              x1={x(t.iter)} x2={x(t.iter)}
              y1={Math.max(4, y(history[t.iter]) - 5)}
              y2={y(history[t.iter]) + 5}
              stroke="#ff6b7a" strokeWidth="1.4" opacity="0.75" vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>
      <div className="absolute left-2 top-1.5 font-mono text-[10px] text-mist-500">
        custo total ↓
      </div>
      <div className="absolute right-2 top-1.5 font-mono text-[10px] text-solar-400">
        melhor: {formatBRL(min)}
      </div>
      <div
        className="pop-in absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-qubit-400 shadow-[0_0_12px_rgba(79,216,232,0.9)]"
        style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%` }}
      />
      <div className="flex justify-between border-t border-line px-2 py-1 font-mono text-[10px] text-mist-700">
        <span>iteração 0</span>
        <span>
          <span className="text-coral-400">▮</span> túnel quântico &nbsp;
          <span className="text-qubit-400">▬</span> melhor custo
        </span>
        <span>{iters}</span>
      </div>
    </div>
  );
}
