import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useRef,
  createElement,
  type ReactNode,
} from "react";
import { useData } from "../../state/DataContext";
import { useAuth } from "../../state/AuthContext";
import { emptyPortfolioData } from "./model";
import { loadPortfolio, portfolioEvent } from "./service";
function usePortfolioState() {
  const auth = useAuth(),
    repo = useData(),
    epoch = useRef(0);
  const [data, setData] = useState(emptyPortfolioData),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const current = ++epoch.current;
    try {
      if (!auth.id) return;
      const result = await loadPortfolio(
        auth.demo,
        auth.id,
        auth.role === "estudante",
      );
      if (current !== epoch.current) return;
      setData(result);
      setError("");
    } catch (e) {
      if (current !== epoch.current) return;
      setError(
        e instanceof Error ? e.message : "Não foi possível carregar o perfil.",
      );
    } finally {
      if (current === epoch.current) setLoading(false);
    }
  }, [auth.id, auth.demo, auth.role]);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) void reload();
    };
    refresh();
    window.addEventListener(portfolioEvent, refresh);
    return () => {
      active = false;
      epoch.current++;
      window.removeEventListener(portfolioEvent, refresh);
    };
  }, [
    reload,
    repo.data.progress,
    repo.data.attempts,
    repo.data.projects,
    repo.data.track_enrollments,
  ]);
  return { data, error, loading, reload };
}

const PortfolioContext = createContext<ReturnType<
  typeof usePortfolioState
> | null>(null);
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const value = usePortfolioState();
  return createElement(PortfolioContext.Provider, { value }, children);
}
export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw Error("PortfolioProvider ausente");
  return value;
}
