import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="Informações institucionais">
      <span>SkillUp</span>
      <nav aria-label="Documentos legais">
        <Link to="/privacidade">Privacidade</Link>
        <Link to="/termos">Termos de Uso</Link>
        <Link to="/cookies">Cookies</Link>
        <Link to="/ajuda">Ajuda</Link>
      </nav>
    </footer>
  );
}
