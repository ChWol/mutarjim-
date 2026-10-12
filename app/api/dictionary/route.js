import { NextResponse } from 'next/server';

const TABLE_URL = () => `${process.env.SUPABASE_URL?.replace(/\/$/, '')}/rest/v1/dictionary`;

function supabaseHeaders(prefer) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.SUPABASE_URL || !key) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function readDictionary() {
  const response = await fetch(`${TABLE_URL()}?select=id,sort_order,tunisian,german,notes&order=sort_order.asc`, {
    headers: supabaseHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase read failed (${response.status}): ${await response.text()}`);
  return response.json();
}

function normalize(value) {
  return value.normalize('NFKC').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
}

function matchRank(value, query) {
  const normalizedValue = normalize(value);
  if (normalizedValue === query) return 0;
  if (normalizedValue.startsWith(query)) return 1;
  const index = normalizedValue.indexOf(query);
  if (index === -1) return Infinity;
  if (index === 0 || !/[\p{L}\p{N}]/u.test(normalizedValue[index - 1])) return 2 + index;
  return 100 + index;
}

function levenshteinDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;
    for (let column = 1; column <= b.length; column += 1) {
      const above = previous[column];
      previous[column] = Math.min(previous[column] + 1, previous[column - 1] + 1,
        diagonal + (a[row - 1] === b[column - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

export async function GET(request) {
  try {
    const dictionary = await readDictionary();
    const { searchParams } = new URL(request.url);
    const query = normalize(searchParams.get('q') || '');
    const offset = Math.max(0, Number.parseInt(searchParams.get('offset') || '0', 10) || 0);
    const limit = Math.min(60, Math.max(1, Number.parseInt(searchParams.get('limit') || '24', 10) || 24));

    if (!query) {
      const items = dictionary.slice(offset, offset + limit);
      return NextResponse.json({ items, total: dictionary.length, hasMore: offset + items.length < dictionary.length, suggestion: null });
    }

    const matches = dictionary.map((item, index) => ({
      item,
      index,
      rank: Math.min(matchRank(item.tunisian, query), matchRank(item.german, query)),
    })).filter(({ rank }) => Number.isFinite(rank)).sort((a, b) => a.rank - b.rank || a.index - b.index);

    let suggestion = null;
    if (matches.length === 0 && query.length > 1) {
      let closest = null;
      let closestDistance = Infinity;
      for (const item of dictionary) {
        for (const value of [item.tunisian, item.german]) {
          const words = normalize(value).split(/\s+/);
          const distance = Math.min(...words.map((word) => levenshteinDistance(query, word)));
          if (distance < closestDistance) { closestDistance = distance; closest = value; }
        }
      }
      if (closest && closestDistance <= Math.min(3, Math.max(1, Math.ceil(query.length / 3)))) suggestion = closest;
    }

    const items = matches.slice(offset, offset + limit).map(({ item }) => item);
    return NextResponse.json({ items, total: matches.length, hasMore: offset + items.length < matches.length, suggestion });
  } catch (error) {
    console.error('Dictionary read failed:', error);
    return NextResponse.json({ error: 'Wörterbuch konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const tunisian = body.tunisian?.trim();
    const german = body.german?.trim();
    if (!tunisian || !german) return NextResponse.json({ error: 'Tunesisch und Deutsch sind erforderlich' }, { status: 400 });

    const current = await readDictionary();
    const nextOrder = current.reduce((highest, item) => Math.max(highest, Number(item.sort_order) || 0), 0) + 1;
    const id = globalThis.crypto.randomUUID();
    const response = await fetch(`${TABLE_URL()}?select=id,tunisian,german,notes`, {
      method: 'POST',
      headers: supabaseHeaders('return=representation'),
      body: JSON.stringify({ id, sort_order: nextOrder, tunisian, german, notes: body.notes?.trim() || '' }),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Supabase insert failed (${response.status}): ${await response.text()}`);
    const [item] = await response.json();
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Dictionary insert failed:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const tunisian = body.tunisian?.trim();
    const german = body.german?.trim();
    if (!body.id || !tunisian || !german) return NextResponse.json({ error: 'Tunesisch und Deutsch sind erforderlich' }, { status: 400 });

    const response = await fetch(`${TABLE_URL()}?id=eq.${encodeURIComponent(body.id)}&select=id,tunisian,german,notes`, {
      method: 'PATCH',
      headers: supabaseHeaders('return=representation'),
      body: JSON.stringify({ tunisian, german, notes: body.notes?.trim() || '' }),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Supabase update failed (${response.status}): ${await response.text()}`);
    const [item] = await response.json();
    if (!item) return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Dictionary update failed:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
  }
}
