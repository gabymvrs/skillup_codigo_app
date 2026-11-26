import { useEffect, useState, type ReactNode } from "react";

type SplashPhase = "visible" | "leaving" | "hidden";

export function StartupSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>("visible");

  useEffect(() => {
    let revealTimer = 0;
    let finishTimer = 0;

    const play = () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
      setPhase("visible");

      const reducedMotion = window.matchMedia?.(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const revealDelay = reducedMotion ? 150 : 1450;
      const leaveDuration = reducedMotion ? 0 : 400;
      revealTimer = window.setTimeout(
        () => setPhase("leaving"),
        revealDelay,
      );
      finishTimer = window.setTimeout(
        () => setPhase("hidden"),
        revealDelay + leaveDuration,
      );
    };

    play();
    window.addEventListener("skillup:session-started", play);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("skillup:session-started", play);
    };
  }, []);

  if (phase === "hidden") return children;

  return (
    <div
      className={`startup-splash ${phase === "leaving" ? "is-leaving" : ""}`}
      role="status"
      aria-label="Preparando o SkillUp"
    >
      <div className="startup-path" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="startup-logo-frame">
        <img src="/assets/skillup-logo.png" alt="" />
      </div>
      <p className="startup-name">SkillUp</p>
      <p className="startup-message">Preparando seu espaço de aprendizagem…</p>
    </div>
  );
}
