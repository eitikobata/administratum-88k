'use client';

import { useEffect, useState } from 'react';

const BOOT_LINES = [
  'ADMINISTRATUM 88K MAINFRAME',
  'INITIALIZING VOX-LINK...',
  'ESTABLISHING CONNECTION TO CENTRAL ARCHIVE...',
  'LOADING PETITION QUEUE...',
  'CLEARANCE GRANTED.',
];

interface BootSequenceProps {
  onDone: () => void;
}

// The signature moment: before the dashboard shows real data, it types out
// a short boot log line by line, like an old terminal warming up. It only
// plays once per page load (not on every re-render) and finishes fast
// enough that it never feels like it's blocking the person from working.
export function BootSequence({ onDone }: BootSequenceProps) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) {
      const timeout = setTimeout(onDone, 300);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setVisibleLines((n) => n + 1), 220);
    return () => clearTimeout(timeout);
  }, [visibleLines, onDone]);

  return (
    <div className="flex min-h-[40vh] flex-col justify-center px-6 text-sm text-term-green">
      {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
        <div key={i}>
          {'> '}
          {line}
        </div>
      ))}
      <span className="animate-blink">_</span>
    </div>
  );
}
