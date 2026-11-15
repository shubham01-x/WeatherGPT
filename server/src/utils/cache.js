
const store = new Map();
const pending = new Map();

const MAX_CACHE_SIZE = 500;

function cleanExpired() {
  const now = Date.now();

  for (const [key, entry] of store) {
    if (entry.expires <= now) {
      store.delete(key);
    }
  }
}

export async function cached(key, ttlSeconds, loader) {
  const now = Date.now();

  const hit = store.get(key);

  if (hit && hit.expires > now) {
    store.delete(key);
    store.set(key, hit);
    return hit.value;
  }

  if (hit) {
    store.delete(key);
  }

  if (pending.has(key)) {
    return pending.get(key);
  }

  const request = Promise.resolve().then(loader);

  pending.set(key, request);

  try {
    const value = await request;
    const duration = Math.max(0, Number(ttlSeconds) || 0);

    if (duration > 0) {
      cleanExpired();

      store.set(key, {
        value,
        expires: Date.now() + duration * 1000
      });

      while (store.size > MAX_CACHE_SIZE) {
        const oldestKey = store.keys().next().value;
        store.delete(oldestKey);
      }
    }

    return value;
  } finally {
    if (pending.get(key) === request) {
      pending.delete(key);
    }
  }
}

export const ttl = Number(process.env.CACHE_TTL_SECONDS || 300);
