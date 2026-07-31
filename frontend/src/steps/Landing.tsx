type Props = {
  onStart: () => void;
  onContinue: () => void;
  hasDraft: boolean;
};

export function Landing({ onStart, onContinue, hasDraft }: Props) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="brand-mark">Northline</p>
        <h1>Applications that move with you</h1>
        <p className="lede">
          Complete your rental application, upload supporting documents, and invite
          co-applicants — all in one secure flow.
        </p>
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={onStart}>
            Start application
          </button>
          {hasDraft ? (
            <button type="button" className="btn ghost" onClick={onContinue}>
              Continue draft
            </button>
          ) : null}
        </div>
      </div>
      <div className="hero-visual" aria-hidden>
        <div className="hero-plane" />
        <div className="hero-grain" />
      </div>
    </section>
  );
}
