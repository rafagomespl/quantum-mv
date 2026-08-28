import type { ReactNode } from 'react';
import Reveal from './Reveal';

/** ilustração: paisagem de energia — bola clássica presa no vale raso vs. túnel quântico */
function Landscape() {
  return (
    <svg viewBox="0 0 360 224" className="w-full" role="img" aria-label="Ilustração: um algoritmo clássico fica preso no primeiro vale de custo, enquanto o quântico tunela até o vale mais profundo">
      <defs>
        <marker id="arrCyan" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 Z" fill="#4fd8e8" />
        </marker>
      </defs>

      <line x1="24" y1="14" x2="24" y2="196" stroke="#4e6579" strokeWidth="1" />
      <line x1="24" y1="196" x2="350" y2="196" stroke="#4e6579" strokeWidth="1" />
      <text x="30" y="26" fontSize="9.5" fill="#7f97ad" fontFamily="Space Mono, monospace">custo ↑</text>
      <text x="240" y="212" fontSize="9.5" fill="#7f97ad" fontFamily="Space Mono, monospace">configurações →</text>

      <path
        d="M 24 44 C 66 132, 92 152, 120 150 C 148 148, 160 84, 190 82 C 220 80, 236 170, 272 174 C 302 177, 322 152, 350 140"
        fill="none" stroke="#7f97ad" strokeWidth="2"
      />

      <circle cx="120" cy="143" r="7" fill="#ffb454" />
      <path d="M 128 136 Q 150 120 158 106" stroke="#ff6b7a" strokeWidth="1.6" fill="none" strokeDasharray="3 4" />
      <g stroke="#ff6b7a" strokeWidth="2" strokeLinecap="round">
        <line x1="154" y1="100" x2="162" y2="108" />
        <line x1="162" y1="100" x2="154" y2="108" />
      </g>
      <text x="44" y="120" fontSize="9.5" fill="#ff97a1" fontFamily="Space Mono, monospace">clássico: preso no</text>
      <text x="44" y="132" fontSize="9.5" fill="#ff97a1" fontFamily="Space Mono, monospace">primeiro vale</text>

      <path
        d="M 130 147 C 172 151, 224 159, 260 167"
        stroke="#4fd8e8" strokeWidth="2" fill="none" strokeDasharray="6 5"
        markerEnd="url(#arrCyan)" className="edge-backup"
      />
      <circle cx="272" cy="167" r="7" fill="none" stroke="#4fd8e8" strokeWidth="1.6" strokeDasharray="2 3" />
      <text x="150" y="184" fontSize="9.5" fill="#8beef7" fontFamily="Space Mono, monospace">quântico: tunela até</text>
      <text x="150" y="196" fontSize="9.5" fill="#8beef7" fontFamily="Space Mono, monospace">o vale mais fundo</text>
    </svg>
  );
}

interface Block {
  n: string;
  title: string;
  accent: string;
  body: ReactNode;
}

const BLOCKS: Block[] = [
  {
    n: '01',
    title: 'Do que se trata o problema?',
    accent: 'border-qubit-400',
    body: (
      <p>
        Você precisa abrir <strong className="text-mist-100">k estações de distribuição</strong> para atender 12 pontos
        essenciais de uma cidade — hospitais, escolas, mercados e bairros. O detalhe: cada ponto precisa de um{' '}
        <strong className="text-solar-400">plano B</strong>, uma segunda estação para o caso de a primeira falhar.
        Esse é o <strong className="text-mist-100">RAP</strong> (<em>Reliable Assignment Problem</em>), a versão com
        resiliência do clássico problema de localização de facilidades (p-mediana).
      </p>
    ),
  },
  {
    n: '02',
    title: 'Por que é tão difícil?',
    accent: 'border-solar-400',
    body: (
      <p>
        Com 10 estações candidatas e 12 pontos, o número de redes possíveis chega aos{' '}
        <strong className="text-mist-100">trilhões</strong> — e cada uma tem um custo diferente. Testar todas é
        impossível até para supercomputadores: é a famosa <em>explosão combinatória</em>. Por isso precisamos de
        buscas inteligentes que explorem bem o espaço sem visitar tudo.
      </p>
    ),
  },
  {
    n: '03',
    title: 'O que o computador quântico faz de diferente?',
    accent: 'border-qubit-400',
    body: (
      <>
        <p>
          Bits comuns são 0 <em>ou</em> 1. <strong className="text-qubit-300">Qubits</strong> podem estar em{' '}
          <strong className="text-mist-100">superposição</strong> — uma mistura de 0 e 1 — então um processador
          quântico explora muitas configurações ao mesmo tempo. E, graças ao{' '}
          <strong className="text-mist-100">tunelamento quântico</strong>, ele atravessa barreiras de custo em vez de
          escalá-las, escapando de vales rasos que prendem os algoritmos comuns (veja a paisagem ao lado).
        </p>
        <p className="mt-3 text-mist-500">
          O <em>annealing</em> deste laboratório começa “quente” (aceitando qualquer mudança) e esfria aos poucos,
          imitando esse processo físico.
        </p>
      </>
    ),
  },
  {
    n: '04',
    title: 'A conta do RAP',
    accent: 'border-solar-400',
    body: (
      <>
        <p>
          O otimizador minimiza uma soma simples de entender. <strong className="text-mist-100">q</strong> é a chance
          de uma estação falhar:
        </p>
        <pre className="mt-3 overflow-x-auto border border-line bg-ink-900 px-4 py-3 font-mono text-[12px] leading-relaxed text-qubit-300">
{`custo = Σ abertura das estações
      + Σ rotas primárias
      + q × Σ rotas de backup`}
        </pre>
        <p className="mt-3 text-mist-500">
          Aumente o risco q e execute de novo: a rede ideal muda, porque o backup passa a valer mais.
        </p>
      </>
    ),
  },
  {
    n: '05',
    title: 'E quando uma estação cai?',
    accent: 'border-qubit-400',
    body: (
      <p>
        Clique em <strong className="text-solar-300">“simular falha”</strong>. Com o RAP ligado, os pontos afetados
        migram para a rota de backup e a cidade segue funcionando —{' '}
        <strong className="text-moss-400">continuidade de 100%</strong>. Desligue a proteção no painel e repita:
        vários pontos saem do ar. Resiliência é um seguro que se paga antes, em parcelas pequenas — exatamente o
        termo <span className="font-mono text-solar-300">q × backup</span>.
      </p>
    ),
  },
];

const GLOSSARY: { term: string; def: string }[] = [
  { term: 'Qubit', def: 'A versão quântica do bit: pode ser 0, 1 ou uma mistura dos dois ao mesmo tempo (superposição).' },
  { term: 'Superposição', def: 'Capacidade de existir em vários estados simultaneamente. Ao medir, o qubit “colapsa” para um estado só.' },
  { term: 'Emaranhamento', def: 'Ligação quântica entre qubits: mexer em um afeta o outro na hora, permitindo buscas coordenadas.' },
  { term: 'Tunelamento', def: 'Efeito que deixa o sistema “atravessar” uma barreira de energia sem subir por ela — a chave para escapar de soluções ruins.' },
  { term: 'Annealing quântico', def: 'Técnica de otimização que começa em superposição e vai “esfriando” o sistema até uma configuração de custo baixo.' },
  { term: 'QAOA', def: 'Algoritmo híbrido (quântico + clássico) que alterna passos de custo e de mistura para se aproximar da melhor solução.' },
];

export default function Explain() {
  return (
    <>
      <section id="guia" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-24">
        <div className="grid gap-12 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* coluna fixa */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-qubit-400">02 · guia rápido</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-mist-100 sm:text-4xl">
                Quântica sem <span className="text-qubit-400">mistério</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist-300">
                Cinco explicações curtas para entender o que o laboratório acima está fazendo — sem fórmula assustadora,
                sem pré-requisito.
              </p>
              <div className="mt-6 border border-line bg-ink-850 p-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mist-500">
                  a paisagem de energia
                </p>
                <Landscape />
              </div>
            </Reveal>
          </div>

          {/* blocos de explicação */}
          <div className="space-y-10">
            {BLOCKS.map((b, i) => (
              <Reveal key={b.n} delay={i * 60}>
                <article className={`border-l-2 ${b.accent} pl-6`}>
                  <p className="font-mono text-xs text-mist-700">{b.n}</p>
                  <h3 className="mt-1 font-display text-xl font-bold text-mist-100 sm:text-2xl">{b.title}</h3>
                  <div className="mt-2.5 max-w-xl text-[15px] leading-relaxed text-mist-300">{b.body}</div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* glossário */}
      <section id="glossario" className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-24">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-qubit-400">03 · dicionário de bolso</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-mist-100 sm:text-4xl">
            Passe o mouse, <span className="text-solar-400">aprenda o jargão</span>
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-mist-300">
            Seis palavras que aparecem em qualquer conversa sobre otimização quântica — traduzidas para gente normal.
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap gap-3">
          {GLOSSARY.map((g, i) => (
            <Reveal key={g.term} delay={i * 50}>
              <button
                className="group relative border border-line bg-ink-850 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-mist-300 transition hover:border-qubit-500/70 hover:text-qubit-300 focus-visible:border-qubit-400 focus-visible:outline-none"
                aria-describedby={`gloss-${i}`}
              >
                {g.term}
                <span
                  id={`gloss-${i}`}
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 w-64 -translate-x-1/2 border border-line bg-ink-850 p-3 text-left font-body text-xs normal-case leading-relaxed tracking-normal text-mist-300 opacity-0 shadow-[0_14px_44px_rgba(0,0,0,0.55)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="mb-1 block font-display text-[13px] font-bold text-qubit-300">{g.term}</span>
                  {g.def}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
