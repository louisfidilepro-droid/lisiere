"use client";
import Link from "next/link";
import { useStore } from "@/app/store";

export default function Nav() {
  const { items, setCartOpen } = useStore();
  return (
    <header className="nav">
      <div className="nav-in">
        <Link href="/" className="brand">LISI<b>È</b>RE</Link>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          Cart <span className="cart-count">{items.length}</span>
        </button>
      </div>
    </header>
  );
}
