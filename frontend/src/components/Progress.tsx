import { STEPS } from "../types/application";

type Props = {
  current: number;
};

export function Progress({ current }: Props) {
  const formSteps = STEPS.slice(1);
  const active = Math.max(0, current - 1);

  return (
    <div className="progress" aria-label="Application progress">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${(active / Math.max(formSteps.length - 1, 1)) * 100}%` }}
        />
      </div>
      <ol className="progress-steps">
        {formSteps.map((step, index) => (
          <li
            key={step.id}
            className={
              index < active ? "done" : index === active ? "current" : "upcoming"
            }
          >
            <span className="dot" aria-hidden />
            <span className="label">{step.title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
