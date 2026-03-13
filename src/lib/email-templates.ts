import fs from 'node:fs/promises';
import path from 'node:path';

type TemplateName = 'statut' | 'devis' | 'facture';

type TemplateVariables = Record<string, string | number | boolean | null | undefined>;

const templateCache = new Map<TemplateName, string>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function loadTemplate(name: TemplateName): Promise<string> {
  const cached = templateCache.get(name);
  if (cached) return cached;

  const filePath = path.join(process.cwd(), 'src', 'email-templates', `${name}.html`);
  const content = await fs.readFile(filePath, 'utf8');
  templateCache.set(name, content);
  return content;
}

function injectVariables(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const raw = variables[key];
    if (raw === null || typeof raw === 'undefined') return '';
    return escapeHtml(String(raw));
  });
}

export async function renderEmailTemplate(name: TemplateName, variables: TemplateVariables): Promise<string> {
  const template = await loadTemplate(name);
  return injectVariables(template, variables);
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function clearEmailTemplateCache(): void {
  templateCache.clear();
}
