import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Pencil,
  Phone,
  Search,
  X,
} from "lucide-react";
import { Link, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import "./App.css";

type Theme = {
  primary: string;
  secondary: string;
  header: string;
  background: string;
  text: string;
  footer: string;
  footer_text: string;
  footer_accent: string;
};
type Store = {
  name: string;
  slug: string;
  description: string | null;
  logo_path?: string | null;
  favicon_path?: string | null;
  theme: Theme;
};
type Feature = { name: string; category: string };
type Image = { path: string; is_primary: boolean };
type Vehicle = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  version: string | null;
  manufacture_year: number;
  model_year: number;
  mileage: number;
  transmission: string;
  fuel_type: string;
  color: string | null;
  doors: number | null;
  price: string;
  description: string | null;
  status?: string;
  sold_at?: string | null;
  images: Image[];
  features: Feature[];
};
type FeatureOption = { id: number; name: string; category: string };
type BrandOption = {
  id: number;
  name: string;
  models: Array<{ id: number; name: string }>;
};
type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

const apiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1";
const storeDomain =
  window.location.hostname === "painel.vehicle-platform-web"
    ? (import.meta.env.VITE_ADMIN_STORE_DOMAIN ?? "dev.vehicle-platform-web")
    : window.location.hostname;
const adminTokenKey = "vehicle-platform.admin-token";

async function api<T>(
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

const money = (value: string) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
const label = (value: string) =>
  value.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const image =
    vehicle.images?.find((item) => item.is_primary) ?? vehicle.images?.[0];
  return (
    <Link className="vehicle-card" to={`/veiculos/${vehicle.slug}`}>
      <div className="vehicle-photo">
        {image ? (
          <img
            src={imageUrl(image.path)}
            alt={`${vehicle.brand} ${vehicle.model}`}
            loading="lazy"
          />
        ) : (
          <>
            <CarFront size={42} strokeWidth={1.2} />
            <span>Foto em breve</span>
          </>
        )}
      </div>
      <div className="vehicle-card-body">
        <p className="eyebrow">{vehicle.brand}</p>
        <h3>
          {vehicle.model} {vehicle.version}
        </h3>
        <div className="vehicle-meta">
          <span>{vehicle.model_year}</span>
          <span>{vehicle.mileage.toLocaleString("pt-BR")} km</span>
          <span>{label(vehicle.transmission)}</span>
        </div>
        <strong>{money(vehicle.price)}</strong>
      </div>
    </Link>
  );
}

function imageUrl(path: string) {
  return `${apiUrl.replace(/\/api\/v1$/, "")}/storage/${path}`;
}

function Home({ store }: { store: Store }) {
  const vehicles = useQuery({
    queryKey: ["vehicles", store.slug],
    queryFn: () => api<Paginated<Vehicle>>("/public/vehicles?per_page=6"),
  });
  return (
    <>
      <section className="hero-section">
        <div>
          <p className="eyebrow">ESTOQUE SELECIONADO</p>
          <h1>Seu próximo carro está aqui.</h1>
          <p>Encontre veículos revisados e prontos para seguir com você.</p>
          <Link className="button button-primary" to="/estoque">
            Ver estoque <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-mark">
          <CarFront size={82} strokeWidth={1} />
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">OFERTAS DA LOJA</p>
            <h2>Veículos em destaque</h2>
          </div>
          <Link className="text-link" to="/estoque">
            Ver todo estoque <ArrowRight size={16} />
          </Link>
        </div>
        {vehicles.isPending && (
          <div className="state">Carregando estoque...</div>
        )}
        {vehicles.isError && (
          <div className="state state-error">
            Não foi possível carregar o estoque.
          </div>
        )}
        {vehicles.data && (
          <div className="vehicle-grid">
            {vehicles.data.data.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>
      <section className="contact-strip">
        <div>
          <p className="eyebrow">FALE COM A {store.name.toUpperCase()}</p>
          <h2>Quer saber mais sobre um veículo?</h2>
        </div>
        <a
          className="button button-light"
          href="https://wa.me/5500000000000"
          target="_blank"
          rel="noreferrer"
        >
          <Phone size={17} /> Falar pelo WhatsApp
        </a>
      </section>
    </>
  );
}

function Inventory() {
  const [search, setSearch] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const params = useMemo(() => {
    const query = new URLSearchParams({ page: String(page), per_page: "12" });
    if (search) query.set("search", search);
    if (transmission) query.set("transmission", transmission);
    if (fuel) query.set("fuel_type", fuel);
    if (minPrice) query.set("min_price", minPrice);
    if (maxPrice) query.set("max_price", maxPrice);
    return `?${query}`;
  }, [page, search, transmission, fuel, minPrice, maxPrice]);
  const vehicles = useQuery({
    queryKey: ["inventory", params],
    queryFn: () => api<Paginated<Vehicle>>(`/public/vehicles${params}`),
  });
  return (
    <section className="section inventory">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ESTOQUE</p>
          <h1>Escolha seu próximo veículo</h1>
        </div>
      </div>
      <div className="filter-bar">
        <div className="search-field">
          <Search size={18} />
          <input
            placeholder="Busque por marca ou modelo"
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
          />
        </div>
        <select
          value={transmission}
          onChange={(event) => {
            setPage(1);
            setTransmission(event.target.value);
          }}
        >
          <option value="">Todos os câmbios</option>
          <option value="manual">Manual</option>
          <option value="automatic">Automático</option>
          <option value="cvt">CVT</option>
        </select>
        <select
          value={fuel}
          onChange={(event) => {
            setPage(1);
            setFuel(event.target.value);
          }}
        >
          <option value="">Todos os combustíveis</option>
          <option value="flex">Flex</option>
          <option value="gasoline">Gasolina</option>
          <option value="electric">Elétrico</option>
          <option value="hybrid">Híbrido</option>
        </select>
        <input
          className="price-filter"
          type="number"
          placeholder="Preço mínimo"
          value={minPrice}
          onChange={(event) => {
            setPage(1);
            setMinPrice(event.target.value);
          }}
        />
        <input
          className="price-filter"
          type="number"
          placeholder="Preço máximo"
          value={maxPrice}
          onChange={(event) => {
            setPage(1);
            setMaxPrice(event.target.value);
          }}
        />
      </div>
      {vehicles.isPending && <div className="state">Carregando estoque...</div>}
      {vehicles.isError && (
        <div className="state state-error">
          Não foi possível carregar o estoque.
        </div>
      )}
      {vehicles.data && (
        <>
          <p className="result-count">
            {vehicles.data.total} veículo(s) encontrado(s)
          </p>
          <div className="vehicle-grid">
            {vehicles.data.data.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft size={17} /> Anterior
            </button>
            <span>
              Página {page} de {vehicles.data.last_page}
            </span>
            <button
              disabled={page >= vehicles.data.last_page}
              onClick={() => setPage((current) => current + 1)}
            >
              Próxima <ChevronRight size={17} />
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function VehicleDetail({ store }: { store: Store }) {
  const { slug } = useParams();
  const vehicle = useQuery({
    queryKey: ["vehicle", slug],
    queryFn: () => api<{ data: Vehicle }>(`/public/vehicles/${slug}`),
  });
  if (vehicle.isPending)
    return <div className="state page-state">Carregando veículo...</div>;
  if (vehicle.isError)
    return (
      <div className="state page-state state-error">
        Veículo não encontrado ou indisponível.
      </div>
    );
  const item = vehicle.data.data;
  useEffect(() => {
    document.title = `${item.brand} ${item.model} | ${store.name}`;
  }, [item.brand, item.model, store.name]);
  return (
    <section className="section detail">
      <Link className="back-link" to="/estoque">
        <ChevronLeft size={17} /> Voltar ao estoque
      </Link>
      <div className="detail-layout">
        <div className="detail-photo">
          <CarFront size={86} strokeWidth={1.1} />
          <span>Galeria de imagens</span>
        </div>
        <div>
          <p className="eyebrow">{item.brand}</p>
          <h1>
            {item.model} {item.version}
          </h1>
          <p className="detail-price">{money(item.price)}</p>
          <div className="spec-grid">
            <span>
              <b>Ano</b>
              {item.manufacture_year}/{item.model_year}
            </span>
            <span>
              <b>Quilometragem</b>
              {item.mileage.toLocaleString("pt-BR")} km
            </span>
            <span>
              <b>Câmbio</b>
              {label(item.transmission)}
            </span>
            <span>
              <b>Combustível</b>
              {label(item.fuel_type)}
            </span>
            <span>
              <b>Cor</b>
              {item.color ?? "Não informado"}
            </span>
            <span>
              <b>Portas</b>
              {item.doors ?? "Não informado"}
            </span>
          </div>
          <p className="detail-description">{item.description}</p>
          <a
            className="button button-primary"
            href={`https://wa.me/5500000000000?text=${encodeURIComponent(`Olá, tenho interesse no ${item.brand} ${item.model} ${item.version ?? ""}.`)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Phone size={17} /> Tenho interesse
          </a>
        </div>
      </div>
      {item.features.length > 0 && (
        <div className="features">
          <h2>Opcionais</h2>
          {item.features.map((feature) => (
            <span key={feature.name}>{feature.name}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function ContactPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api("/public/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      setSent(true);
      formElement.reset();
    } catch {
      setError("Não foi possível enviar sua mensagem. Tente novamente.");
    }
  }
  return (
    <section className="section contact-page">
      <p className="eyebrow">CONTATO</p>
      <h1>Fale com a loja</h1>
      <p className="contact-intro">
        Envie uma mensagem e a equipe comercial retornará em breve.
      </p>
      <form className="contact-form" onSubmit={submit}>
        <label>
          Nome
          <input name="name" required />
        </label>
        <label>
          E-mail
          <input name="email" type="email" required />
        </label>
        <label>
          Telefone
          <input name="phone" />
        </label>
        <label>
          Mensagem
          <textarea name="message" required minLength={10} rows={5} />
        </label>
        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="honeypot"
        />
        <button className="button button-primary" type="submit">
          Enviar mensagem
        </button>
        {sent && (
          <div className="form-success">Mensagem enviada com sucesso.</div>
        )}
        {error && <div className="form-error">{error}</div>}
      </form>
    </section>
  );
}

function AboutPage({ store }: { store: Store }) {
  return (
    <section className="section about-page">
      <p className="eyebrow">A LOJA</p>
      <h1>{store.name}</h1>
      <p className="about-copy">
        {store.description ??
          "Conheça nossa loja e fale com a equipe comercial para encontrar o veículo ideal."}
      </p>
      <Link className="button button-primary" to="/contato">
        Falar com a loja <ArrowRight size={17} />
      </Link>
    </section>
  );
}

function AdminLogin({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const result = await api<{ token: string }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log(result)
      sessionStorage.setItem(adminTokenKey, result.token);
      onLogin(result.token);
      navigate("/painel");
    } catch {
      setError("Não foi possível entrar. Verifique suas credenciais.");
    }
  }
  return (
    <main className="admin-shell">
      <div className="admin-login">
        <div className="admin-brand">
          <LayoutDashboard size={22} /> Painel da loja
        </div>
        <h1>Acesso administrativo</h1>
        <p>Entre para gerenciar o estoque da loja.</p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}

function SaleDateModal({
  vehicle,
  onCancel,
  onConfirm,
}: {
  vehicle: Vehicle;
  onCancel: () => void;
  onConfirm: (date: string) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div className="crop-backdrop">
      <div className="crop-modal sale-modal">
        <div className="modal-icon">
          <CalendarDays size={22} />
        </div>
        <h2>Registrar venda</h2>
        <p>
          {vehicle.brand} {vehicle.model} será movido para o histórico e deixará
          de aparecer no estoque público.
        </p>
        <label>
          Data da venda
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <div className="crop-actions">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => onConfirm(date)}
            disabled={!date}
          >
            Confirmar venda
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const vehicles = useQuery({
    queryKey: ["admin-vehicles", storeDomain],
    queryFn: () =>
      api<Paginated<Vehicle>>("/admin/vehicles?per_page=50", {}, token),
  });
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingSale, setPendingSale] = useState<Vehicle | null>(null);
  const list = vehicles.data?.data ?? [];
  const available = list.filter((item) => item.status === "available").length;
  const reserved = list.filter((item) => item.status === "reserved").length;
  const sold = list.filter((item) => item.status === "sold").length;
  const filtered = statusFilter
    ? list.filter((item) => item.status === statusFilter)
    : list;
  async function setStatus(vehicle: Vehicle, status: string, soldAt?: string) {
    await api(
      `/admin/vehicles/${vehicle.id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, sold_at: soldAt ?? null }),
      },
      token,
    );
    await vehicles.refetch();
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Painel da loja
        </div>
        <nav className="admin-nav">
          <button onClick={() => navigate("/painel")}>Veículos</button>
          <button onClick={() => navigate("/painel/historico")}>
            Histórico
          </button>
          <button onClick={() => navigate("/painel/usuarios")}>Usuários</button>
          <button onClick={() => navigate("/painel/configuracoes")}>
            Configurações
          </button>
          <button className="admin-logout" onClick={onLogout}>
            <LogOut size={16} /> Sair
          </button>
        </nav>
      </header>
      <section className="admin-content">
        <div className="admin-title">
          <div>
            <p className="eyebrow">GESTÃO DE ESTOQUE</p>
            <h1>Veículos</h1>
          </div>
          <button
            className="button button-primary"
            onClick={() => navigate("/painel/veiculos/novo")}
          >
            Cadastrar veículo
          </button>
        </div>
        {vehicles.isError && (
          <div className="state state-error">
            Não foi possível carregar o estoque administrativo.
          </div>
        )}
        <div className="admin-stats">
          <button
            className={
              statusFilter === "available" ? "stat-card active" : "stat-card"
            }
            onClick={() =>
              setStatusFilter(statusFilter === "available" ? "" : "available")
            }
          >
            <span>Disponíveis</span>
            <strong>{available}</strong>
            <small>Ver estoque ativo</small>
          </button>
          <button
            className={
              statusFilter === "reserved" ? "stat-card active" : "stat-card"
            }
            onClick={() =>
              setStatusFilter(statusFilter === "reserved" ? "" : "reserved")
            }
          >
            <span>Reservados</span>
            <strong>{reserved}</strong>
            <small>Ver reservas</small>
          </button>
          <button
            className={
              statusFilter === "sold" ? "stat-card active" : "stat-card"
            }
            onClick={() =>
              setStatusFilter(statusFilter === "sold" ? "" : "sold")
            }
          >
            <span>Vendidos</span>
            <strong>{sold}</strong>
            <small>Ver histórico de vendas</small>
          </button>
        </div>
        {statusFilter && (
          <button className="clear-filter" onClick={() => setStatusFilter("")}>
            Exibir todos os veículos <X size={14} />
          </button>
        )}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Ano</th>
                <th>Preço</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <strong>
                      {vehicle.brand} {vehicle.model}
                    </strong>
                    <small>{vehicle.version}</small>
                  </td>
                  <td>{vehicle.model_year}</td>
                  <td>{money(vehicle.price)}</td>
                  <td>
                    <span className={`status status-${vehicle.status}`}>
                      {label(vehicle.status ?? "draft")}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button
                      className="table-action"
                      onClick={() =>
                        navigate(`/painel/veiculos/${vehicle.id}/editar`)
                      }
                    >
                      <Pencil size={13} /> Editar
                    </button>
                    {vehicle.status === "available" && (
                      <button
                        className="table-action"
                        onClick={() => setStatus(vehicle, "reserved")}
                      >
                        Reservar
                      </button>
                    )}
                    {vehicle.status === "reserved" && (
                      <button
                        className="table-action"
                        onClick={() => setStatus(vehicle, "available")}
                      >
                        Liberar
                      </button>
                    )}
                    {vehicle.status === "sold" && (
                      <button
                        className="table-action"
                        onClick={() => setStatus(vehicle, "available")}
                      >
                        Reabrir
                      </button>
                    )}
                    {vehicle.status !== "sold" && (
                      <button
                        className="table-action"
                        onClick={() => setPendingSale(vehicle)}
                      >
                        Marcar vendido
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicles.isPending && (
            <div className="state">Carregando veículos...</div>
          )}
          {!vehicles.isPending && filtered.length === 0 && (
            <div className="state"> Nenhum veículo encontrado.</div>
          )}
        </div>
      </section>
      {pendingSale && (
        <SaleDateModal
          vehicle={pendingSale}
          onCancel={() => setPendingSale(null)}
          onConfirm={async (date) => {
            await setStatus(pendingSale, "sold", date);
            setPendingSale(null);
          }}
        />
      )}
    </main>
  );
}

function LogoCropModal({
  file,
  kind = "logo",
  onCancel,
  onConfirm,
}: {
  file: File;
  kind?: "logo" | "favicon";
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [size, setSize] = useState(kind === "logo" ? "1320x288" : "512x512");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPosition = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const preview = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(preview), [preview]);
  const [outputWidth, outputHeight] = size.split("x").map(Number);
  function confirm() {
    const image = imageRef.current;
    if (!image) return;
    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const scale =
      Math.max(
        canvas.width / image.naturalWidth,
        canvas.height / image.naturalHeight,
      ) * zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      (canvas.width - width) / 2 + position.x * canvas.width,
      (canvas.height - height) / 2 + position.y * canvas.height,
      width,
      height,
    );
    canvas.toBlob(
      (blob) => {
        if (blob)
          onConfirm(new File([blob], kind === "logo" ? "logo.jpg" : "favicon.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }
  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragStart.current = { x: event.clientX, y: event.clientY };
    initialPosition.current = position;
  }
  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setPosition({
      x: initialPosition.current.x + (event.clientX - dragStart.current.x) / 420,
      y: initialPosition.current.y + (event.clientY - dragStart.current.y) / 220,
    });
  }
  return (
    <div className="crop-backdrop">
      <div className="crop-modal">
        <h2>Ajustar {kind === "logo" ? "logo" : "favicon"}</h2>
        <p>Faça o enquadramento antes de salvar a imagem.</p>
        <div className="crop-editor-layout">
          <div
            className={`crop-frame ${dragging ? "is-dragging" : ""}`}
            style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            <img
              ref={imageRef}
              src={preview}
              alt={`Pré-visualização do ${kind}`}
              style={{ transform: `translate(${position.x * 100}px, ${position.y * 100}px) scale(${zoom})` }}
            />
            <span className="crop-guide" />
          </div>
          <div className="crop-preview-panel">
            <span>Pré-visualização</span>
            <div className="crop-preview" style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}>
              <img src={preview} alt="Resultado" style={{ transform: `translate(${position.x * 50}px, ${position.y * 50}px) scale(${zoom})` }} />
            </div>
          </div>
        </div>
        {kind === "logo" && <label>Formato de saída<select value={size} onChange={(event) => setSize(event.target.value)}><option value="1320x288">Header da loja · 1320 × 288</option><option value="1100x240">Logo compacto · 1100 × 240</option><option value="800x800">Quadrado · 800 × 800</option></select></label>}
        <label>
          Zoom
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <p className="crop-hint">Arraste a imagem para posicionar. Use o controle para aproximar.</p>
        <div className="crop-actions">
          <button type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={confirm}
          >
            Usar imagem
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminSettings({ token }: { token: string }) {
  const store = useQuery({
    queryKey: ["admin-store"],
    queryFn: () => api<{ data: Store }>("/public/store", {}, token),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primary, setPrimary] = useState("#173F5F");
  const [secondary, setSecondary] = useState("#F6AE2D");
  const [header, setHeader] = useState("#FFFFFF");
  const [background, setBackground] = useState("#F8F7F4");
  const [textColor, setTextColor] = useState("#202226");
  const [footer, setFooter] = useState("#202328");
  const [footerText, setFooterText] = useState("#9B9DA1");
  const [footerAccent, setFooterAccent] = useState("#FFFFFF");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<{ file: File; kind: "logo" | "favicon" } | null>(null);
  useEffect(() => {
    if (store.data) {
      setName(store.data.data.name);
      setDescription(store.data.data.description ?? "");
      setPrimary(store.data.data.theme.primary);
      setSecondary(store.data.data.theme.secondary);
      setHeader(store.data.data.theme.header);
      setBackground(store.data.data.theme.background);
      setTextColor(store.data.data.theme.text);
      setFooter(store.data.data.theme.footer);
      setFooterText(store.data.data.theme.footer_text);
      setFooterAccent(store.data.data.theme.footer_accent);
    }
  }, [store.data]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.delete("logoPicker");
    form.delete("faviconPicker");
    if (logoFile) form.set("logo", logoFile);
    if (faviconFile) form.set("favicon", faviconFile);
    form.set("name", name);
    form.set("description", description);
    form.set("primary_color", primary);
    form.set("secondary_color", secondary);
    form.set("header_background", header);
    form.set("site_background", background);
    form.set("text_color", textColor);
    form.set("footer_background", footer);
    form.set("footer_text_color", footerText);
    form.set("footer_accent_color", footerAccent);
    try {
      await api("/admin/store", { method: "POST", body: form }, token);
      setMessage("Configurações salvas com sucesso.");
      setLogoFile(null);
      setFaviconFile(null);
      await store.refetch();
    } catch {
      setError(
        "Não foi possível salvar as configurações. Verifique os arquivos e tente novamente.",
      );
    }
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Configurações da loja
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel")}
        >
          <ChevronLeft size={16} /> Voltar ao painel
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow">PERSONALIZAÇÃO</p>
        <h1>Configurações da loja</h1>
        <form
          className="admin-form settings-form"
          onSubmit={save}
          encType="multipart/form-data"
        >
          <label>
            Nome comercial
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Descrição
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <div className="color-fields">
            <label>
              Cor principal
              <input
                type="color"
                value={primary}
                onChange={(event) => setPrimary(event.target.value)}
              />
            </label>
            <label>
              Cor secundária
              <input
                type="color"
                value={secondary}
                onChange={(event) => setSecondary(event.target.value)}
              />
            </label>
            <label>
              Fundo do header
              <input
                type="color"
                value={header}
                onChange={(event) => setHeader(event.target.value)}
              />
            </label>
            <label>
              Fundo do site
              <input
                type="color"
                value={background}
                onChange={(event) => setBackground(event.target.value)}
              />
            </label>
            <label>
              Cor do texto
              <input
                type="color"
                value={textColor}
                onChange={(event) => setTextColor(event.target.value)}
              />
            </label>
            <label>
              Fundo do footer
              <input
                type="color"
                value={footer}
                onChange={(event) => setFooter(event.target.value)}
              />
            </label>
            <label>
              Texto do footer
              <input
                type="color"
                value={footerText}
                onChange={(event) => setFooterText(event.target.value)}
              />
            </label>
            <label>
              Destaque do footer
              <input
                type="color"
                value={footerAccent}
                onChange={(event) => setFooterAccent(event.target.value)}
              />
            </label>
          </div>
          <label>
            Logo da loja
            <input
              name="logoPicker"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setCropTarget({ file, kind: "logo" });
              }}
            />
          </label>
          {cropTarget && (
            <LogoCropModal
              file={cropTarget.file}
              kind={cropTarget.kind}
              onCancel={() => setCropTarget(null)}
              onConfirm={(file) => {
                if (cropTarget.kind === "logo") setLogoFile(file);
                else setFaviconFile(file);
                setCropTarget(null);
              }}
            />
          )}
          <label>
            Favicon
            <input
              name="faviconPicker"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/x-icon"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setCropTarget({ file, kind: "favicon" });
              }}
            />
          </label>
          <button className="button button-primary settings-save" type="submit">
            Salvar configurações
          </button>
          {message && <div className="form-success">{message}</div>}
          {error && <div className="form-error">{error}</div>}
        </form>
      </section>
    </main>
  );
}

function AdminUsers({ token }: { token: string }) {
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () =>
      api<{
        data: Array<{
          id: number;
          name: string;
          email: string;
          pivot: { role: string; is_active: boolean };
        }>;
      }>("/admin/users", {}, token),
  });
  const [message, setMessage] = useState("");
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    await api(
      "/admin/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      },
      token,
    );
    setMessage("Usuário criado.");
    await users.refetch();
    formElement.reset();
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Usuários da loja
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel")}
        >
          <ChevronLeft size={16} /> Voltar ao painel
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow">EQUIPE</p>
        <h1>Usuários da loja</h1>
        <div className="admin-user-grid">
          <form className="admin-form" onSubmit={create}>
            <h2>Novo usuário</h2>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              E-mail
              <input name="email" type="email" required />
            </label>
            <label>
              Senha
              <input name="password" type="password" minLength={8} required />
            </label>
            <label>
              Permissão
              <select name="role" defaultValue="seller">
                <option value="seller">Vendedor</option>
                <option value="store_manager">Gerente</option>
                <option value="store_admin">Administrador</option>
              </select>
            </label>
            <button className="button button-primary" type="submit">
              Criar usuário
            </button>
            {message && <div className="form-success">{message}</div>}
          </form>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Permissão</th>
                </tr>
              </thead>
              <tbody>
                {users.data?.data.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{label(user.pivot.role)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

type PlatformStore = {
  id: number;
  name: string;
  slug: string;
  status: string;
  vehicles_count: number;
  domains: Array<{ domain: string; is_primary: boolean }>;
};

function AdminHistory({ token }: { token: string }) {
  const history = useQuery({
    queryKey: ["vehicle-history"],
    queryFn: () =>
      api<{
        data: {
          data: Array<{
            id: number;
            from_status: string | null;
            to_status: string;
            created_at: string;
            vehicle: { brand: string; model: string; version: string | null };
            user?: { name: string };
          }>;
        };
      }>("/admin/status-history", {}, token),
  });
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Histórico de estoque
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel")}
        >
          <ChevronLeft size={16} /> Voltar
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow">RESERVAS E VENDAS</p>
        <h1>Histórico de status</h1>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Veículo</th>
                <th>Alteração</th>
                <th>Data</th>
                <th>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {history.data?.data.data.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>
                      {item.vehicle.brand} {item.vehicle.model}
                    </strong>
                    <small>{item.vehicle.version}</small>
                  </td>
                  <td>
                    {label(item.from_status ?? "novo")} →{" "}
                    {label(item.to_status)}
                  </td>
                  <td>{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                  <td>{item.user?.name ?? "Sistema"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {history.isPending && (
            <div className="state">Carregando histórico...</div>
          )}
          {history.isError && (
            <div className="state state-error">
              Não foi possível carregar o histórico.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function GlobalCatalog({ token }: { token: string }) {
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api<{ data: BrandOption[] }>("/public/catalog"),
  });
  const [brandId, setBrandId] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<{
    type: "brand" | "model";
    id: number;
    name: string;
    brandId?: number;
  } | null>(null);
  type CatalogRow = {
    type: "brand" | "model";
    id: number;
    name: string;
    brandId: number;
    brandName: string;
  };
  const rows: CatalogRow[] = (
    catalog.data?.data.flatMap<CatalogRow>((brand) =>
      brand.models.length
        ? brand.models.map((model): CatalogRow => ({
            type: "model",
            id: model.id,
            name: model.name,
            brandId: brand.id,
            brandName: brand.name,
          }))
        : [
            {
              type: "brand",
              id: brand.id,
              name: "—",
              brandId: brand.id,
              brandName: brand.name,
            },
          ],
    ) ?? []
  ).filter((row) =>
    `${row.name} ${row.brandName}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function addBrand(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api(
        "/platform/catalog/brands",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(form)),
        },
        token,
      );
      setMessage("Marca cadastrada.");
      await catalog.refetch();
      formElement.reset();
    } catch (exception) {
      setMessage(
        exception instanceof Error
          ? exception.message
          : "Não foi possível cadastrar a marca.",
      );
    }
  }
  async function addModel(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api(
        "/platform/catalog/models",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            brand_id: Number(brandId),
            name: form.get("name"),
          }),
        },
        token,
      );
      setMessage("Modelo cadastrado.");
      await catalog.refetch();
      formElement.reset();
      setBrandId("");
    } catch (exception) {
      setMessage(
        exception instanceof Error
          ? exception.message
          : "Não foi possível cadastrar o modelo.",
      );
    }
  }
  async function saveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const name = String(new FormData(event.currentTarget).get("name") ?? "");
    const path =
      editing.type === "brand"
        ? `/platform/catalog/brands/${editing.id}`
        : `/platform/catalog/models/${editing.id}`;
    const body =
      editing.type === "brand" ? { name } : { name, brand_id: editing.brandId };
    try {
      await api(
        path,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        token,
      );
      setEditing(null);
      setMessage("Registro atualizado.");
      catalog.refetch();
    } catch (exception) {
      setMessage(
        exception instanceof Error
          ? exception.message
          : "Não foi possível atualizar o registro.",
      );
    }
  }
  async function deleteRow(row: (typeof rows)[number]) {
    if (!window.confirm("Excluir este registro do catálogo?")) return;
    const path =
      row.type === "brand"
        ? `/platform/catalog/brands/${row.id}`
        : `/platform/catalog/models/${row.id}`;
    try {
      await api(path, { method: "DELETE" }, token);
      setMessage("Registro excluído.");
      catalog.refetch();
    } catch (exception) {
      setMessage(
        exception instanceof Error
          ? exception.message
          : "Não foi possível excluir o registro.",
      );
    }
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Catálogo de veículos
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel/global")}
        >
          <ChevronLeft size={16} /> Voltar
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow">CATÁLOGO GLOBAL</p>
        <h1>Marcas e modelos</h1>
        <p className="page-lead">
          Cadastre e mantenha os nomes usados no estoque.
        </p>
        <div className="catalog-forms">
          <form className="catalog-form" onSubmit={addBrand}>
            <h2>Nova marca</h2>
            <label>
              Marca
              <input name="name" placeholder="Ex.: Volkswagen" required />
            </label>
            <button className="button button-primary" type="submit">
              Adicionar marca
            </button>
          </form>
          <form className="catalog-form" onSubmit={addModel}>
            <h2>Novo modelo</h2>
            <label>
              Marca
              <select
                required
                value={brandId}
                onChange={(event) => setBrandId(event.target.value)}
              >
                <option value="">Selecione</option>
                {catalog.data?.data.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modelo
              <input name="name" placeholder="Ex.: T-Cross" required />
            </label>
            <button
              className="button button-primary"
              type="submit"
              disabled={!brandId}
            >
              Adicionar modelo
            </button>
          </form>
        </div>
        {message && (
          <div className="form-success catalog-message">{message}</div>
        )}
        <section className="catalog-table-section">
          <div className="catalog-table-toolbar">
            <div>
              <p className="eyebrow">CATÁLOGO ATUAL</p>
              <h2>Registros</h2>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filtrar marca ou modelo"
            />
          </div>
          <div className="catalog-table-wrap">
            <table className="catalog-table">
              <thead>
                <tr>
                  <th>Modelo</th>
                  <th>Marca</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.type}-${row.id}`}>
                    <td>{row.name}</td>
                    <td>{row.brandName}</td>
                    <td>
                      <button
                        className="catalog-action"
                        onClick={() =>
                          setEditing({
                            type: row.type,
                            id: row.id,
                            name:
                              row.type === "brand" ? row.brandName : row.name,
                            brandId: row.brandId,
                          })
                        }
                      >
                        Editar
                      </button>
                      <button
                        className="catalog-action catalog-delete"
                        onClick={() => deleteRow(row)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="state">Nenhum registro encontrado.</div>
            )}
          </div>
        </section>
      </section>
      {editing && (
        <div className="crop-backdrop">
          <form className="crop-modal catalog-edit-modal" onSubmit={saveEdit}>
            <h2>Editar {editing.type === "brand" ? "marca" : "modelo"}</h2>
            <label>
              Nome
              <input name="name" defaultValue={editing.name} required />
            </label>
            <div className="crop-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="button button-primary" type="submit">
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function GlobalStores({ token }: { token: string }) {
  const stores = useQuery({
    queryKey: ["platform-stores"],
    queryFn: () =>
      api<{ data: PlatformStore[] }>("/platform/stores", {}, token),
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<PlatformStore | null>(null);
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api(
        "/platform/stores",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(form)),
        },
        token,
      );
      setMessage("Loja criada com sucesso.");
      await stores.refetch();
      formElement.reset();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível criar a loja.",
      );
    }
  }
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const form = new FormData(event.currentTarget);
    try {
      await api(
        `/platform/stores/${editing.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(form)),
        },
        token,
      );
      setMessage("Loja atualizada.");
      setEditing(null);
      stores.refetch();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível atualizar a loja.",
      );
    }
  }
  async function toggle(store: PlatformStore) {
    await api(
      `/platform/stores/${store.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: store.status === "active" ? "suspended" : "active",
        }),
      },
      token,
    );
    stores.refetch();
  }
  async function remove(store: PlatformStore) {
    if (
      !window.confirm(
        `Excluir a loja ${store.name}? Essa ação só será permitida se não houver veículos ou usuários vinculados.`,
      )
    )
      return;
    try {
      await api(`/platform/stores/${store.id}`, { method: "DELETE" }, token);
      setMessage("Loja excluída.");
      stores.refetch();
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "A loja não pode ser excluída.",
      );
    }
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Administração global
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel")}
        >
          <ChevronLeft size={16} /> Painel da loja
        </button>
      </header>
      <section className="admin-content">
        <div className="admin-title">
          <div>
            <p className="eyebrow">PLATAFORMA</p>
            <h1>Lojas e domínios</h1>
            <p className="page-lead">
              Administre identidade, status e endereços das lojas da plataforma.
            </p>
          </div>
        </div>
        <div className="global-overview">
          <div>
            <strong>{stores.data?.data.length ?? 0}</strong>
            <span>Lojas cadastradas</span>
          </div>
          <div>
            <strong>
              {stores.data?.data.filter((store) => store.status === "active")
                .length ?? 0}
            </strong>
            <span>Lojas ativas</span>
          </div>
          <div>
            <strong>
              {stores.data?.data.reduce(
                (total, store) => total + store.vehicles_count,
                0,
              ) ?? 0}
            </strong>
            <span>Veículos vinculados</span>
          </div>
        </div>
        <div className="global-grid">
          <form className="admin-form" onSubmit={create}>
            <h2>Nova loja</h2>
            <p className="form-help">
              Cadastre a loja e seu domínio principal para liberar o acesso
              público.
            </p>
            <label>
              Nome comercial
              <input name="name" required />
            </label>
            <label>
              Slug
              <input name="slug" required pattern="[A-Za-z0-9_-]+" />
            </label>
            <label>
              Domínio principal
              <input name="domain" placeholder="loja-c.localhost" required />
            </label>
            <button className="button button-primary" type="submit">
              Criar loja
            </button>
          </form>
          <div className="global-guidance">
            <strong>Gestão segura</strong>
            <p>
              Suspender uma loja preserva seu histórico. A exclusão só é
              permitida quando não existem veículos nem usuários vinculados.
            </p>
            <a href="/painel/global/catalogo">
              Administrar catálogo de veículos →
            </a>
          </div>
        </div>
        {message && <div className="form-success">{message}</div>}
        {error && <div className="form-error">{error}</div>}
        <div className="global-store-list">
          {stores.data?.data.map((store) => (
            <article className="global-store-card" key={store.id}>
              <div className="global-store-main">
                <div className="store-avatar">
                  {store.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h2>{store.name}</h2>
                  <p>
                    {store.slug} · {store.vehicles_count} veículo(s)
                  </p>
                  <div className="domain-list">
                    {store.domains.map((domain) => (
                      <span key={domain.domain}>
                        {domain.domain}
                        {domain.is_primary ? " · principal" : ""}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="global-store-actions">
                <span className={`status status-${store.status}`}>
                  {store.status === "active" ? "Ativa" : "Suspensa"}
                </span>
                <button
                  className="table-action"
                  onClick={() => setEditing(store)}
                >
                  Editar
                </button>
                <button className="table-action" onClick={() => toggle(store)}>
                  {store.status === "active" ? "Suspender" : "Ativar"}
                </button>
                <button
                  className="table-action danger-action"
                  onClick={() => remove(store)}
                >
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      {editing && (
        <div className="crop-backdrop">
          <form className="crop-modal store-edit-modal" onSubmit={update}>
            <h2>Editar loja</h2>
            <p>Atualize os dados administrativos da loja selecionada.</p>
            <label>
              Nome comercial
              <input name="name" defaultValue={editing.name} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={editing.slug} required />
            </label>
            <label>
              Descrição
              <textarea
                name="description"
                rows={4}
                placeholder="Descrição institucional opcional"
              />
            </label>
            <div className="crop-actions">
              <button type="button" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="button button-primary" type="submit">
                Salvar alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function AdminVehicleForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [brandId, setBrandId] = useState("");
  const features = useQuery({
    queryKey: ["features"],
    queryFn: () => api<{ data: FeatureOption[] }>("/public/features"),
  });
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () => api<{ data: BrandOption[] }>("/public/catalog"),
  });
  const selectedBrand = catalog.data?.data.find(
    (brand) => String(brand.id) === brandId,
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const files = form
      .getAll("images")
      .filter((file): file is File => file instanceof File && file.size > 0);
    const featureIds = form.getAll("feature_ids").map(Number);
    form.delete("images");
    form.delete("feature_ids");
    const values = Object.fromEntries(form);
    const payload = {
      ...values,
      feature_ids: featureIds,
      manufacture_year: Number(values.manufacture_year),
      model_year: Number(values.model_year),
      mileage: Number(values.mileage),
      doors: Number(values.doors),
      price: Number(values.price),
      status: values.status || "draft",
    };
    try {
      const result = await api<{ data: { id: number } }>(
        "/admin/vehicles",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
      );
      if (files.length) {
        const imageData = new FormData();
        files.forEach((file) => imageData.append("images[]", file));
        await api(
          `/admin/vehicles/${result.data.id}/images`,
          { method: "POST", body: imageData },
          token,
        );
      }
      navigate("/painel");
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível cadastrar o veículo.",
      );
    }
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Novo veículo
        </div>
        <button className="admin-logout" onClick={() => navigate("/painel")}>
          <ChevronLeft size={16} /> Voltar ao painel
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow form-eyebrow">NOVO ESTOQUE</p>
        <h1>Cadastrar veículo</h1>
        <form className="vehicle-admin-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              Marca
              <select
                name="brand"
                required
                value={brandId ? (selectedBrand?.name ?? "") : ""}
                onChange={(event) =>
                  setBrandId(
                    String(
                      catalog.data?.data.find(
                        (brand) => brand.name === event.target.value,
                      )?.id ?? "",
                    ),
                  )
                }
              >
                <option value="">Selecione uma marca</option>
                {catalog.data?.data.map((brand) => (
                  <option key={brand.id} value={brand.name}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Modelo
              <select name="model" required>
                <option value="">Selecione um modelo</option>
                {selectedBrand?.models.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Versão
              <input name="version" />
            </label>
          </div>
          <div className="form-row">
            <label>
              Ano fabricação
              <input
                name="manufacture_year"
                type="number"
                min="1950"
                required
              />
            </label>
            <label>
              Ano modelo
              <input name="model_year" type="number" min="1950" required />
            </label>
            <label>
              Quilometragem
              <input name="mileage" type="number" min="0" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Câmbio
              <select name="transmission" defaultValue="automatic">
                <option value="manual">Manual</option>
                <option value="automatic">Automático</option>
                <option value="automated">Automatizado</option>
                <option value="cvt">CVT</option>
              </select>
            </label>
            <label>
              Combustível
              <select name="fuel_type" defaultValue="flex">
                <option value="flex">Flex</option>
                <option value="gasoline">Gasolina</option>
                <option value="ethanol">Etanol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </label>
            <label>
              Portas
              <input
                name="doors"
                type="number"
                min="2"
                max="5"
                defaultValue="4"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Cor
              <input name="color" />
            </label>
            <label>
              Placa
              <input name="license_plate" maxLength={7} />
            </label>
            <label>
              Preço anunciado
              <input name="price" type="number" min="0" step="0.01" required />
            </label>
          </div>
          <label>
            Descrição
            <textarea name="description" rows={5} />
          </label>
          <label>
            Imagens (até 20, 10 MB cada)
            <input
              name="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
            />
          </label>
          {features.data && (
            <fieldset className="feature-checks">
              <legend>Opcionais</legend>
              {features.data.data.map((feature) => (
                <label key={feature.id}>
                  <input
                    type="checkbox"
                    name="feature_ids"
                    value={feature.id}
                  />{" "}
                  {feature.name} <small>{feature.category}</small>
                </label>
              ))}
            </fieldset>
          )}
          <label>
            Status
            <select name="status" defaultValue="draft">
              <option value="draft">Rascunho</option>
              <option value="available">Disponível</option>
              <option value="reserved">Reservado</option>
              <option value="inactive">Inativo</option>
            </select>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary" type="submit">
            Concluir cadastro
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminVehicleEdit({ token }: { token: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const vehicleQuery = useQuery({
    queryKey: ["admin-vehicle", id],
    queryFn: () => api<{ data: Vehicle }>(`/admin/vehicles/${id}`, {}, token),
  });
  const features = useQuery({
    queryKey: ["features"],
    queryFn: () => api<{ data: FeatureOption[] }>("/public/features"),
  });
  useEffect(() => {
    if (vehicleQuery.data) setVehicle(vehicleQuery.data.data);
  }, [vehicleQuery.data]);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!vehicle) return;
    setError("");
    setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      ...values,
      feature_ids: Array.from(
        event.currentTarget.querySelectorAll<HTMLInputElement>(
          'input[name="feature_ids"]:checked',
        ),
      ).map((input) => Number(input.value)),
      manufacture_year: Number(values.manufacture_year),
      model_year: Number(values.model_year),
      mileage: Number(values.mileage),
      doors: Number(values.doors),
      price: Number(values.price),
    };
    try {
      await api(
        `/admin/vehicles/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        token,
      );
      if (files.length) {
        const data = new FormData();
        files.forEach((file) => data.append("images[]", file));
        await api(
          `/admin/vehicles/${id}/images`,
          { method: "POST", body: data },
          token,
        );
      }
      setMessage("Veículo atualizado.");
      await vehicleQuery.refetch();
      setFiles([]);
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "Não foi possível atualizar o veículo.",
      );
    }
  }
  async function imageAction(image: Image, action: "primary" | "delete") {
    if (action === "delete")
      await api(
        `/admin/vehicles/${id}/images/${(image as Image & { id?: number }).id}`,
        { method: "DELETE" },
        token,
      );
    else
      await api(
        `/admin/vehicles/${id}/images/${(image as Image & { id?: number }).id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_primary: true }),
        },
        token,
      );
    await vehicleQuery.refetch();
  }
  if (!vehicle)
    return (
      <main className="admin-shell">
        <section className="state page-state">Carregando veículo...</section>
      </main>
    );
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <LayoutDashboard size={20} /> Editar veículo
        </div>
        <button className="admin-logout" onClick={() => navigate("/painel")}>
          <ChevronLeft size={16} /> Voltar ao painel
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow form-eyebrow">ESTOQUE</p>
        <h1>
          Editar {vehicle.brand} {vehicle.model}
        </h1>
        <form className="vehicle-admin-form" onSubmit={save}>
          <div className="form-row">
            <label>
              Marca
              <input name="brand" defaultValue={vehicle.brand} required />
            </label>
            <label>
              Modelo
              <input name="model" defaultValue={vehicle.model} required />
            </label>
            <label>
              Versão
              <input name="version" defaultValue={vehicle.version ?? ""} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Ano fabricação
              <input
                name="manufacture_year"
                type="number"
                defaultValue={vehicle.manufacture_year}
                required
              />
            </label>
            <label>
              Ano modelo
              <input
                name="model_year"
                type="number"
                defaultValue={vehicle.model_year}
                required
              />
            </label>
            <label>
              Quilometragem
              <input
                name="mileage"
                type="number"
                defaultValue={vehicle.mileage}
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Câmbio
              <select name="transmission" defaultValue={vehicle.transmission}>
                <option value="manual">Manual</option>
                <option value="automatic">Automático</option>
                <option value="automated">Automatizado</option>
                <option value="cvt">CVT</option>
              </select>
            </label>
            <label>
              Combustível
              <select name="fuel_type" defaultValue={vehicle.fuel_type}>
                <option value="flex">Flex</option>
                <option value="gasoline">Gasolina</option>
                <option value="ethanol">Etanol</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Elétrico</option>
                <option value="hybrid">Híbrido</option>
              </select>
            </label>
            <label>
              Portas
              <input
                name="doors"
                type="number"
                defaultValue={vehicle.doors ?? 4}
                min="2"
                max="5"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Cor
              <input name="color" defaultValue={vehicle.color ?? ""} />
            </label>
            <label>
              Placa
              <input
                name="license_plate"
                defaultValue=""
                maxLength={7}
                placeholder="Não alterar para manter"
              />
            </label>
            <label>
              Preço
              <input
                name="price"
                type="number"
                step="0.01"
                defaultValue={vehicle.price}
                required
              />
            </label>
          </div>
          <label>
            Descrição
            <textarea
              name="description"
              rows={5}
              defaultValue={vehicle.description ?? ""}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={vehicle.status}>
              <option value="draft">Rascunho</option>
              <option value="available">Disponível</option>
              <option value="reserved">Reservado</option>
              <option value="inactive">Inativo</option>
              <option value="sold">Vendido</option>
            </select>
          </label>
          {features.data && (
            <fieldset className="feature-checks">
              <legend>Opcionais</legend>
              {features.data.data.map((feature) => (
                <label key={feature.id}>
                  <input
                    type="checkbox"
                    name="feature_ids"
                    value={feature.id}
                    defaultChecked={vehicle.features.some(
                      (item) => item.name === feature.name,
                    )}
                  />{" "}
                  {feature.name}
                </label>
              ))}
            </fieldset>
          )}
          <label>
            Adicionar imagens
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) =>
                setFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="button button-primary" type="submit">
            Salvar alterações
          </button>
        </form>
        <section className="admin-image-manager">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MÍDIA</p>
              <h2>Fotos do veículo</h2>
            </div>
            <span>{vehicle.images.length}/20 imagens</span>
          </div>
          <div className="image-manager-grid">
            {vehicle.images.map((image) => (
              <div
                className="managed-image"
                key={(image as Image & { id?: number }).id ?? image.path}
              >
                <img src={imageUrl(image.path)} alt="Foto do veículo" />
                <div>
                  <button
                    className="table-action"
                    onClick={() => imageAction(image, "primary")}
                  >
                    {image.is_primary ? "Principal" : "Usar como principal"}
                  </button>
                  <button
                    className="table-action danger-action"
                    onClick={() => imageAction(image, "delete")}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminContacts({ token }: { token: string }) {
  const contacts = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: () =>
      api<{
        data: Array<{
          id: number;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          created_at: string;
        }>;
      }>("/admin/contacts", {}, token),
  });
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-brand">
          <Inbox size={20} /> Caixa de entrada
        </div>
        <button
          className="admin-logout"
          onClick={() => window.location.assign("/painel")}
        >
          <ChevronLeft size={16} /> Voltar ao painel
        </button>
      </header>
      <section className="admin-content">
        <p className="eyebrow">ATENDIMENTO</p>
        <h1>Contatos recebidos</h1>
        <div className="contact-inbox">
          {contacts.data?.data.map((contact) => (
            <article key={contact.id}>
              <div className="contact-inbox-head">
                <strong>{contact.name}</strong>
                <time>
                  {new Date(contact.created_at).toLocaleString("pt-BR")}
                </time>
              </div>
              <p>
                {contact.email}
                {contact.phone ? ` · ${contact.phone}` : ""}
              </p>
              <div>{contact.message}</div>
            </article>
          ))}
          {contacts.isPending && (
            <div className="state">Carregando mensagens...</div>
          )}
          {contacts.data?.data.length === 0 && (
            <div className="state">Nenhuma mensagem recebida.</div>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminApp({
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
  return (
    <Routes>
      <Route path="/painel/login" element={<AdminLogin onLogin={onLogin} />} />
      <Route
        path="/painel"
        element={
          token ? (
            <AdminDashboard token={token} onLogout={onLogout} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/historico"
        element={
          token ? (
            <AdminHistory token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/contatos"
        element={
          token ? (
            <AdminContacts token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/configuracoes"
        element={
          token ? (
            <AdminSettings token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/usuarios"
        element={
          token ? (
            <AdminUsers token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/veiculos/novo"
        element={
          token ? (
            <AdminVehicleForm token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/veiculos/:id/editar"
        element={
          token ? (
            <AdminVehicleEdit token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/global"
        element={
          token ? (
            <GlobalStores token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/global/catalogo"
        element={
          token ? (
            <GlobalCatalog token={token} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
      <Route
        path="/painel/*"
        element={
          token ? (
            <AdminDashboard token={token} onLogout={onLogout} />
          ) : (
            <AdminLogin onLogin={onLogin} />
          )
        }
      />
    </Routes>
  );
}

function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState<string | null>(() =>
    sessionStorage.getItem(adminTokenKey),
  );
  const store = useQuery({
    queryKey: ["store", storeDomain],
    queryFn: () => api<{ data: Store }>("/public/store"),
  });
  useEffect(() => {
    const storeName = store.data?.data.name;
    if (window.location.pathname.startsWith("/painel") || !storeName) return;
    const pageTitles: Record<string, string> = {
      "/": storeName,
      "/estoque": `Estoque | ${storeName}`,
      "/sobre": `Sobre a loja | ${storeName}`,
      "/contato": `Contato | ${storeName}`,
    };
    document.title = pageTitles[location.pathname] ?? `Veículo | ${storeName}`;
  }, [location.pathname, store.data?.data.name]);
  const logout = () => {
    sessionStorage.removeItem(adminTokenKey);
    setToken(null);
    window.history.replaceState({}, "", "/painel/login");
  };
  if (window.location.pathname.startsWith("/painel"))
    return <AdminApp token={token} onLogin={setToken} onLogout={logout} />;
  if (store.isPending)
    return <div className="state page-state">Carregando loja...</div>;
  if (store.isError)
    return (
      <div className="state page-state state-error">
        Este domínio não está associado a uma loja ativa.
      </div>
    );
  const data = store.data.data;
  if (data.favicon_path)
    document
      .querySelector('link[rel="icon"]')
      ?.setAttribute("href", imageUrl(data.favicon_path));
  return (
    <div
      className="site"
      style={
        {
          "--primary": data.theme.primary,
          "--secondary": data.theme.secondary,
          "--header-bg": data.theme.header,
          "--site-bg": data.theme.background,
          "--text-color": data.theme.text,
          "--footer-bg": data.theme.footer,
          "--footer-text": data.theme.footer_text,
          "--footer-accent": data.theme.footer_accent,
        } as React.CSSProperties
      }
    >
      <header className="site-header">
        <Link className="brand" to="/">
          {data.logo_path ? (
            <img
              className="brand-logo"
              src={imageUrl(data.logo_path)}
              alt={data.name}
            />
          ) : (
            <span className="brand-symbol">
              <CarFront size={21} />
            </span>
          )}
          <span>{data.name}</span>
        </Link>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Abrir menu"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav
          className={menuOpen ? "open" : ""}
          onClick={() => setMenuOpen(false)}
        >
          <Link to="/">Início</Link>
          <Link to="/estoque">Estoque</Link>
          <Link to="/sobre">Sobre a loja</Link>
          <Link to="/contato">Contato</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home store={data} />} />
          <Route path="/estoque" element={<Inventory />} />
          <Route
            path="/veiculos/:slug"
            element={<VehicleDetail store={data} />}
          />
          <Route path="/sobre" element={<AboutPage store={data} />} />
          <Route path="/contato" element={<ContactPage />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div>
          <strong>{data.name}</strong>
          <p>{data.description}</p>
        </div>
        <div>
          <p>Atendimento comercial</p>
          <a href="tel:+5500000000000">(00) 0000-0000</a>
        </div>
        <div>
          <p>
            © {new Date().getFullYear()} {data.name}
          </p>
          <p>Site demonstrativo</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
