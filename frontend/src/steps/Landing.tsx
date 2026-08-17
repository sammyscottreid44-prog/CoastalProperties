import { brand } from "../lib/brand";

type Props = {
  onStart: () => void;
  onContinue: () => void;
  hasDraft: boolean;
};

export function Landing({ onStart, onContinue, hasDraft }: Props) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="brand-mark">{brand.productName}</p>
        <p className="brand-legal">{brand.legalName}</p>
        <h1>Apply for commercial property with confidence</h1>
        <p className="lede">
          Complete your application, upload supporting documents, and invite
          co-applicants — built for {brand.legalName}.
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
        <p className="abn-line">ABN {brand.abn}</p>
      </div>
      <div className="hero-visual" aria-hidden>
        <div className="hero-plane" />
        <div className="hero-grain" />
      </div>
    </section>
  );
}
