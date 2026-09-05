import { env } from 'cloudflare:workers';

export function getDbBinding() {
  if (!env.DB) throw new Error('Cloudflare D1 binding `DB` is unavailable.');
  return env.DB;
}
