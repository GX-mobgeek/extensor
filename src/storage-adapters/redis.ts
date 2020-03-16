import { RedisClient } from "redis";
import { promisify } from "util";

export default class RedisStorageAdapter implements Extensor.Storage {
  client: RedisClient;

  getAsync: (key: string) => Promise<string | null>;
  setAsync: (key: string, value: any) => Promise<any>;
  delAsync: (key: string) => Promise<any>;
  constructor(client: RedisClient) {
    this.client = client;
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  get(key: string) {
    return this.getAsync(key);
  }

  set(key: string, value: any) {
    return this.setAsync(key, value);
  }

  del(key: string) {
    return this.delAsync(key);
  }

  deleteAll(keys: [string]) {
    return this.delAsync.apply(this, keys);
  }
}
