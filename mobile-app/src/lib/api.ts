export type AuthUser = {
  id: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  role?: string;
};

export type Reparation = {
  id: string;
  ref: string;
  client_name: string | null;
  appareil: string | null;
  marque: string | null;
  modele: string | null;
  statut: string | null;
  priorite: string | null;
  technicien: string | null;
  date_depot: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function ensureApiBaseUrl(): string {
  const baseUrl = String(API_BASE_URL || '').trim();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL is missing. Add it to your .env file.');
  }
  return baseUrl.replace(/\/$/, '');
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.error || data?.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

export async function login(identifier: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${ensureApiBaseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = await res.json();
  return data.user as AuthUser;
}

export async function fetchReparations(): Promise<Reparation[]> {
  const res = await fetch(`${ensureApiBaseUrl()}/api/reparations`);

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as Reparation[];
}

export async function fetchReparationById(id: string): Promise<Reparation> {
  const res = await fetch(`${ensureApiBaseUrl()}/api/reparations/${id}`);

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return (await res.json()) as Reparation;
}

export async function fetchReparationByRef(ref: string): Promise<Reparation | null> {
  const items = await fetchReparations();
  return items.find((item: Reparation) => item.ref === ref) || null;
}

export async function updateReparationStatus(id: string, statut: string): Promise<void> {
  const current = await fetchReparationById(id);

  const res = await fetch(`${ensureApiBaseUrl()}/api/reparations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...current,
      statut,
    }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
}
