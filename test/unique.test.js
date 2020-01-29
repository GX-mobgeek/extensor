import { expect } from "chai";
import debug from "debug";
import {
  makeClient,
  makeServers,
  makeAdapter,
  makeThrowAdapter
} from "./utils";
import unique, { debug as uniqueDebug } from "../src/unique";

describe("unique connection", () => {
  let ioServer;
  let httpServer;
  let stop;

  function createClient(opts = {}) {
    return makeClient(httpServer, opts);
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

    conn2.on("error", err => {
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
    const key = "extensorUniqueState:::ffff:127.0.0.1node-xmlhttprequest";

    const storage = makeAdapter();
    unique(ioServer, { storage });

    const client = createClient();

    client.on("connect", async () => {
      const result = await storage.get(key);
      expect(result).to.be.eq(1);
      client.disconnect();
    });

    client.on("disconnect", () => {
      setTimeout(async () => {
        const result = await storage.get(key);
        expect(result).to.be.eq(undefined);

        done();
      }, 50);
    });
  });
  it("catch renew error", done => {
    const storage = makeThrowAdapter({ set: { count: 2, msg: "renewErr" } });
    function onError(err) {
      expect(err.message).to.be.eq("renewErr");
      expect(err.local).to.be.eq("renew");
      done();
    }
    unique(ioServer, { storage, onError, aliveTimeout: 100 });
    createClient();
  });

  it("default error handler", done => {
    debug.enable("extensor:unique");
    const logs = [];
    uniqueDebug.log = function() {
      logs.push(arguments[2]);
    };

    const storage = makeThrowAdapter({
      set: { count: 1, msg: "defaultErrorHandlerCheck" }
    });

    unique(ioServer, { storage });
    createClient();

    setTimeout(() => {
      debug.disable("extensor:unique");

      expect(logs).to.contain("defaultErrorHandlerCheck");
      done();
    }, 50);
  });

  it("catch error in middleware", done => {
    const storage = makeThrowAdapter({
      get: { count: 1, msg: "middlewareError" }
    });

    function onError(err, socket) {
      expect(err.message).to.be.eq("middlewareError");
      expect(err.local).to.be.eq("middleware");
      done();
    }
    unique(ioServer, { storage, onError });
    createClient();
  });

  it("catch error on disconnect event", done => {
    const storage = makeThrowAdapter({
      del: { count: 1, msg: "disconnectDelError" }
    });

    function onError(err, socket) {
      expect(err.message).to.be.eq("disconnectDelError");
      expect(err.local).to.be.eq("disconnect");
      done();
    }
    unique(ioServer, { storage, onError });
    const client = createClient();

    client.on("connect", () => client.disconnect());
  });
});
