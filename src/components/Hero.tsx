"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const secRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    const sec = secRef.current; if (!sec) return;
    let tx=0,ty=0,x=0,y=0,raf=0;
    const onMove=(e:MouseEvent)=>{const r=sec.getBoundingClientRect();tx=(e.clientX-r.width/2)/r.width;ty=(e.clientY-r.height/2)/r.height;};
    const onLeave=()=>{tx=0;ty=0;};
    const loop=()=>{x+=(tx-x)*.06;y+=(ty-y)*.06;
      if(orbRef.current)orbRef.current.style.transform=`translate(calc(-50% + ${x*120}px),calc(-50% + ${y*110}px))`;
      if(titleRef.current)titleRef.current.style.transform=`translate(${x*-26}px,${y*-18}px)`;
      raf=requestAnimationFrame(loop);};
    sec.addEventListener("mousemove",onMove);sec.addEventListener("mouseleave",onLeave);loop();
    return()=>{cancelAnimationFrame(raf);sec.removeEventListener("mousemove",onMove);sec.removeEventListener("mouseleave",onLeave);};
  }, []);
  return (
    <section className="hero wrap" ref={secRef}>
      <div className="hero-orb" ref={orbRef} />
      <h1 className="hero-title reveal in" ref={titleRef}>Lisi<em className="text-violet">è</em>re</h1>
      <p className="hero-sub reveal in">Instrumentals for the in-between hours.</p>
      <a href="#catalog" className="scroll-hint">Scroll<span /></a>
    </section>
  );
}
