import { RedisClient } from "redis";
import { promisify } from "util";
import { Storage } from "../types";

export default class RedisStorageAdapter implements Storage {
  getAsync: (key: string) => Promise<string | null>;
  setAsync: (key: string, value: any) => Promise<any>;
  delAsync: (key: string) => Promise<any>;
  constructor(public client: RedisClient) {
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
    return this.delAsync(...keys);
  }
}
