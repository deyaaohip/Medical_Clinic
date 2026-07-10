// Scalable Cache Interface (Redis Facade)
export interface ICacheClient {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePrefix(prefix: string): Promise<void>;
}

class CacheClientAdapter implements ICacheClient {
  private memoryStore: Map<string, { value: any; expiresAt?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.memoryStore.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    for (const [k] of this.memoryStore) {
      if (k.startsWith(prefix)) {
        this.memoryStore.delete(k);
      }
    }
  }
}

export const cacheClient = new CacheClientAdapter();
