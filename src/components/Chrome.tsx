"use client";
import { useEffect } from "react";

/** Custom cursor + scroll-reveal observer (resilient to client navigation) + nav solidify. */
export default function Chrome() {
  useEffect(() => {
    if (window.matchMedia("(hover:none)").matches) return;
    const cur = document.createElement("div"); cur.className = "cur";
    const dot = document.createElement("div"); dot.className = "cur-dot";
    document.body.append(cur, dot);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, raf = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; };
    const loop = () => { cx += (mx - cx) * .16; cy += (my - cy) * .16; cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`; raf = requestAnimationFrame(loop); };
    addEventListener("mousemove", onMove); loop();
    const over = (e: Event) => { const t = e.target as HTMLElement; if (t.closest("a,button,.card,.lic-tab")) cur.classList.add("big"); else cur.classList.remove("big"); };
    addEventListener("mouseover", over);
    return () => { cancelAnimationFrame(raf); removeEventListener("mousemove", onMove); removeEventListener("mouseover", over); cur.remove(); dot.remove(); };
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: .12 }
    );
    document.querySelectorAll(".reveal:not(.in)").forEach((el) => io.observe(el));
    // Re-scan on DOM changes (e.g. client-side navigation back to home): reveal anything
    // already in view immediately so beats never stay hidden, observe the rest.
    let rafId = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight * 0.92 && r.bottom > 0) el.classList.add("in");
          else io.observe(el);
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
    const nav = document.querySelector("header.nav");
    const onScroll = () => nav?.classList.toggle("solid", scrollY > 40);
    addEventListener("scroll", onScroll); onScroll();
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(rafId); removeEventListener("scroll", onScroll); };
  }, []);
  return null;
}
