import { expect } from "chai";
import createInMemoryStorage from "../src/in-memory-storage";

describe("in-memory storage object", () => {
  it("set", async () => {
    const store = createInMemoryStorage();

    await store.set("foo", "bar");

    const foo = await store.get("foo");

    expect(foo).to.be.eq("bar");
  });

  it("delete", async () => {
    const store = createInMemoryStorage();

    await store.set("foo", "bar");

    const foo = await store.get("foo");

    expect(foo).to.be.eq("bar");

    await store.del("foo");

    const bar = await store.get("foo");

    expect(bar).to.be.eq(null);
  });

  it("expirable", done => {
    (async function() {
      const store = createInMemoryStorage();

      await store.set("foo", "bar", 0.0005);

      setTimeout(async () => {
        const foo = await store.get("foo");

        expect(foo).to.be.eq(null);
        done();
      }, 50);
    })();
  });
});
