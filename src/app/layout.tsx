import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "./store";
import Chrome from "@/components/Chrome";
import Nav from "@/components/Nav";
import Player from "@/components/Player";
import Cart from "@/components/Cart";
import PromptTool from "@/components/PromptTool";

export const metadata: Metadata = {
  title: "Lisière — Instrumentals",
  description: "A personal beat store. Dark, melancholic, cosmic instrumentals. Listen, license, own.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <StoreProvider>
          <div className="aura a1" /><div className="aura a2" /><div className="aura a3" />
          <Chrome />
          <Nav />
          {children}
          <Player />
          <Cart />
          <PromptTool />
        </StoreProvider>
      </body>
    </html>
  );
}
