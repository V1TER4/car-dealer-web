import type { Image } from "./types";

export const apiUrl =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1";
export const storeDomain =
  window.location.hostname === "painel.vehicle-platform-web"
    ? (import.meta.env.VITE_ADMIN_STORE_DOMAIN ?? "dev.vehicle-platform-web")
    : window.location.hostname;
export const adminTokenKey = "vehicle-platform.admin-token";

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "X-Store-Domain": storeDomain,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && token) {
    sessionStorage.removeItem(adminTokenKey);
    if (window.location.pathname.startsWith("/painel"))
      window.location.assign("/painel/login");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      errors?: Record<string, string[]>;
    } | null;
    const validation = payload?.errors
      ? Object.values(payload.errors).flat().join(" ")
      : "";
    throw new Error(
      validation || payload?.message || "Não foi possível concluir a operação.",
    );
  }
  return response.json() as Promise<T>;
}

export function imageUrl(path: Image["path"]) {
  return `${apiUrl.replace(/\/api\/v1$/, "")}/storage/${path}`;
}

export const money = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );

export const label = (value: string) =>
  value.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
