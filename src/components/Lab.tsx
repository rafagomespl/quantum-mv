import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  CLIENTS,
  FACILITIES,
  anneal,
  evaluate,
  failureImpact,
  formatBRL,
  formatBig,
  searchSpaceSize,
  type AnnealResult,
} from '../lib/problem';
import { useAnimatedNumber, useReducedMotion } from '../lib/hooks';
import CityMap from './CityMap';
import EnergyChart from './EnergyChart';

interface LogLine {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'tunnel';
}

interface AnnealEvent {
  iter: number;
  tone: LogLine['tone'];
  text: string;
}

const T0 = 300;

export default function Lab() {
  const reduced = useReducedMotion();

  const [k, setK] = useState(3);
  const [q, setQ] = useState(0.15);
  const [protection, setProtection] = useState(true);
  const [manualOpens, setManualOpens] = useState<number[]>([1, 0, 7]);
  const [view, setView] = useState<'manual' | 'quantum'>('manual');
  const [failed, setFailed] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [replayIter, setReplayIter] = useState(0);
  const [runId, setRunId] = useState(0);
  const [log, setLog] = useState<LogLine[]>([
    { id: 0, text: 'sistema pronto — clique nos hexágonos ou execute o annealing', tone: 'info' },
  ]);
  const [hint, setHint] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  const resultRef = useRef<AnnealResult | null>(null);
  const eventsRef = useRef<AnnealEvent[]>([]);
  const pointerRef = useRef(0);
  const logIdRef = useRef(1);
  const hintTimer = useRef(0);

  /* ---------------- soluções derivadas ---------------- */

  const manualSol = useMemo(() => evaluate(manualOpens, q, protection), [manualOpens, q, protection]);

  const replaySol = useMemo(() => {
    if (!resultRef.current) return null;
    let s = resultRef.current.initial;
    for (const imp of resultRef.current.improvements) {
      if (imp.iter <= replayIter) s = imp.sol;
      else break;
    }
    return s;
  }, [replayIter, runId]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSol = running
    ? replaySol ?? manualSol
    : view === 'quantum' && resultRef.current
      ? resultRef.current.best
      : manualSol;

  const impact = useMemo(
    () => failureImpact(activeSol.asg, failed, protection),
    [activeSol, failed, protection],
  );

  const totalAnim = useAnimatedNumber(activeSol.total);
  const nBackup = activeSol.asg.filter((a) => a.b !== a.p).length;
  const served = CLIENTS.length - impact.offline.length;
  const continuity = served / CLIENTS.length;
  const space = useMemo(() => searchSpaceSize(k, protection), [k, protection]);

  /* ---------------- helpers ---------------- */

  const flashHint = (text: string) => {
    setHint(text);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(''), 3400);
  };

  const pushLog = (text: string, tone: LogLine['tone']) => {
    const id = logIdRef.current++;
    setLog((prev) => [...prev.slice(-5), { id, text, tone }]);
  };

  /* ---------------- ações ---------------- */

  const toggleFacility = (f: number) => {
    if (running) return;
    if (failed.includes(f)) {
      flashHint('Essa estação está em falha — restaure a rede antes de mexer nela.');
      return;
    }
    const isOpen = manualOpens.includes(f);
    if (isOpen) {
      if (manualOpens.length - 1 < (protection ? 2 : 1)) {
        flashHint(protection ? 'Com a proteção ligada, mantenha ao menos 2 estações abertas.' : 'Mantenha ao menos 1 estação aberta.');
        return;
      }
      setManualOpens(manualOpens.filter((x) => x !== f));
    } else {
      if (manualOpens.length >= k) {
        flashHint(`Limite de k = ${k} atingido — feche outra estação ou aumente k no painel.`);
        return;
      }
      setManualOpens([...manualOpens, f]);
    }
    setView('manual');
    setFailed([]);
  };

  const changeK = (v: number) => {
    setK(v);
    setManualOpens((mo) => (mo.length > v ? mo.slice(0, v) : mo));
    setView('manual');
    setFailed([]);
    resultRef.current = null;
    setReplayIter(0);
  };

  const changeQ = (v: number) => {
    setQ(v);
    setView('manual');
    setFailed([]);
    resultRef.current = null;
    setReplayIter(0);
  };

  const changeProtection = (v: boolean) => {
    setProtection(v);
    setView('manual');
    setFailed([]);
    resultRef.current = null;
    setReplayIter(0);
  };

  const buildEvents = (res: AnnealResult): AnnealEvent[] => {
    const evts: AnnealEvent[] = [];
    res.tunnels.slice(0, 5).forEach((t) =>
      evts.push({
        iter: t.iter,
        tone: 'tunnel',
        text: `túnel quântico: aceitou estado +${formatBRL(t.dE)} → escapou de um vale local`,
      }),
    );
    res.improvements.slice(1, 8).forEach((imp) =>
      evts.push({
        iter: imp.iter,
        tone: 'good',
        text: `novo melhor: ${formatBRL(imp.sol.total)} (iteração ${imp.iter})`,
      }),
    );
    evts.push({
      iter: res.iters,
      tone: 'good',
      text: `convergido: ${formatBRL(res.best.total)} avaliando ${res.evaluated} de ${formatBig(space)} estados`,
    });
    return evts.sort((a, b) => a.iter - b.iter);
  };

  const flushLogs = (it: number) => {
    while (pointerRef.current < eventsRef.current.length && eventsRef.current[pointerRef.current].iter <= it) {
      const e = eventsRef.current[pointerRef.current++];
      pushLog(e.text, e.tone);
    }
  };

  const run = () => {
    if (running) return;
    setFailed([]);
    const res = anneal(k, q, protection);
    resultRef.current = res;
    eventsRef.current = buildEvents(res);
    pointerRef.current = 0;
    setLog([{ id: logIdRef.current++, text: `annealing iniciado · k=${k} · q=${Math.round(q * 100)}% · T₀=${T0}`, tone: 'info' }]);

    if (reduced) {
      setReplayIter(res.iters);
      setView('quantum');
      eventsRef.current.forEach((e) => pushLog(e.text, e.tone));
      return;
    }
    setRunId((id) => id + 1);
    setReplayIter(0);
    setRunning(true);
  };

  useEffect(() => {
    if (!running || !resultRef.current) return;
    const res = resultRef.current;
    const D = 2700;
    let start = 0;
    let raf = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / D);
      const eased = 1 - Math.pow(1 - p, 1.7);
      const it = Math.round(eased * res.iters);
      setReplayIter(it);
      flushLogs(it);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        flushLogs(res.iters);
        setRunning(false);
        setView('quantum');
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runId, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const simulateFailure = () => {
    if (running) return;
    const candidates = activeSol.open.filter((f) => !failed.includes(f));
    if (candidates.length <= 1) {
      flashHint('Só resta 1 estação de pé — restaure a rede antes de derrubar outra.');
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setFailed([...failed, pick]);
    setShakeKey((s) => s + 1);
    pushLog(`falha injectada na estação ${FACILITIES[pick].code} · ${FACILITIES[pick].name}`, 'tunnel');
  };

  const restore = () => {
    setFailed([]);
    pushLog('rede restaurada — todas as estações voltaram ao ar', 'info');
  };

  /* ---------------- exibição ---------------- */

  const modeChip = running
    ? { label: 'annealing em curso…', cls: 'text-qubit-300 border-qubit-500/50' }
    : view === 'quantum'
      ? { label: 'modo: annealing quântico', cls: 'text-qubit-300 border-qubit-500/50' }
      : { label: 'modo: escolha manual', cls: 'text-solar-300 border-solar-400/40' };

  const temperature = resultRef.current
    ? Math.max(0.6, T0 * Math.pow(0.002, replayIter / resultRef.current.iters))
    : null;

  const qBest = resultRef.current?.best ?? null;
  const deltaPct = qBest && view === 'manual' ? ((manualSol.total - qBest.total) / qBest.total) * 100 : null;

  const steps = [
    ['ajuste k e q', 'quantas estações abrir e o risco de falha'],
    ['clique nos hexágonos', 'monte sua rede manualmente no mapa'],
    ['execute o annealing', 'a busca quântica procura a configuração ótima'],
    ['derrube uma estação', 'veja o backup entrar em ação'],
  ];

  return (
    <section id="laboratorio" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-24">
      {/* cabeçalho da seção */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-qubit-400">01 · laboratório interativo</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-mist-100 sm:text-4xl">
            A cidade precisa de <span className="text-solar-400">você</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist-300">
            Instale <strong className="text-mist-100">k estações de distribuição</strong> para atender 12 pontos
            essenciais (hospitais, escolas, mercados, bairros). Cada ponto ganha uma rota{' '}
            <span className="text-qubit-300">primária</span> e uma rota <span className="text-solar-400">de backup</span>{' '}
            — é o RAP, um problema de localização com resiliência de rede.
          </p>
        </div>
        <div className="border border-line bg-ink-850 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-mist-500">
          problema: <span className="text-mist-100">RAP · alocação confiável</span>
        </div>
      </div>

      {/* trilha de passos */}
      <ol className="mb-6 flex flex-wrap gap-2.5">
        {steps.map(([title, desc], i) => (
          <li key={title} className="flex items-center gap-2.5 border border-line bg-ink-900/70 py-2 pl-2 pr-4">
            <span className="flex h-7 w-7 items-center justify-center bg-qubit-500/15 font-mono text-xs font-bold text-qubit-300">
              {i + 1}
            </span>
            <span className="text-xs leading-tight">
              <strong className="block font-display text-[13px] font-bold text-mist-100">{title}</strong>
              <span className="text-mist-500">{desc}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* -------- mapa -------- */}
        <div className="border border-line bg-ink-850">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-mist-500">mapa da rede</p>
            <div className="flex items-center gap-2">
              <span className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${modeChip.cls}`}>
                {modeChip.label}
              </span>
              <span className="border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist-500">
                k={k} · q={Math.round(q * 100)}%
              </span>
            </div>
          </div>

          <div className="flex min-h-6 items-center gap-2 border-b border-line/60 bg-ink-900/60 px-4 py-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-solar-400" />
            <p className="font-mono text-[11px] leading-snug text-mist-300" aria-live="polite">
              {hint || 'Dica: clique nos hexágonos para abrir/fechar estações. Passe o mouse sobre os pontos para ver rotas.'}
            </p>
          </div>

          <CityMap
            open={activeSol.open}
            asg={activeSol.asg}
            failed={failed}
            protection={protection}
            rescued={impact.rescued}
            offline={impact.offline}
            onToggle={toggleFacility}
            shakeKey={shakeKey}
          />

          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 sm:grid-cols-3">
            {[
              [<span key="a" className="inline-block h-0.5 w-5 bg-qubit-400" />, 'rota primária'],
              [<span key="b" className="inline-block w-5 border-t-2 border-dashed border-solar-400" />, 'rota de backup'],
              [<span key="c" className="inline-block h-2.5 w-2.5 rounded-full border-2 border-solar-400" />, 'cliente (H/E/M/R)'],
              [<span key="d" className="inline-block h-2.5 w-2.5 border-2 border-qubit-400" style={{ clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }} />, 'estação aberta'],
              [<span key="e" className="inline-block h-2.5 w-2.5 border border-mist-700" style={{ clipPath: 'polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%)' }} />, 'estação fechada'],
              [<span key="f" className="font-mono text-xs font-bold text-coral-400">✕</span>, 'estação em falha'],
            ].map(([icon, label], i) => (
              <li key={i} className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-mist-500">
                {icon}
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* -------- painel -------- */}
        <div className="space-y-5">
          {/* custo */}
          <div className="border border-line bg-ink-850 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-500">custo total estimado</p>
            <p className="mt-1 font-display text-[42px] font-extrabold leading-none tracking-tight text-mist-100">
              {formatBRL(totalAnim)}
              <span className="ml-2 align-middle font-mono text-xs font-normal text-mist-500">/mês</span>
            </p>

            <ul className="mt-4 space-y-2">
              {[
                ['bg-qubit-400', 'abertura de estações', activeSol.opening],
                ['bg-mist-300', 'rotas primárias', activeSol.primary],
                ['bg-solar-400', `backup esperado (q = ${Math.round(q * 100)}%)`, protection ? activeSol.expected : 0],
              ].map(([dot, label, value]) => (
                <li key={label as string} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-2 w-2 shrink-0 ${dot}`} />
                  <span className="text-mist-300">{label}</span>
                  <span className="ml-auto font-mono text-xs text-mist-100">
                    {protection || label !== `backup esperado (q = ${Math.round(q * 100)}%)` ? formatBRL(value as number) : '—'}
                  </span>
                </li>
              ))}
              {failed.length > 0 && (
                <li className="flex items-center gap-2.5 text-sm">
                  <span className="h-2 w-2 shrink-0 bg-coral-400" />
                  <span className="text-coral-300">contingência em curso ({impact.rescued.length} via backup)</span>
                  <span className="ml-auto font-mono text-xs text-coral-300">+{formatBRL(impact.extraCost)}</span>
                </li>
              )}
            </ul>

            {/* resiliência */}
            <div className="mt-5 border-t border-line pt-4">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-500">resiliência da rede</p>
                <p className="font-mono text-xs text-mist-300">
                  {protection ? `${nBackup}/${CLIENTS.length} com backup` : 'proteção desligada'}
                </p>
              </div>
              <div className="mt-2 h-2 w-full bg-ink-700">
                <div
                  className={`h-full transition-all duration-500 ${continuity === 1 ? 'bg-moss-400' : continuity > 0.7 ? 'bg-solar-400' : 'bg-coral-400'}`}
                  style={{ width: `${continuity * 100}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[11px] text-mist-500">
                continuidade de serviço:{' '}
                <span className={continuity === 1 ? 'text-moss-400' : 'text-coral-300'}>
                  {Math.round(continuity * 100)}%
                </span>
                {failed.length > 0 && impact.offline.length > 0 && (
                  <span className="text-coral-300"> · {impact.offline.length} pontos fora do ar</span>
                )}
              </p>
            </div>

            {/* comparação com o resultado quântico */}
            {qBest && view === 'manual' && !running && (
              <div className="mt-4 flex items-center justify-between gap-3 border border-qubit-700/60 bg-qubit-500/5 px-3 py-2.5">
                <p className="text-xs leading-snug text-mist-300">
                  O annealing achou <strong className="text-qubit-300">{formatBRL(qBest.total)}</strong>
                  {deltaPct !== null && deltaPct > 0.5 && (
                    <span className="text-solar-300"> — sua rede está {deltaPct.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}% mais cara</span>
                  )}
                  {deltaPct !== null && deltaPct <= 0.5 && <span className="text-moss-400"> — você empatou com a máquina!</span>}
                </p>
                <button
                  onClick={run}
                  className="shrink-0 border border-qubit-500/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-qubit-300 transition hover:bg-qubit-500/10"
                >
                  ↻ refazer
                </button>
              </div>
            )}
            {view === 'quantum' && !running && (
              <p className="mt-4 border border-line px-3 py-2 font-mono text-[11px] text-mist-500">
                solução do annealing ativa — <button onClick={() => setView('manual')} className="text-qubit-300 underline decoration-dotted underline-offset-2 hover:text-qubit-200">clique no mapa para editar manualmente</button>
              </p>
            )}
          </div>

          {/* controles */}
          <div className="border border-line bg-ink-850 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-500">parâmetros do problema</p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <div className="flex justify-between font-mono text-xs text-mist-300">
                  <span>k · estações a abrir</span>
                  <span className="text-qubit-300">{k}</span>
                </div>
                <input
                  type="range" min={2} max={5} step={1} value={k} disabled={running}
                  onChange={(e) => changeK(Number(e.target.value))}
                  className="mt-2 w-full disabled:opacity-40"
                  style={{ '--fill': `${((k - 2) / 3) * 100}%` } as CSSProperties}
                  aria-label="Número de estações a abrir"
                />
              </label>

              <label className="block">
                <div className="flex justify-between font-mono text-xs text-mist-300">
                  <span>q · risco de falha de uma estação</span>
                  <span className="text-solar-300">{Math.round(q * 100)}%</span>
                </div>
                <input
                  type="range" min={0.05} max={0.4} step={0.05} value={q} disabled={running}
                  onChange={(e) => changeQ(Number(e.target.value))}
                  className="mt-2 w-full disabled:opacity-40"
                  style={{ '--fill': `${((q - 0.05) / 0.35) * 100}%` } as React.CSSProperties}
                  aria-label="Probabilidade de falha de uma estação"
                />
              </label>

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-mist-300">proteção com backup (RAP)</span>
                <button
                  role="switch"
                  aria-checked={protection}
                  disabled={running}
                  onClick={() => changeProtection(!protection)}
                  className={`relative h-6 w-11 border transition-colors disabled:opacity-40 ${protection ? 'border-qubit-400 bg-qubit-500/70' : 'border-line bg-ink-700'}`}
                >
                  <span
                    className={`absolute top-[3px] h-[16px] w-[16px] bg-mist-100 transition-all ${protection ? 'left-[24px]' : 'left-[3px]'}`}
                  />
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={run}
                disabled={running}
                className="group flex w-full items-center justify-center gap-2.5 bg-qubit-500 px-4 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink-950 transition hover:bg-qubit-400 hover:shadow-[0_0_34px_rgba(79,216,232,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true" className={running ? 'animate-pulse' : 'transition group-hover:translate-x-0.5'}>
                  <path d="M0 0 L12 6.5 L0 13 Z" fill="currentColor" />
                </svg>
                {running ? `annealing… T = ${temperature !== null ? temperature.toFixed(0) : ''}` : 'executar otimização quântica'}
              </button>
              <div className="flex gap-2.5">
                <button
                  onClick={simulateFailure}
                  disabled={running}
                  className="flex-1 border border-solar-400/60 px-3 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-solar-300 transition hover:bg-solar-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ⌁ simular falha
                </button>
                {failed.length > 0 && (
                  <button
                    onClick={restore}
                    className="flex-1 border border-line px-3 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-mist-300 transition hover:border-mist-700 hover:text-mist-100"
                  >
                    ↺ restaurar rede
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* annealing */}
          <div className="border border-line bg-ink-850 p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-500">curva de energia</p>
              <p className="font-mono text-[11px] text-mist-500" aria-live="polite">
                {running ? (
                  <span className="text-qubit-300">iter {replayIter}/{resultRef.current?.iters}</span>
                ) : resultRef.current ? (
                  <span className="text-moss-400">concluído ✓</span>
                ) : (
                  'ocioso'
                )}
              </p>
            </div>
            <div className="mt-3">
              <EnergyChart
                history={resultRef.current ? resultRef.current.history.slice(0, Math.max(2, replayIter + (running || view === 'quantum' ? 1 : 0))) : []}
                tunnels={resultRef.current?.tunnels ?? []}
                iters={resultRef.current?.iters ?? 680}
              />
            </div>
            <div className="mt-3 max-h-32 space-y-1 overflow-hidden border-t border-line pt-2.5">
              {log.slice(-6).map((l) => (
                <p
                  key={l.id}
                  className={`truncate font-mono text-[11px] leading-relaxed ${
                    l.tone === 'good' ? 'text-qubit-300' : l.tone === 'tunnel' ? 'text-coral-300' : 'text-mist-500'
                  }`}
                >
                  <span className="mr-1.5 opacity-50">»</span>
                  {l.text}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* estatísticas da busca */}
      <div className="mt-6 grid grid-cols-1 divide-y divide-line border border-line bg-ink-900/70 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[
          ['espaço de busca', formatBig(space), 'combinações possíveis de rede'],
          ['estados avaliados', resultRef.current ? String(resultRef.current.evaluated) : '—', running ? 'buscando…' : 'pelo annealing'],
          ['melhor custo encontrado', qBest ? formatBRL(qBest.total) : formatBRL(manualSol.total), qBest ? 'solução quântica' : 'solução manual'],
        ].map(([label, value, sub]) => (
          <div key={label} className="px-6 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mist-500">{label}</p>
            <p className="mt-1.5 font-display text-2xl font-extrabold text-mist-100">{value}</p>
            <p className="mt-0.5 font-mono text-[10px] text-mist-700">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
