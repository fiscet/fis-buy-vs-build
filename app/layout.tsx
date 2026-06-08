import type { Metadata } from 'next';
import './globals.css';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'Sviluppa o Compra? | Guida alla scelta del software per PMI',
  description:
    'Descrivi un processo da digitalizzare e ottieni un confronto neutro tra comprare una soluzione pronta e costruirne una su misura.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
