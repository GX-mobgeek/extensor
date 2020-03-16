///<reference types="../src/extensor" />
import debug from "debug";
import { Server } from "http";
import { makeClient, makeServers, makeThrowAdapter } from "./mocks";
import unique, { debug as uniqueDebug } from "../src/unique";
import { slugify } from "../src/utils";
import LocalStorage from "../src/storage-adapters/local";

describe("unique connection", () => {
  let ioServer: SocketIO.Server;
  let httpServer: Server;
  let stop: () => void;

  function createClient() {
    return makeClient(httpServer);
  }

  beforeEach(() => {
    const servers = makeServers();
    ioServer = servers.ioServer;
    httpServer = servers.httpServer;
    stop = servers.stop;
  });

  afterEach(() => {
    stop();
  });

  it("use local storage", done => {
    unique(ioServer);

    createClient();
    const conn2 = createClient();
    conn2.on("error", (err: string) => {
      if (err === "multiple attemp") {
        done();
        conn2.disconnect();
      }
    });
  });

  it("valid identifier socket prop", done => {
    unique(ioServer, { identifier: "id" });

    const conn = createClient();

    conn.on("connect", () => {
      done();
    });
  });

  it("clear state on disconnect", done => {
    // maybe, get from debug
    const key = `extensorUniqueState:::ffff:127.0.0.1${slugify(
      window.navigator.userAgent
    )}`;

    const storage = new LocalStorage();
    unique(ioServer, { storage });

    const client = createClient();

    client.on("connect", async () => {
      const result = await storage.get(key);
      expect(result).toBe(1);
      client.disconnect();
    });

    client.on("disconnect", () => {
      setTimeout(async () => {
        const result = await storage.get(key);
        expect(result).toBeNull();

        done();

        process.emit("exit", 1);
      }, 50);
    });
  });

  it("default error handler", done => {
    debug.enable("extensor:server:unique");
    const logs: string[] = [];
    uniqueDebug.log = function(...args: any[]) {
      logs.push(args[2]);
    };

    const storage = makeThrowAdapter({
      get: { count: 1, msg: "defaultErrorHandlerCheck" }
    });

    unique(ioServer, { storage });
    createClient();

    setTimeout(() => {
      (debug.disable as any)("extensor:server:unique");

      expect(logs).toEqual(
        expect.arrayContaining(["defaultErrorHandlerCheck"])
      );

      done();
    }, 50);
  });

  it("catch error in middleware", done => {
    const storage = makeThrowAdapter({
      get: { count: 1, msg: "middlewareError" }
    });

    function onError(local: string, err: Error) {
      expect(err.message).toBe("middlewareError");
      expect(local).toBe("middleware");
      done();
    }
    unique(ioServer, { storage, onError });
    createClient();
  });

  it("catch error on disconnect event", done => {
    const storage = makeThrowAdapter({
      del: { count: 1, msg: "disconnectDelError" }
    });

    function onError(local: string, err: Error) {
      expect(err.message).toBe("disconnectDelError");
      expect(local).toBe("disconnect");
      done();
    }
    unique(ioServer, { storage, onError });
    const client = createClient();

    client.on("connect", () => client.disconnect());
  });
});
