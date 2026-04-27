import { Readable } from 'stream';

export class MockRedisClient {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string, _expiryMode?: string, _time?: number): Promise<'OK'> {
    this.store.set(key, value);
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys.flat()) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async unlink(...keys: string[]): Promise<number> {
    return this.del(...keys);
  }

  scanStream({ match }: { match: string; count?: number }): Readable {
    const escaped = match.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`);
    const keys = [...this.store.keys()].filter((k) => regex.test(k));
    return Readable.from([keys]);
  }

  async quit(): Promise<'OK'> {
    return 'OK';
  }
}