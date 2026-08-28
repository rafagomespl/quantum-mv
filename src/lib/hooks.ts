import { useEffect, useRef, useState } from 'react';

/** respeita a preferência do usuário por menos movimento */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** anima um número em direção ao alvo (odômetro) */
export function useAnimatedNumber(target: number, duration = 650): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    if (reduced) {
      fromRef.current = target;
      setValue(target);
      return;
    }
    const from = fromRef.current;
    if (Math.abs(from - target) < 0.5) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (target - from) * eased;
      fromRef.current = v;
      setValue(v);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, reduced]);

  return value;
}

/** observa quando o elemento entra na viewport (para reveals) */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, inView };
}
