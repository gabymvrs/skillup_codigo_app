import { Component, type ErrorInfo, type ReactNode } from "react";

type State = { failed: boolean };

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SkillUp render error", error, info.componentStack);
  }

  private recover = async () => {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("skillup-"))
          .map((key) => caches.delete(key)),
      );
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.update()),
      );
    }
    window.location.reload();
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="app-error" role="alert">
        <img src="/assets/skillup-logo.png" alt="" />
        <h1>Não foi possível abrir o SkillUp</h1>
        <p>Um arquivo antigo pode ter ficado salvo no navegador.</p>
        <button className="button primary" type="button" onClick={this.recover}>
          Limpar cache e tentar novamente
        </button>
      </main>
    );
  }
}
