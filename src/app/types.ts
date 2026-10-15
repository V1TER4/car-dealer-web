export type Theme = {
  primary: string;
  secondary: string;
  header: string;
  background: string;
  text: string;
  footer: string;
  footer_text: string;
  footer_accent: string;
};

export type Store = {
  name: string;
  slug: string;
  description: string | null;
  logo_path?: string | null;
  favicon_path?: string | null;
  theme: Theme;
};

export type Feature = { name: string; category: string };
export type Image = { path: string; is_primary: boolean };

export type Vehicle = {
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

export type FeatureOption = { id: number; name: string; category: string };
export type BrandOption = {
  id: number;
  name: string;
  models: Array<{ id: number; name: string }>;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  global_role: string;
};

export type PlatformStore = {
  id: number;
  name: string;
  slug: string;
  status: string;
  vehicles_count: number;
  domains: Array<{ domain: string; is_primary: boolean }>;
};
