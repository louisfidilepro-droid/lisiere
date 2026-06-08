"use client";
import Link from "next/link";
import { useStore } from "@/app/store";

export default function Nav() {
  const { items, setCartOpen, setGenOpen } = useStore();
  return (
    <header className="nav">
      <div className="nav-in">
        <Link href="/" className="brand">LISI<b>È</b>RE</Link>
        <div className="nav-actions">
          <button className="nav-tool" onClick={() => setGenOpen(true)} aria-label="Ouvrir le studio de prompts Suno">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 2l2.2 6.6L21 9l-5.5 4 2 7-5.5-4.2L6.5 20l2-7L3 9l6.8-.4z" fill="currentColor"/></svg>
            <span>Studio</span>
          </button>
          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            Cart <span className="cart-count">{items.length}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
