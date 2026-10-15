import { useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminTokenKey, api } from "../../app/api";

export function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    try {
      const result = await api<{ token: string }>("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      sessionStorage.setItem(adminTokenKey, result.token); onLogin(result.token); navigate("/painel");
    } catch { setError("Não foi possível entrar. Verifique suas credenciais."); }
  }
  return <main className="admin-shell"><div className="admin-login"><div className="admin-brand"><LayoutDashboard size={22} /> Painel da loja</div><h1>Acesso administrativo</h1><p>Entre para gerenciar o estoque da loja.</p><form onSubmit={submit}><label>E-mail<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="form-error">{error}</div>}<button className="button button-primary" type="submit">Entrar</button></form></div></main>;
}
