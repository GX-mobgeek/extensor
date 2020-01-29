import { expect } from "chai";
import { makeClient, makeServers } from "./utils";
import auth from "../src/auth";

describe("authentication", () => {
  let ioServer;
  let httpServer;
  let stop;
  let client;

  const init = ({ authOptions } = {}) => {
    const servers = makeServers();
    ioServer = servers.ioServer;
    httpServer = servers.httpServer;
    stop = servers.stop;
    auth(ioServer, authOptions);
    client = makeClient(httpServer, { autoConnect: false });
    auth(client);
  };

  afterEach(() => {
    client.close();
    stop();
  });

  it("throw if no handlers", () => {
    expect(() => {
      init();
      ioServer.auth();
    }).to.throw("You need a handler at least.");
    expect(() => {
      init();
      ioServer.auth({});
    }).to.throw("You need a handler at least.");
  });

  it("throw if no async handler", () => {
    expect(() => {
      init();
      ioServer.auth({
        server() {}
      });
    }).to.throw("Authentication handler must be a async function.");
    expect(() => {
      init();
      ioServer.auth({
        credential() {}
      });
    }).to.throw("Authentication handler must be a async function.");
  });

  it("prevent event when socket not authorized yet", done => {
    init();
    let value;
    ioServer.auth({
      async server({ done }) {
        setTimeout(() => {
          done(true);
        }, 50);
      }
    });

    ioServer.on("connection", socket => {
      socket.on("test", sent => {
        value = sent;
      });

      socket.on("end", () => {
        expect(value).to.be.equal(1);
        done();
      });
    });

    client.open();
    client.on("connect", async () => {
      client.emit("test", 0);

      await client.auth();

      client.emit("test", 1);
      client.emit("end");
    });
  });

  it("credential and server condition", done => {
    init();
    ioServer.auth({
      async server() {
        return { foo: "bar" };
      },
      async credential({ data: { token } }) {
        return token === 1;
      }
    });

    client.open();

    client.on("connect", async () => {
      const first = await client.auth();
      const second = await client.auth({ token: 1 });

      expect(first).to.be.equal(true);
      expect(second).to.be.equal(true);
      done();
    });
  });

  describe("server condition", () => {
    it("prevent promise resolve when done already called", done => {
      init();
      ioServer.auth({
        async server({ done }) {
          done(true);
          return true;
        }
      });

      let calls = 0;
      client.open();
      client.on("connect", () => {
        client.auth(result => {
          calls++;
        });

        setTimeout(() => {
          expect(calls).to.be.equal(1);
          done();
        }, 100);
      });
    });

    it('prevent "done" call when promise already resolved', done => {
      init();
      ioServer.auth({
        async server({ done }) {
          setTimeout(() => done(true), 50);
          return true;
        }
      });

      let calls = 0;
      client.open();
      client.on("connect", () => {
        client.auth(result => {
          calls++;
        });

        setTimeout(() => {
          expect(calls).to.be.equal(1);
          done();
        }, 100);
      });
    });

    it("deny", done => {
      init();
      ioServer.auth({
        async server() {
          return false;
        }
      });

      client.open();

      client.auth(result => {
        expect(result).to.be.equal(false);
        done();
      });
    });
  });

  describe("credential", () => {
    it("prevent promise resolve when done already called", done => {
      init();
      ioServer.auth({
        async credential({ data, done }) {
          done(data.token === 1);
          return data.token === 1;
        }
      });

      let calls = 0;
      client.open();
      client.on("connect", () => {
        client.auth({ token: 1 }, result => {
          calls++;
        });

        setTimeout(() => {
          expect(calls).to.be.equal(1);
          done();
        }, 100);
      });
    });

    it('prevent "done" call when promise already resolved', done => {
      init();
      ioServer.auth({
        async credential({ done }) {
          setTimeout(() => done(true), 50);
          return true;
        }
      });

      let calls = 0;
      client.open();
      client.on("connect", () => {
        client.auth({ token: 1 }, result => {
          calls++;
        });

        setTimeout(() => {
          expect(calls).to.be.equal(1);
          done();
        }, 100);
      });
    });

    it("deny", done => {
      init();
      ioServer.auth({
        async credential({ data }) {
          return data.token === 2;
        }
      });

      client.open();
      client.on("connect", async () => {
        const result = await client.auth({ token: 1 });

        expect(result).to.be.equal(false);
        done();
      });
    });

    it("attach returned object", done => {
      init();
      ioServer.auth({
        async credential({ done, data }) {
          return { userId: 123 };
        }
      });

      ioServer.on("connection", socket => {
        socket.on("test", () => {
          expect(socket.userId).to.be.equal(123);
          done();
        });
      });

      client.open();
      client.on("connect", async () => {
        await client.auth({ token: 1 });
        client.emit("test");
      });
    });

    it("timeout", done => {
      init({ authOptions: { timeout: 0.2 } });

      ioServer.auth({
        async credential({ done }) {
          return true;
        }
      });
      client.open();
      client.on("connect", () => {
        // client.auth.timeout(() => {
        // })
        client.on("authTimeout", () => {
          done();
        });
      });
    });

    it("clear timer after authentication", done => {
      init({ authOptions: { timeout: 20000 } });

      ioServer.auth({
        async credential() {
          return true;
        }
      });
      client.open();
      client.on("connect", async () => {
        await client.auth({ token: 1 });
        done();
      });
    });
  });
});
