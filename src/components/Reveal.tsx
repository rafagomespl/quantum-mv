import type { ReactNode } from 'react';
import { useInView } from '../lib/hooks';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/** wrapper de scroll-reveal com atraso escalonável */
export default function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'on' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
