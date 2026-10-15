import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard } from "lucide-react";
import { api } from "../../app/api";
import type { AuthUser, PlatformStore } from "../../app/types";

export function GlobalPermissionGuard({ token, children }: { token: string; children: React.ReactNode }) {
  const user = useQuery({ queryKey: ["auth-user"], queryFn: () => api<{ user: AuthUser }>("/auth/me", {}, token) });
  if (user.isPending) return <main className="admin-shell"><div className="state page-state">Validando permissões...</div></main>;
  if (user.isError) return <main className="admin-shell"><div className="state page-state state-error">Não foi possível validar suas permissões.</div></main>;
  if (user.data?.user.global_role !== "platform_admin") return <main className="admin-shell"><div className="state page-state"><div><h1>Acesso não autorizado</h1><p>Seu usuário não possui permissão para acessar o painel geral.</p><a className="button button-primary" href="/painel">Voltar ao painel da loja</a></div></div></main>;
  return children;
}

export function GlobalStores({ token }: { token: string }) {
  const stores = useQuery({ queryKey: ["platform-stores"], queryFn: () => api<{ data: PlatformStore[] }>("/platform/stores", {}, token) });
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><LayoutDashboard size={20} /> Administração global</div><a className="admin-logout" href="/painel">Painel da loja</a></header><section className="admin-content"><p className="eyebrow">PLATAFORMA</p><h1>Lojas e domínios</h1>{stores.isPending && <div className="state">Carregando lojas...</div>}{stores.isError && <div className="state state-error">Não foi possível carregar as lojas.</div>}<div className="global-store-list">{stores.data?.data.map((store) => <article className="global-store-card" key={store.id}><div className="global-store-main"><div className="store-avatar">{store.name[0]}</div><div><h2>{store.name}</h2><p>{store.slug} · {store.vehicles_count} veículo(s)</p><div className="domain-list">{store.domains.map((domain) => <span key={domain.domain}>{domain.domain}</span>)}</div></div></div></article>)}</div></section></main>;
}

export function GlobalCatalog({ token }: { token: string }) {
  const catalog = useQuery({ queryKey: ["platform-catalog"], queryFn: () => api<{ data: Array<{ id: number; name: string; models: Array<{ id: number; name: string }> }> }>("/public/catalog", {}, token) });
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><LayoutDashboard size={20} /> Catálogo de veículos</div><a className="admin-logout" href="/painel/global">Voltar</a></header><section className="admin-content"><p className="eyebrow">CATÁLOGO GLOBAL</p><h1>Marcas e modelos</h1>{catalog.isPending && <div className="state">Carregando catálogo...</div>}<div className="admin-table-wrap"><table className="admin-table"><tbody>{catalog.data?.data.flatMap((brand) => brand.models.map((model) => <tr key={model.id}><td>{model.name}</td><td>{brand.name}</td></tr>))}</tbody></table></div></section></main>;
}
