import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

let citiesCache: Record<string, Record<string, string[]>> | null = null;

function getCities(): Record<string, Record<string, string[]>> {
  if (!citiesCache) {
    const filePath = join(/*turbopackIgnore: true*/ process.cwd(), 'src/data/cities.json');
    if (existsSync(filePath)) {
      try {
        citiesCache = JSON.parse(readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.error('Failed to parse cities.json:', e);
      }
    }
    if (!citiesCache) {
      const fallbackPath = join(/*turbopackIgnore: true*/ process.cwd(), '../server/data/cities.json');
      if (existsSync(fallbackPath)) {
        try {
          citiesCache = JSON.parse(readFileSync(fallbackPath, 'utf8'));
        } catch (e) {
          console.error('Failed to parse fallback cities.json:', e);
        }
      }
    }
    if (!citiesCache) {
      citiesCache = {};
    }
  }
  return citiesCache;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get('country') || '').trim();
  const state = (searchParams.get('state') || '').trim();

  if (!country) {
    return NextResponse.json({ error: 'Parameter country wajib diisi' }, { status: 400 });
  }

  try {
    const all = getCities();
    const byState = all[country.toUpperCase()];

    if (!byState) {
      return NextResponse.json(
        { country, state: state || null, count: 0, cities: [] },
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
      );
    }

    let cities: string[] = [];
    if (state) {
      const key = Object.keys(byState).find(
        k => k.toLowerCase() === state.toLowerCase()
      );
      cities = key ? (byState[key] || []) : [];
    } else {
      cities = [...new Set(Object.values(byState).flat())].sort();
    }

    return NextResponse.json(
      { country, state: state || null, count: cities.length, cities },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (err) {
    console.error('Geo cities route error:', err);
    return NextResponse.json({ error: 'Gagal memuat data kota' }, { status: 500 });
  }
}
