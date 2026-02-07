import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── File-based persistent cache ────────────────────────────────────────
// Geocoded coordinates are saved to a JSON file so they survive server
// restarts. After the first load, every subsequent page refresh is instant.
const CACHE_FILE = path.join(process.cwd(), ".geocode-cache.json");

function loadCacheFromFile(): Record<
  string,
  { lat: number; lng: number } | null
> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[Geocode] Could not read cache file:", err);
  }
  return {};
}

function saveCacheToFile(
  cache: Record<string, { lat: number; lng: number } | null>
) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    console.log(
      `[Geocode] Cache saved (${Object.keys(cache).length} entries)`
    );
  } catch (err) {
    console.warn("[Geocode] Could not write cache file:", err);
  }
}

// In-memory mirror, lazily loaded from the file on first request
let memoryCache: Record<string, { lat: number; lng: number } | null> | null =
  null;

function getCache(): Record<string, { lat: number; lng: number } | null> {
  if (memoryCache === null) {
    memoryCache = loadCacheFromFile();
    console.log(
      `[Geocode] Loaded ${Object.keys(memoryCache).length} entries from cache file`
    );
  }
  return memoryCache;
}

// ── Single geocode via Google API ──────────────────────────────────────
async function geocodeSingle(
  orgName: string,
  apiKey: string
): Promise<{ lat: number; lng: number } | null> {
  const cache = getCache();

  if (orgName in cache) {
    return cache[orgName];
  }

  const query = `${orgName}, Wales, UK`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Geocode] API ${response.status} for: ${orgName}`);
      cache[orgName] = null;
      return null;
    }

    const data = await response.json();

    if (data.results?.length > 0) {
      const loc = data.results[0].geometry.location;
      const result = { lat: loc.lat, lng: loc.lng };
      console.log(`[Geocode] Found: ${orgName} -> ${result.lat}, ${result.lng}`);
      cache[orgName] = result;
      return result;
    }

    console.log(`[Geocode] No results: ${orgName}`);
    cache[orgName] = null;
    return null;
  } catch (error) {
    console.error(`[Geocode] Error for ${orgName}:`, error);
    cache[orgName] = null;
    return null;
  }
}

// ── Parallel batch geocoding with concurrency limit ────────────────────
async function geocodeBatch(
  names: string[],
  apiKey: string,
  concurrency = 10
): Promise<Record<string, { lat: number; lng: number } | null>> {
  const cache = getCache();
  const results: Record<string, { lat: number; lng: number } | null> = {};

  // Separate cached vs uncached
  const uncached: string[] = [];
  for (const name of names) {
    if (name in cache) {
      results[name] = cache[name];
    } else {
      uncached.push(name);
    }
  }

  console.log(
    `[Geocode] ${names.length} requested — ${names.length - uncached.length} cached, ${uncached.length} to fetch`
  );

  // Process uncached names in parallel batches
  for (let i = 0; i < uncached.length; i += concurrency) {
    const batch = uncached.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((name) => geocodeSingle(name, apiKey))
    );
    batch.forEach((name, idx) => {
      results[name] = batchResults[idx];
    });
  }

  // Persist to file after every batch request
  if (uncached.length > 0) {
    saveCacheToFile(cache);
  }

  return results;
}

// ── POST handler ───────────────────────────────────────────────────────
// Supports two shapes:
//   Single:  { organizationName: "…" }   -> { lat, lng } | null
//   Batch:   { organizationNames: [...] } -> { results: { … } }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const isBatch = Array.isArray(body.organizationNames);
    const names: string[] = isBatch
      ? body.organizationNames
      : body.organizationName
        ? [body.organizationName]
        : [];

    if (names.length === 0) {
      return NextResponse.json(
        { error: "Organization name(s) required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    const uniqueNames = [...new Set(names)];
    const results = await geocodeBatch(uniqueNames, apiKey);

    // Backward-compatible single-name response
    if (!isBatch) {
      return NextResponse.json(results[names[0]]);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[Geocode] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to geocode locations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
