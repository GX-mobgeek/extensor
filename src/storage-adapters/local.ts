import { Storage } from "../types";

export default class LocalStorage implements Storage {
  itens: { [key: string]: any } = {};

  async get(key: string) {
    if (!(key in this.itens)) return null;

    return this.itens[key];
  }

  async set(key: string, value: any) {
    return (this.itens[key] = value);
  }

  async del(key: string) {
    delete this.itens[key];
    return 1;
  }

  async deleteAll(keys: string[]) {
    keys.map(key => this.del(key));
    return keys.length;
  }
}
