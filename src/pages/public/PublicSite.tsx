import { useEffect, useState } from "react";
import { CarFront, Menu, X } from "lucide-react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { AboutPage, ContactPage, Home, Inventory, VehicleDetail } from "./PublicPages";
import { imageUrl } from "../../app/api";
import type { Store } from "../../app/types";

const currentYear = new Date().getFullYear();

export default function PublicSite({ store }: { store: Store }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const pageTitles: Record<string, string> = {
      "/": store.name,
      "/estoque": `Estoque | ${store.name}`,
      "/sobre": `Sobre a loja | ${store.name}`,
      "/contato": `Contato | ${store.name}`,
    };
    document.title = pageTitles[location.pathname] ?? `Veículo | ${store.name}`;
  }, [location.pathname, store.name]);

  return (
    <div className="site" style={{
      "--primary": store.theme.primary,
      "--secondary": store.theme.secondary,
      "--header-bg": store.theme.header,
      "--site-bg": store.theme.background,
      "--text-color": store.theme.text,
      "--footer-bg": store.theme.footer,
      "--footer-text": store.theme.footer_text,
      "--footer-accent": store.theme.footer_accent,
    } as React.CSSProperties}>
      <header className="site-header">
        <Link className="brand" to="/">
          {store.logo_path ? <img className="brand-logo" src={imageUrl(store.logo_path)} alt={store.name} /> : <span className="brand-symbol"><CarFront size={21} /></span>}
          <span>{store.name}</span>
        </Link>
        <button className="menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "open" : ""} onClick={() => setMenuOpen(false)}>
          <Link to="/">Início</Link><Link to="/estoque">Estoque</Link><Link to="/sobre">Sobre a loja</Link><Link to="/contato">Contato</Link>
        </nav>
      </header>
      <main><Routes><Route path="/" element={<Home store={store} />} /><Route path="/estoque" element={<Inventory />} /><Route path="/veiculos/:slug" element={<VehicleDetail store={store} />} /><Route path="/sobre" element={<AboutPage store={store} />} /><Route path="/contato" element={<ContactPage />} /></Routes></main>
      <footer className="site-footer"><div><strong>{store.name}</strong><p>{store.description}</p></div><div><p>Atendimento comercial</p><a href="tel:+5500000000000">(00) 0000-0000</a></div><div><p>© {currentYear} {store.name}</p><p>Site demonstrativo</p></div></footer>
    </div>
  );
}
