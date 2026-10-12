import nextEnv from '@next/env';
import { readFile } from 'node:fs/promises';

nextEnv.loadEnvConfig(process.cwd());

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
  process.exit(1);
}

const source = JSON.parse(await readFile(new URL('../dictionary.json', import.meta.url), 'utf8'));
const entries = source.map((item, index) => ({
  id: String(item.id),
  sort_order: index + 1,
  tunisian: item.tunisian,
  german: item.german,
  notes: item.notes || '',
}));

const response = await fetch(`${url}/rest/v1/dictionary?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(entries),
});

if (!response.ok) {
  console.error(`Supabase seed failed (${response.status}): ${await response.text()}`);
  process.exit(1);
}

console.log(`Imported ${entries.length} dictionary entries into Supabase.`);
