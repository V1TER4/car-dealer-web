import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Phone,
  Search,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, imageUrl, label, money } from "../../app/api";
import type { Paginated, Store, Vehicle } from "../../app/types";

function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const image =
    vehicle.images?.find((item) => item.is_primary) ?? vehicle.images?.[0];
  return (
    <Link className="vehicle-card" to={`/veiculos/${vehicle.slug}`}>
      <div className="vehicle-photo">
        {image ? (
          <img src={imageUrl(image.path)} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" />
        ) : (
          <><CarFront size={42} strokeWidth={1.2} /><span>Foto em breve</span></>
        )}
      </div>
      <div className="vehicle-card-body">
        <p className="eyebrow">{vehicle.brand}</p>
        <h3>{vehicle.model} {vehicle.version}</h3>
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

export function Home({ store }: { store: Store }) {
  const vehicles = useQuery({
    queryKey: ["vehicles", store.slug],
    queryFn: () => api<Paginated<Vehicle>>("/public/vehicles?per_page=6"),
  });
  return <>
    <section className="hero-section"><div><p className="eyebrow">ESTOQUE SELECIONADO</p><h1>Seu próximo carro está aqui.</h1><p>Encontre veículos revisados e prontos para seguir com você.</p><Link className="button button-primary" to="/estoque">Ver estoque <ArrowRight size={17} /></Link></div><div className="hero-mark"><CarFront size={82} strokeWidth={1} /></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">OFERTAS DA LOJA</p><h2>Veículos em destaque</h2></div><Link className="text-link" to="/estoque">Ver todo estoque <ArrowRight size={16} /></Link></div>
      {vehicles.isPending && <div className="state">Carregando estoque...</div>}
      {vehicles.isError && <div className="state state-error">Não foi possível carregar o estoque.</div>}
      {vehicles.data && <div className="vehicle-grid">{vehicles.data.data.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div>}
    </section>
    <section className="contact-strip"><div><p className="eyebrow">FALE COM A {store.name.toUpperCase()}</p><h2>Quer saber mais sobre um veículo?</h2></div><a className="button button-light" href="https://wa.me/5500000000000" target="_blank" rel="noreferrer"><Phone size={17} /> Falar pelo WhatsApp</a></section>
  </>;
}

export function Inventory() {
  const [search, setSearch] = useState(""); const [transmission, setTransmission] = useState(""); const [fuel, setFuel] = useState(""); const [minPrice, setMinPrice] = useState(""); const [maxPrice, setMaxPrice] = useState(""); const [page, setPage] = useState(1);
  const params = useMemo(() => { const query = new URLSearchParams({ page: String(page), per_page: "12" }); if (search) query.set("search", search); if (transmission) query.set("transmission", transmission); if (fuel) query.set("fuel_type", fuel); if (minPrice) query.set("min_price", minPrice); if (maxPrice) query.set("max_price", maxPrice); return `?${query}`; }, [page, search, transmission, fuel, minPrice, maxPrice]);
  const vehicles = useQuery({ queryKey: ["inventory", params], queryFn: () => api<Paginated<Vehicle>>(`/public/vehicles${params}`) });
  const resetPage = (setter: (value: string) => void) => (value: string) => { setPage(1); setter(value); };
  return <section className="section inventory"><div className="section-heading"><div><p className="eyebrow">ESTOQUE</p><h1>Escolha seu próximo veículo</h1></div></div><div className="filter-bar"><div className="search-field"><Search size={18} /><input placeholder="Busque por marca ou modelo" value={search} onChange={(event) => resetPage(setSearch)(event.target.value)} /></div><select value={transmission} onChange={(event) => resetPage(setTransmission)(event.target.value)}><option value="">Todos os câmbios</option><option value="manual">Manual</option><option value="automatic">Automático</option><option value="cvt">CVT</option></select><select value={fuel} onChange={(event) => resetPage(setFuel)(event.target.value)}><option value="">Todos os combustíveis</option><option value="flex">Flex</option><option value="gasoline">Gasolina</option><option value="electric">Elétrico</option><option value="hybrid">Híbrido</option></select><input className="price-filter" type="number" placeholder="Preço mínimo" value={minPrice} onChange={(event) => resetPage(setMinPrice)(event.target.value)} /><input className="price-filter" type="number" placeholder="Preço máximo" value={maxPrice} onChange={(event) => resetPage(setMaxPrice)(event.target.value)} /></div>{vehicles.isPending && <div className="state">Carregando estoque...</div>}{vehicles.isError && <div className="state state-error">Não foi possível carregar o estoque.</div>}{vehicles.data && <><p className="result-count">{vehicles.data.total} veículo(s) encontrado(s)</p><div className="vehicle-grid">{vehicles.data.data.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}</div><div className="pagination"><button disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17} /> Anterior</button><span>Página {page} de {vehicles.data.last_page}</span><button disabled={page >= vehicles.data.last_page} onClick={() => setPage((current) => current + 1)}>Próxima <ChevronRight size={17} /></button></div></>}</section>;
}

export function VehicleDetail({ store }: { store: Store }) {
  const { slug } = useParams();
  const vehicle = useQuery({ queryKey: ["vehicle", slug], queryFn: () => api<{ data: Vehicle }>(`/public/vehicles/${slug}`) });
  useEffect(() => { if (vehicle.data?.data) document.title = `${vehicle.data.data.brand} ${vehicle.data.data.model} | ${store.name}`; }, [vehicle.data, store.name]);
  if (vehicle.isPending) return <div className="state page-state">Carregando veículo...</div>;
  if (vehicle.isError) return <div className="state page-state state-error">Veículo não encontrado ou indisponível.</div>;
  const item = vehicle.data.data;
  return <section className="section detail"><Link className="back-link" to="/estoque"><ChevronLeft size={17} /> Voltar ao estoque</Link><div className="detail-layout"><div className="detail-photo"><CarFront size={86} strokeWidth={1.1} /><span>Galeria de imagens</span></div><div><p className="eyebrow">{item.brand}</p><h1>{item.model} {item.version}</h1><p className="detail-price">{money(item.price)}</p><div className="spec-grid"><span><b>Ano</b>{item.manufacture_year}/{item.model_year}</span><span><b>Quilometragem</b>{item.mileage.toLocaleString("pt-BR")} km</span><span><b>Câmbio</b>{label(item.transmission)}</span><span><b>Combustível</b>{label(item.fuel_type)}</span><span><b>Cor</b>{item.color ?? "Não informado"}</span><span><b>Portas</b>{item.doors ?? "Não informado"}</span></div><p className="detail-description">{item.description}</p><a className="button button-primary" href={`https://wa.me/5500000000000?text=${encodeURIComponent(`Olá, tenho interesse no ${item.brand} ${item.model} ${item.version ?? ""}.`)}`} target="_blank" rel="noreferrer"><Phone size={17} /> Tenho interesse</a></div></div>{item.features.length > 0 && <div className="features"><h2>Opcionais</h2>{item.features.map((feature) => <span key={feature.name}>{feature.name}</span>)}</div>}</section>;
}

export function ContactPage() {
  const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSent(false); setError(""); const formElement = event.currentTarget; try { await api("/public/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(formElement))) }); setSent(true); formElement.reset(); } catch { setError("Não foi possível enviar sua mensagem. Tente novamente."); } }
  return <section className="section contact-page"><p className="eyebrow">CONTATO</p><h1>Fale com a loja</h1><p className="contact-intro">Envie uma mensagem e a equipe comercial retornará em breve.</p><form className="contact-form" onSubmit={submit}><label>Nome<input name="name" required /></label><label>E-mail<input name="email" type="email" required /></label><label>Telefone<input name="phone" /></label><label>Mensagem<textarea name="message" required minLength={10} rows={5} /></label><input name="website" tabIndex={-1} autoComplete="off" className="honeypot" /><button className="button button-primary" type="submit">Enviar mensagem</button>{sent && <div className="form-success">Mensagem enviada com sucesso.</div>}{error && <div className="form-error">{error}</div>}</form></section>;
}

export function AboutPage({ store }: { store: Store }) {
  return <section className="section about-page"><p className="eyebrow">A LOJA</p><h1>{store.name}</h1><p className="about-copy">{store.description ?? "Conheça nossa loja e fale com a equipe comercial para encontrar o veículo ideal."}</p><Link className="button button-primary" to="/contato">Falar com a loja <ArrowRight size={17} /></Link></section>;
}
