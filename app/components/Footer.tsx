import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/60">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-soft sm:flex-row">
        <p>&copy; {new Date().getFullYear()} Sviluppa o Compra</p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <Link
            href="/privacy"
            className="font-medium transition-colors hover:text-teal"
          >
            Privacy &amp; Cookie
          </Link>
          <a
            href="https://www.fiscet.it"
            target="_blank"
            rel="noopener"
            className="font-medium transition-colors hover:text-teal"
          >
            Created by <span className="text-teal">fiscet.it</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
