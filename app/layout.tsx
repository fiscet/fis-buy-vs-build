import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compra o Costruisci? | Confronto per la tua azienda",
  description:
    "Descrivi un processo da digitalizzare e ottieni un confronto neutro tra comprare una soluzione pronta e costruirne una su misura.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
