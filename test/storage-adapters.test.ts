//@ts-nocheck
import { storageAdapters, Storage } from "../src";
import redis from "redis-mock";
import ioRedis from "ioredis-mock";

function testWith(title: string, store: Storage) {
  describe(`storage adapter: ${title}`, () => {
    it("set/get/delete", async () => {
      await store.set("foo", "bar");

      const foo = await store.get("foo");

      expect(foo).toBe("bar");

      await store.del("foo");

      expect(await store.get("foo")).toBeNull();
    });

    it("deleteAll", async () => {
      const keysValues: any = {
        foo: "foo",
        bar: "bar",
        foobar: "foobar"
      };

      for (const key in keysValues) {
        await store.set(key, keysValues[key]);
      }

      for (const key in keysValues) {
        expect(await store.get(key)).toBe(keysValues[key]);
      }

      await store.deleteAll(Object.keys(keysValues));

      for (const key in keysValues) {
        expect(await store.get(key)).toBeNull();
      }
    });
  });
}
testWith("local", new storageAdapters.Local());
testWith("redis", new storageAdapters.Redis(redis.createClient()));
testWith("ioredis", new storageAdapters.IORedis(new ioRedis()));
