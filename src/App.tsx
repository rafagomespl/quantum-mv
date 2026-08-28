import { useMemo } from 'react';
import Lab from './components/Lab';
import Explain from './components/Explain';
import Marquee from './components/Marquee';
import Scramble from './components/Scramble';
import { useReducedMotion } from './lib/hooks';

/* ---------- fundo ambiente em camadas ---------- */

function BackgroundLayers() {
  const reduced = useReducedMotion();

  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        left: `${(i * 53 + 11) % 100}%`,
        top: `${(i * 37 + 7) % 100}%`,
        size: 2 + (i % 3),
        delay: `${(i % 9) * 0.9}s`,
        dur: `${7 + (i % 5) * 2}s`,
        warm: i % 4 === 0,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950" aria-hidden="true">
      <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(79,216,232,0.10),transparent_65%)]" />
      <div className="absolute -bottom-52 -right-40 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(255,180,84,0.07),transparent_65%)]" />
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(34,188,207,0.05),transparent_70%)]" />
      <div className="bg-blueprint absolute inset-0" />
      {!reduced &&
        particles.map((p, i) => (
          <span
            key={i}
            className={`particle ${p.warm ? 'warm' : ''}`}
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          />
        ))}
      <div className="noise-layer absolute inset-0" />
    </div>
  );
}

/* ---------- logotipo ---------- */

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
      <g fill="none" stroke="#4fd8e8" strokeWidth="1.2" opacity="0.85">
        <ellipse cx="13" cy="13" rx="11" ry="4.4" />
        <ellipse cx="13" cy="13" rx="11" ry="4.4" transform="rotate(60 13 13)" />
        <ellipse cx="13" cy="13" rx="11" ry="4.4" transform="rotate(120 13 13)" />
      </g>
      <circle cx="13" cy="13" r="2.4" fill="#ffb454" />
    </svg>
  );
}

/* ---------- átomo decorativo da abertura ---------- */

function Atom() {
  return (
    <svg viewBox="0 0 320 320" className="mx-auto w-full max-w-[340px]" aria-hidden="true">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(79,216,232,0.55)" />
          <stop offset="100%" stopColor="rgba(79,216,232,0)" />
        </radialGradient>
      </defs>
      <circle cx="160" cy="160" r="72" fill="url(#coreGlow)" />
      <g className="atom-ring-a" fill="none" stroke="#4fd8e8" strokeWidth="1.3" opacity="0.75">
        <ellipse cx="160" cy="160" rx="132" ry="46" />
        <circle cx="292" cy="160" r="5" fill="#4fd8e8" stroke="none" />
      </g>
      <g className="atom-ring-b" fill="none" stroke="#ffb454" strokeWidth="1.2" opacity="0.6">
        <ellipse cx="160" cy="160" rx="132" ry="46" transform="rotate(60 160 160)" />
        <circle cx="226" cy="274" r="4.4" fill="#ffb454" stroke="none" />
      </g>
      <g className="atom-ring-c" fill="none" stroke="#7f97ad" strokeWidth="1" opacity="0.45">
        <ellipse cx="160" cy="160" rx="132" ry="46" transform="rotate(120 160 160)" />
        <circle cx="94" cy="274" r="3.6" fill="#b8cbdd" stroke="none" />
      </g>
      <circle className="atom-core" cx="160" cy="160" r="13" fill="#0e1a2c" stroke="#8beef7" strokeWidth="2" />
      <circle cx="160" cy="160" r="4.5" fill="#8beef7" />
    </svg>
  );
}

/* ---------- app ---------- */

const NAV = [
  ['#laboratorio', 'laboratório'],
  ['#guia', 'guia rápido'],
  ['#glossario', 'glossário'],
  ['#aplicacoes', 'aplicações'],
];

const APPLICATIONS = [
  'roteamento de frotas',
  'escalonamento de tripulações',
  'despacho de energia elétrica',
  'montagem de carteiras',
  'alocação de antenas 5G',
  'corte de chapas industriais',
  'planejamento de entregas',
  'dobramento de proteínas',
];

export default function App() {
  return (
    <div className="min-h-screen font-body text-mist-100 antialiased">
      <BackgroundLayers />

      {/* cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
          <a href="#topo" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-lg font-extrabold tracking-tight">
              qubit<span className="text-qubit-400">·</span>lab
            </span>
          </a>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Seções">
            {NAV.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-500 transition hover:text-qubit-300"
              >
                {label}
              </a>
            ))}
          </nav>
          <span className="flex items-center gap-2 border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-mist-500">
            <span className="h-1.5 w-1.5 rounded-full bg-moss-400 shadow-[0_0_8px_rgba(111,227,165,0.9)]" />
            simulador on-line
          </span>
        </div>
      </header>

      <main id="topo">
        {/* abertura */}
        <section className="relative mx-auto w-full max-w-6xl px-5 pb-16 pt-14 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-qubit-400">
                laboratório educativo · sem pré-requisitos
              </p>
              <h1 className="mt-4 font-display text-[40px] font-extrabold leading-[1.04] tracking-tight sm:text-6xl xl:text-[68px]">
                <Scramble text="OTIMIZAÇÃO" />
                <br />
                <Scramble text="QUÂNTICA," delay={350} />
                <br />
                <span className="text-qubit-400">
                  <Scramble text="NA PRÁTICA." delay={750} />
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-mist-300 sm:text-lg">
                Um playground para quem nunca viu um qubit: monte uma rede de distribuição para uma cidade, deixe a
                busca quântica otimizá-la e derrube estações para ver a resiliência funcionar — tudo explicado em
                português claro.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-2.5">
                {['RAP · alocação confiável', '10 estações · 12 clientes', 'annealing no navegador'].map((chip) => (
                  <span
                    key={chip}
                    className="border border-line bg-ink-900/70 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-mist-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <a
                href="#laboratorio"
                className="group mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-solar-300 transition hover:text-solar-400"
              >
                descer para o laboratório
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="transition-transform group-hover:translate-y-1">
                  <path d="M7 0 V11 M2.5 7 L7 11.5 L11.5 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
            <div>
              <Atom />
              <p className="mx-auto mt-4 max-w-[300px] text-center font-mono text-[10px] uppercase leading-relaxed tracking-[0.2em] text-mist-700">
                superposição · emaranhamento · tunelamento
              </p>
            </div>
          </div>
        </section>

        <Lab />
        <Explain />

        {/* aplicações */}
        <section id="aplicacoes" className="scroll-mt-24 pb-24">
          <div className="mx-auto mb-6 w-full max-w-6xl px-5">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-qubit-400">04 · no mundo real</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-mist-100 sm:text-4xl">
              Onde isso já está sendo <span className="text-qubit-400">testado</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-300">
              O mesmo tipo de busca — escolher a melhor combinação entre bilhões — aparece em indústrias inteiras.
            </p>
          </div>
          <Marquee items={APPLICATIONS} />
        </section>
      </main>

      {/* rodapé */}
      <footer className="border-t border-line/80 bg-ink-900/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-lg font-extrabold">
                qubit<span className="text-qubit-400">·</span>lab
              </span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-mist-500">
              Ferramenta educativa. O “quantum annealing” daqui roda no seu navegador com{' '}
              <em>simulated annealing</em> — a técnica clássica inspirada nas máquinas quânticas de annealing
              (como as da D-Wave) e em algoritmos híbridos como o QAOA. Modelo e números são didáticos.
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-mist-500">feito com</p>
            <p className="mt-2 font-mono text-xs leading-relaxed text-mist-700">
              react · typescript · svg
              <br />
              p-mediana confiável (RAP)
              <br />
              <span className="text-qubit-700">nenhum qubit real foi resfriado a 15 mK</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
