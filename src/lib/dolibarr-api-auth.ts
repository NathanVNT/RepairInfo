import axios from 'axios';
import type { AuthUser } from './auth-types';
import { getRuntimeConfig } from './runtime-config';

type DolibarrInfoResponse = {
  id?: string | number;
  login?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  fullname?: string;
  nom?: string;
  prenom?: string;
  admin?: string | number;
};

type DolibarrUserListItem = {
  id?: string | number;
  login?: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  name?: string;
  fullname?: string;
  nom?: string;
  prenom?: string;
  admin?: string | number;
};

export class DolibarrApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DolibarrApiConfigError';
  }
}

export class DolibarrApiAuthUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DolibarrApiAuthUnavailableError';
  }
}

async function getDolibarrBaseUrl(): Promise<string> {
  const runtime = await getRuntimeConfig();
  const baseUrl = normalizeText(runtime?.dolibarrUrl) || process.env.NEXT_PUBLIC_DOLIBARR_URL;
  if (!baseUrl) {
    throw new DolibarrApiConfigError('NEXT_PUBLIC_DOLIBARR_URL manquante');
  }

  return baseUrl;
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function mapApiUser(data: DolibarrInfoResponse | DolibarrUserListItem, fallbackLogin = ''): AuthUser {
  const login = normalizeText(data?.login) || fallbackLogin;
  const email = normalizeText(data?.email);
  const firstname = normalizeText(data?.firstname) || normalizeText(data?.prenom);
  const lastname = normalizeText(data?.lastname) || normalizeText(data?.nom);
  const fullName =
    `${firstname} ${lastname}`.trim() ||
    normalizeText(data?.fullname) ||
    normalizeText(data?.name) ||
    login ||
    'Utilisateur Dolibarr';

  const rawId = normalizeText(data?.id);
  const dolibarrUserId = Number(rawId || '0');
  const isAdmin = String(data?.admin || '0') === '1';

  return {
    id: `dolibarr-api-${rawId || login || 'user'}`,
    dolibarrUserId: Number.isFinite(dolibarrUserId) ? dolibarrUserId : 0,
    login: login || 'api-user',
    nom: fullName,
    email,
    role: isAdmin ? 'admin' : 'technicien',
  };
}

export async function authenticateDolibarrApiUser(identifier: string, apiToken: string): Promise<AuthUser | null> {
  const token = normalizeText(apiToken);
  const wanted = normalizeText(identifier).toLowerCase();

  if (!token) return null;

  const baseUrl = await getDolibarrBaseUrl();
  const { data } = await axios.get<DolibarrInfoResponse>(`${baseUrl}/api/index.php/users/info`, {
    headers: {
      DOLAPIKEY: token,
      'Content-Type': 'application/json',
    },
    timeout: 12000,
  });

  const login = normalizeText(data?.login);
  const email = normalizeText(data?.email);

  if (wanted && wanted !== login.toLowerCase() && wanted !== email.toLowerCase()) {
    return null;
  }

  return mapApiUser(data, wanted);
}

type LoginExchangeResponse = {
  token?: string;
  api_token?: string;
  access_token?: string;
  bearer?: string;
  success?: {
    token?: string;
    api_token?: string;
    access_token?: string;
  };
};

function extractToken(payload: LoginExchangeResponse): string {
  return normalizeText(
    payload?.token ||
      payload?.api_token ||
      payload?.access_token ||
      payload?.bearer ||
      payload?.success?.token ||
      payload?.success?.api_token ||
      payload?.success?.access_token
  );
}

async function exchangeTokenWithCredentials(identifier: string, password: string): Promise<string> {
  const baseUrl = await getDolibarrBaseUrl();

  try {
    const { data } = await axios.post<LoginExchangeResponse>(
      `${baseUrl}/api/index.php/login`,
      {
        login: identifier,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    const token = extractToken(data || {});
    if (!token) {
      throw new DolibarrApiAuthUnavailableError(
        "Endpoint /api/index.php/login accessible mais aucun token n'a été renvoyé."
      );
    }

    return token;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 401) {
      throw new Error('Identifiants invalides');
    }

    if (status === 403) {
      throw new DolibarrApiAuthUnavailableError(
        "Dolibarr refuse /api/index.php/login (403). Activez l'auth API par login/mot de passe côté Dolibarr ou utilisez un token API."
      );
    }

    throw error;
  }
}

export async function authenticateDolibarrApiWithPassword(
  identifier: string,
  password: string
): Promise<{ user: AuthUser; apiToken: string } | null> {
  const wanted = normalizeText(identifier).toLowerCase();
  const apiToken = await exchangeTokenWithCredentials(identifier, password);

  const baseUrl = await getDolibarrBaseUrl();
  const { data } = await axios.get<DolibarrInfoResponse>(`${baseUrl}/api/index.php/users/info`, {
    headers: {
      DOLAPIKEY: apiToken,
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 12000,
  });

  const login = normalizeText(data?.login);
  const email = normalizeText(data?.email);

  if (wanted && wanted !== login.toLowerCase() && wanted !== email.toLowerCase()) {
    return null;
  }

  return {
    user: mapApiUser(data, wanted),
    apiToken,
  };
}

export async function listDolibarrApiUsers(apiToken: string, limit = 200): Promise<AuthUser[]> {
  const token = normalizeText(apiToken);
  if (!token) {
    throw new DolibarrApiConfigError('NEXT_PUBLIC_DOLIBARR_API_KEY manquante');
  }

  const baseUrl = await getDolibarrBaseUrl();
  const { data } = await axios.get<{ value?: DolibarrUserListItem[] } | DolibarrUserListItem[]>(
    `${baseUrl}/api/index.php/users?limit=${limit}`,
    {
      headers: {
        DOLAPIKEY: token,
        'Content-Type': 'application/json',
      },
      timeout: 12000,
    }
  );

  const list = Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
  return list.map((item) => mapApiUser(item));
}
