import { useEffect, useState } from 'react';
import { useReducedMotion } from '../lib/hooks';

const GLYPHS = '▚▞▙▟#%&@+=*<>◢◣';

interface ScrambleProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

/** título que se "decodifica" caractere a caractere, como um sinal quântico colapsando */
export default function Scramble({ text, className = '', delay = 0, duration = 1100 }: ScrambleProps) {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(() => (reduced ? text : ''));
  const [done, setDone] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setOut(text);
      setDone(true);
      return;
    }
    let frame = 0;
    let raf = 0;
    let start = 0;
    const chars = text.split('');

    const tick = (t: number) => {
      if (!start) start = t;
      const elapsed = t - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(1, elapsed / duration);
      const revealed = Math.floor(progress * chars.length);
      frame++;
      const next = chars
        .map((ch, i) => {
          if (ch === ' ' || ch === '\n') return ch;
          if (i < revealed) return ch;
          return GLYPHS[(frame * 7 + i * 3) % GLYPHS.length];
        })
        .join('');
      setOut(next);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setOut(text);
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, duration, reduced]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">
        {out}
        {!done && <span className="scramble-caret text-qubit-400">▌</span>}
      </span>
    </span>
  );
}
