import { ReactNode } from 'react';

interface TerminalPanelProps {
  title: string;
  children: ReactNode;
  className?: string;
}

// The one structural unit every screen is built from: a bordered box with
// a title bar that reads like a form header stamped on a bureaucratic
// terminal ("=== PETITION QUEUE ==="), not a rounded SaaS card.
export function TerminalPanel({ title, children, className = '' }: TerminalPanelProps) {
  return (
    <div className={`border border-term-border bg-term-panel ${className}`}>
      <div className="border-b border-term-border px-4 py-2 text-xs tracking-widest text-term-greenDim">
        {'>>> '}
        {title.toUpperCase()}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
