const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('erp_access');
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail ?? 'API error'), { status: res.status, body: err });
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  get: <T>(path: string, params?: FetchOptions['params']) =>
    apiFetch<T>(path, { method: 'GET', params }),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};

// Typed resource helpers
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access: string; refresh: string }>('/auth/login/', { email, password }),
  me: () => api.get<{ data: import('./types').TokenPayload }>('/auth/me/'),
  logout: () => api.post('/auth/logout/', {}),
};

export const obrasApi = {
  list: (params?: { estado?: string; q?: string }) =>
    api.get<{ data: import('./types').Obra[]; meta: { total: number } }>('/obras/', params),
  get: (id: string) => api.get<{ data: import('./types').Obra }>(`/obras/${id}/`),
  kpis: (id: string) => api.get<{ data: import('./types').ObraKpis }>(`/obras/${id}/kpis/`),
  hitos: (id: string) => api.get<{ data: import('./types').Hito[] }>(`/obras/${id}/hitos/`),
  actividades: (id: string) => api.get<{ data: import('./types').Actividad[] }>(`/obras/${id}/actividades/`),
  create: (body: Partial<import('./types').Obra>) => api.post<{ data: import('./types').Obra }>('/obras/', body),
  update: (id: string, body: Partial<import('./types').Obra>) =>
    api.patch<{ data: import('./types').Obra }>(`/obras/${id}/`, body),
};

export const comprasApi = {
  requisiciones: (params?: Record<string, string>) =>
    api.get<{ data: import('./types').Requisicion[]; meta: { total: number } }>('/compras/requisiciones/', params),
  aprobarRequisicion: (id: string) => api.patch(`/compras/requisiciones/${id}/aprobar/`, {}),
  ordenes: (params?: Record<string, string>) =>
    api.get<{ data: import('./types').OrdenCompra[]; meta: { total: number } }>('/compras/ordenes/', params),
  firmarOC: (id: string) => api.patch(`/compras/ordenes/${id}/firmar/`, {}),
};

export const inventarioApi = {
  articulos: (params?: Record<string, string>) =>
    api.get<{ data: import('./types').Articulo[]; meta: { total: number } }>('/inventario/articulos/', params),
  stockCritico: () =>
    api.get<{ data: import('./types').Articulo[] }>('/inventario/stock-critico/'),
  kardex: (id: string) =>
    api.get<{ data: import('./types').MovimientoInventario[] }>(`/inventario/articulos/${id}/kardex/`),
};

export const dashboardApi = {
  kpis: () => api.get<{ data: import('./types').DashboardKpis }>('/dashboard/kpis/'),
};
