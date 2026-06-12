// Sober editorial intro — premium, no oversized wordmark. Server component.
export default function Hero() {
  return (
    <section className="intro wrap">
      <div className="intro-orb" />
      <div className="intro-in reveal in">
        <span className="intro-mark">L I S I È R E</span>
        <h1 className="intro-line">Instrumentaux pour les <em className="text-violet">heures entre deux</em>.</h1>
        <p className="intro-sub">Beats, loop kits &amp; samples — sombres, mélancoliques, cosmiques. Écoute, licencie, possède.</p>
        <a href="#catalog" className="intro-cta">Explorer le catalogue<span className="intro-arrow">↓</span></a>
      </div>
    </section>
  );
}
