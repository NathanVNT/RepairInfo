import { prisma } from '@/lib/prisma';

const DEFAULT_APP_NAME = 'Atelier Informatique';

type RuntimeConfigKey =
  | 'dolibarr_url'
  | 'dolibarr_api_key'
  | 'app_name'
  | 'app_url'
  | 'smtp_host'
  | 'smtp_port'
  | 'smtp_secure'
  | 'smtp_user'
  | 'smtp_pass'
  | 'smtp_from';

export interface RuntimeConfig {
  dolibarrUrl: string;
  apiKey: string;
  appName: string;
  appUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: string;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

async function ensureConfigTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AppConfig" (
      "key" TEXT PRIMARY KEY,
      "value" TEXT NOT NULL,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getConfigMap(): Promise<Map<string, string>> {
  await ensureConfigTable();
  const rows = await prisma.$queryRawUnsafe<Array<{ key: string; value: string }>>(
    'SELECT "key", "value" FROM "AppConfig"'
  );

  return new Map((rows || []).map((row) => [row.key, row.value]));
}

function toBoolString(value: string | undefined): string {
  return String(value || '').toLowerCase() === 'true' ? 'true' : 'false';
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const fallback: RuntimeConfig = {
    dolibarrUrl: process.env.NEXT_PUBLIC_DOLIBARR_URL || '',
    apiKey: process.env.NEXT_PUBLIC_DOLIBARR_API_KEY || '',
    appName: process.env.NEXT_PUBLIC_APP_NAME || DEFAULT_APP_NAME,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || '',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpSecure: toBoolString(process.env.SMTP_SECURE),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || '',
  };

  try {
    const map = await getConfigMap();
    return {
      dolibarrUrl: map.get('dolibarr_url')?.trim() || fallback.dolibarrUrl,
      apiKey: map.get('dolibarr_api_key')?.trim() || fallback.apiKey,
      appName: map.get('app_name')?.trim() || fallback.appName,
      appUrl: map.get('app_url')?.trim() || fallback.appUrl,
      smtpHost: map.get('smtp_host')?.trim() || fallback.smtpHost,
      smtpPort: map.get('smtp_port')?.trim() || fallback.smtpPort,
      smtpSecure: toBoolString(map.get('smtp_secure') || fallback.smtpSecure),
      smtpUser: map.get('smtp_user')?.trim() || fallback.smtpUser,
      smtpPass: map.get('smtp_pass') || fallback.smtpPass,
      smtpFrom: map.get('smtp_from')?.trim() || fallback.smtpFrom,
    };
  } catch (error) {
    console.error('[RuntimeConfig] Impossible de lire la configuration runtime:', error);
    return fallback;
  }
}

async function upsertConfigValue(key: RuntimeConfigKey, value: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "AppConfig" ("key", "value", "updatedAt")
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT("key") DO UPDATE SET
        "value" = excluded."value",
        "updatedAt" = CURRENT_TIMESTAMP
    `,
    key,
    value
  );
}

export async function setRuntimeConfig(config: Partial<RuntimeConfig>): Promise<void> {
  await ensureConfigTable();

  const updates: Array<Promise<void>> = [];
  const addUpdate = (key: RuntimeConfigKey, rawValue: string | undefined, trim = true) => {
    if (typeof rawValue === 'undefined') return;
    const value = trim ? rawValue.trim() : rawValue;
    updates.push(upsertConfigValue(key, value));
  };

  addUpdate('dolibarr_url', config.dolibarrUrl);
  addUpdate('dolibarr_api_key', config.apiKey);
  addUpdate('app_name', config.appName);
  addUpdate('app_url', config.appUrl);
  addUpdate('smtp_host', config.smtpHost);
  addUpdate('smtp_port', config.smtpPort);
  if (typeof config.smtpSecure !== 'undefined') {
    updates.push(upsertConfigValue('smtp_secure', toBoolString(config.smtpSecure)));
  }
  addUpdate('smtp_user', config.smtpUser);
  addUpdate('smtp_pass', config.smtpPass, false);
  addUpdate('smtp_from', config.smtpFrom);

  await Promise.all(updates);
}

export async function getRuntimeAppName(): Promise<string> {
  const config = await getRuntimeConfig();
  return config.appName || DEFAULT_APP_NAME;
}

export async function setRuntimeAppName(appName: string): Promise<void> {
  const normalized = appName.trim();
  if (!normalized) {
    throw new Error('Le nom de l\'application est requis');
  }

  await setRuntimeConfig({ appName: normalized });
}
