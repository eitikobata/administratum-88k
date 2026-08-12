import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/petitioner', label: 'Petitioner Console' },
  { href: '/approver', label: 'Approver Console' },
];

export function NavBar() {
  return (
    <nav className="border-b border-term-border px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <span className="text-sm font-bold tracking-widest text-term-green">
          ADMINISTRATUM // 88K
        </span>
        <div className="flex gap-6 text-xs tracking-widest text-term-greenDim">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-term-green"
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
