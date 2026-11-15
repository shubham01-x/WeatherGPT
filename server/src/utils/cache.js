const store = new Map();
export async function cached(key, ttlSeconds, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  if (store.size > 500) for (const [k, v] of store) if (v.expires <= Date.now()) store.delete(k);
  return value;
}
export const ttl = Number(process.env.CACHE_TTL_SECONDS || 300);
