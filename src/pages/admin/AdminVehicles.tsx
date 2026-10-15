import { useState } from "react";
import { ChevronLeft, LayoutDashboard } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../app/api";

function VehicleForm({ token, id }: { token: string; id?: string }) {
  const navigate = useNavigate(); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const values = Object.fromEntries(new FormData(event.currentTarget)); try { await api(id ? `/admin/vehicles/${id}` : "/admin/vehicles", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }, token); navigate("/painel"); } catch (exception) { setError(exception instanceof Error ? exception.message : "Não foi possível salvar o veículo."); } }
  return <main className="admin-shell"><header className="admin-header"><div className="admin-brand"><LayoutDashboard size={20} /> {id ? "Editar veículo" : "Novo veículo"}</div><button className="admin-logout" onClick={() => navigate("/painel")}><ChevronLeft size={16} /> Voltar</button></header><section className="admin-content"><p className="eyebrow">ESTOQUE</p><h1>{id ? "Editar veículo" : "Cadastrar veículo"}</h1><form className="vehicle-admin-form" onSubmit={submit}><label>Marca<input name="brand" required /></label><label>Modelo<input name="model" required /></label><label>Versão<input name="version" /></label><label>Preço<input name="price" type="number" step="0.01" required /></label><label>Descrição<textarea name="description" rows={5} /></label>{error && <div className="form-error">{error}</div>}<button className="button button-primary" type="submit">Salvar veículo</button></form></section></main>;
}

export function AdminVehicleForm({ token }: { token: string }) { return <VehicleForm token={token} />; }
export function AdminVehicleEdit({ token }: { token: string }) { const { id } = useParams(); return <VehicleForm token={token} id={id} />; }
