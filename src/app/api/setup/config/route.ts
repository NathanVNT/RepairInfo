import { NextRequest, NextResponse } from 'next/server';
import { getRuntimeConfig, setRuntimeConfig } from '@/lib/runtime-config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { encryptSecret } from '@/lib/secret-crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function upsertEnvValue(content: string, key: string, value: string): string {
  const normalizedValue = String(value ?? '');
  const line = `${key}=${normalizedValue}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  const suffix = content.endsWith('\n') || content.length === 0 ? '' : '\n';
  return `${content}${suffix}${line}\n`;
}

function mergeEnvContent(base: string, incoming: string): string {
  let merged = base;
  const lines = incoming.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    if (!key) continue;

    merged = upsertEnvValue(merged, key, value);
  }

  return merged;
}

async function persistSetupEnvFile(config: Awaited<ReturnType<typeof getRuntimeConfig>>): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  let content = '';
  let localContent = '';

  try {
    content = await fs.readFile(envPath, 'utf8');
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  try {
    localContent = await fs.readFile(envLocalPath, 'utf8');
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }
  }

  if (localContent) {
    content = mergeEnvContent(content, localContent);
  }

  content = upsertEnvValue(content, 'NEXT_PUBLIC_DOLIBARR_URL', config.dolibarrUrl);
  content = upsertEnvValue(content, 'NEXT_PUBLIC_DOLIBARR_API_KEY', config.apiKey);
  content = upsertEnvValue(content, 'NEXT_PUBLIC_APP_NAME', config.appName);
  content = upsertEnvValue(content, 'NEXT_PUBLIC_APP_URL', config.appUrl);
  content = upsertEnvValue(content, 'SMTP_HOST', config.smtpHost);
  content = upsertEnvValue(content, 'SMTP_PORT', config.smtpPort);
  content = upsertEnvValue(content, 'SMTP_SECURE', config.smtpSecure);
  content = upsertEnvValue(content, 'SMTP_USER', config.smtpUser);
  content = upsertEnvValue(content, 'SMTP_PASS', encryptSecret(config.smtpPass));
  content = upsertEnvValue(content, 'SMTP_FROM', config.smtpFrom);

  await fs.writeFile(envPath, content, 'utf8');

  if (localContent) {
    try {
      await fs.unlink(envLocalPath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

export async function GET() {
  try {
    const config = await getRuntimeConfig();
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors du chargement de la configuration', message: error?.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const appName = String(body?.appName || '').trim();
    const dolibarrUrl = String(body?.dolibarrUrl || '').trim();
    const apiKey = String(body?.apiKey || '').trim();

    if (!appName) {
      return NextResponse.json({ error: 'Le nom de l\'application est requis' }, { status: 400 });
    }

    if (!dolibarrUrl) {
      return NextResponse.json({ error: 'L\'URL Dolibarr est requise' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'La clé API Dolibarr est requise' }, { status: 400 });
    }

    await setRuntimeConfig({
      dolibarrUrl,
      apiKey,
      appName,
      appUrl: typeof body?.appUrl === 'string' ? body.appUrl : undefined,
      smtpHost: typeof body?.smtpHost === 'string' ? body.smtpHost : undefined,
      smtpPort: typeof body?.smtpPort === 'string' ? body.smtpPort : undefined,
      smtpSecure: typeof body?.smtpSecure === 'string' ? body.smtpSecure : undefined,
      smtpUser: typeof body?.smtpUser === 'string' ? body.smtpUser : undefined,
      smtpPass: typeof body?.smtpPass === 'string' ? body.smtpPass : undefined,
      smtpFrom: typeof body?.smtpFrom === 'string' ? body.smtpFrom : undefined,
    });

    const config = await getRuntimeConfig();

    let envFileUpdated = true;
    let envFileWarning: string | undefined;

    try {
      await persistSetupEnvFile(config);
    } catch (error: any) {
      envFileUpdated = false;
      envFileWarning = `Configuration runtime sauvegardée, mais .env n'a pas pu être mis à jour: ${error?.message || 'Erreur inconnue'}`;
      console.error('[SetupConfig] Erreur mise à jour .env:', error);
    }

    return NextResponse.json({
      success: true,
      envFileUpdated,
      envFileWarning,
      smtpPassEnvValue: encryptSecret(config.smtpPass),
      ...config,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la configuration', message: error?.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
