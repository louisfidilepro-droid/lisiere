"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { CartItem } from "@/lib/types";

export interface NowPlaying { id: string; title: string; meta: string; coverUrl: string | null; previewUrl: string | null; }

interface Store {
  // player
  now: NowPlaying | null; isPlaying: boolean;
  play: (n: NowPlaying) => void; togglePlay: () => void;
  // cart
  items: CartItem[]; addItem: (i: CartItem) => void; removeItem: (idx: number) => void; clear: () => void;
  cartOpen: boolean; setCartOpen: (v: boolean) => void;
  // suno generator
  genOpen: boolean; setGenOpen: (v: boolean) => void;
}
const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("lisiere_cart"); if (s) setItems(JSON.parse(s)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("lisiere_cart", JSON.stringify(items)); } catch {}
  }, [items]);

  const play = useCallback((n: NowPlaying) => {
    setNow(prev => (prev && prev.id === n.id) ? prev : n);
    setIsPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setIsPlaying(p => !p), []);
  const addItem = useCallback((i: CartItem) => { setItems(prev => [...prev, i]); setCartOpen(true); }, []);
  const removeItem = useCallback((idx: number) => setItems(prev => prev.filter((_, k) => k !== idx)), []);
  const clear = useCallback(() => setItems([]), []);

  return (
    <Ctx.Provider value={{ now, isPlaying, play, togglePlay, items, addItem, removeItem, clear, cartOpen, setCartOpen, genOpen, setGenOpen }}>
      {children}
    </Ctx.Provider>
  );
}
