import { useEffect, useState, type ReactNode } from "react";
import Loader from "./ui/loader-15";

type SplashPhase = "visible" | "leaving" | "hidden";
const SPLASH_SHOWN_KEY = "skillup.startup-splash-shown";

function initialPhase(): SplashPhase {
  try {
    if (sessionStorage.getItem(SPLASH_SHOWN_KEY)) return "hidden";
    sessionStorage.setItem(SPLASH_SHOWN_KEY, "true");
  } catch {
    // The animation still works when browser storage is unavailable.
  }
  return "visible";
}

export function StartupSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>(initialPhase);

  useEffect(() => {
    if (phase === "hidden") return;
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealDelay = reducedMotion ? 150 : 1450;
    const leaveDuration = reducedMotion ? 0 : 400;
    const revealTimer = window.setTimeout(
      () => setPhase("leaving"),
      revealDelay,
    );
    const finishTimer = window.setTimeout(
      () => setPhase("hidden"),
      revealDelay + leaveDuration,
    );

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
    };
  }, []);

  if (phase === "hidden") return children;

  return (
    <div
      className={`startup-splash ${phase === "leaving" ? "is-leaving" : ""}`}
      role="status"
      aria-label="Preparando o SkillUp"
    >
      <div className="startup-logo-stage">
        <Loader />
        <div className="startup-logo-frame">
          <img src="/assets/skillup-logo.png" alt="" />
        </div>
      </div>
      <p className="startup-name">SkillUp</p>
      <p className="startup-message">Preparando seu espaço de aprendizagem…</p>
    </div>
  );
}
