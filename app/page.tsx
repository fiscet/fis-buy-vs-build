import Image from 'next/image';

import BuyVsBuild from './components/BuyVsBuild';

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
      {/* Hero */}
      <header className="flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Sviluppa o Compra — Guida alla scelta del software per PMI e startup"
          width={180}
          height={180}
          priority
          className="h-36 w-36 sm:h-44 sm:w-44"
        />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">
          Sviluppa o Compra?
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Descrivi un processo che vuoi digitalizzare. Ti mostriamo un confronto
          neutro tra comprare una soluzione pronta e costruirne una su misura —
          costi, tempi, aderenza al processo, lock-in e altro — con un
          orientamento finale tarato sul tuo caso.
        </p>
      </header>

      {/* Tool */}
      <section className="mt-12 rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-10">
        <BuyVsBuild />
      </section>
    </main>
  );
}
