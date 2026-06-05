import BuyVsBuild from "./components/BuyVsBuild";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Compra o Costruisci?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          Descrivi un processo che vuoi digitalizzare. Ti mostriamo un confronto neutro tra
          comprare una soluzione pronta e costruirne una su misura — costi, tempi, aderenza al
          processo, lock-in e altro — con un orientamento finale tarato sul tuo caso.
        </p>
      </header>

      <BuyVsBuild />
    </main>
  );
}
