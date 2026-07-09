import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bolão da Copa",
  description: "App familiar de palpites da Copa do Mundo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
