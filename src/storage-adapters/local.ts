import { Storage } from "../types";

export default class LocalStorage implements Storage {
  store = new Map();
  itens: { [key: string]: any } = {};

  async get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, value: any) {
    return this.store.set(key, value);
  }

  async del(key: string) {
    this.store.delete(key);
    return 1;
  }

  async deleteAll(keys: string[]) {
    keys.map(key => this.store.delete(key));
    return keys.length;
  }
}
