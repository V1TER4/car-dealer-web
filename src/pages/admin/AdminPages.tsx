import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, storeDomain } from "../../app/api";
import type { Store } from "../../app/types";
import { AdminLogin } from "./AdminAuth";
import {
  AdminContacts,
  AdminDashboard,
  AdminHistory,
  AdminSettings,
  AdminUsers,
} from "./AdminStore";
import {
  GlobalCatalog,
  GlobalPermissionGuard,
  GlobalStores,
} from "./AdminGlobal";
import { AdminVehicleEdit, AdminVehicleForm } from "./AdminVehicles";

export function AdminApp({
  token,
  onLogin,
  onLogout,
}: {
  token: string | null;
  onLogin: (token: string) => void;
  onLogout: () => void;
}) {
  const location = useLocation();
  const adminStore = useQuery({
    queryKey: ["admin-title-store", storeDomain],
    queryFn: () => api<{ data: Store }>("/public/store", {}, token ?? undefined),
    enabled: Boolean(token),
  });
  useEffect(() => {
    if (location.pathname.startsWith("/painel/global")) {
      document.title = "Painel Geral";
    } else if (location.pathname === "/painel/login") {
      document.title = "Acesso | Painel";
    } else if (adminStore.data?.data.name) {
      document.title = `Painel Loja — ${adminStore.data.data.name}`;
    }
  }, [location.pathname, adminStore.data?.data.name]);

  const protectedRoute = (element: React.ReactNode) =>
    token ? element : <AdminLogin onLogin={onLogin} />;

  return (
    <Routes>
      <Route path="/painel/login" element={<AdminLogin onLogin={onLogin} />} />
      <Route path="/painel" element={protectedRoute(<AdminDashboard token={token ?? ""} onLogout={onLogout} />)} />
      <Route path="/painel/historico" element={protectedRoute(<AdminHistory token={token ?? ""} />)} />
      <Route path="/painel/contatos" element={protectedRoute(<AdminContacts token={token ?? ""} />)} />
      <Route path="/painel/configuracoes" element={protectedRoute(<AdminSettings token={token ?? ""} />)} />
      <Route path="/painel/usuarios" element={protectedRoute(<AdminUsers token={token ?? ""} />)} />
      <Route path="/painel/veiculos/novo" element={protectedRoute(<AdminVehicleForm token={token ?? ""} />)} />
      <Route path="/painel/veiculos/:id/editar" element={protectedRoute(<AdminVehicleEdit token={token ?? ""} />)} />
      <Route path="/painel/global" element={token ? <GlobalPermissionGuard token={token}><GlobalStores token={token} /></GlobalPermissionGuard> : <AdminLogin onLogin={onLogin} />} />
      <Route path="/painel/global/catalogo" element={token ? <GlobalPermissionGuard token={token}><GlobalCatalog token={token} /></GlobalPermissionGuard> : <AdminLogin onLogin={onLogin} />} />
      <Route path="/painel/*" element={protectedRoute(<AdminDashboard token={token ?? ""} onLogout={onLogout} />)} />
    </Routes>
  );
}
