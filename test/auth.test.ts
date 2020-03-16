///<reference types="../src/extensor" />
import { Server } from "http";
import { makeClient, makeServers } from "./mocks";
import auth from "../src/auth";

describe("authentication", () => {
  let ioServer: SocketIO.Server;
  let httpServer: Server;
  let stop: () => void;
  let client: SocketIOClient.Socket;

  const init = (options?: Extensor.Options) => {
    const servers = makeServers();
    ioServer = servers.ioServer;
    httpServer = servers.httpServer;
    stop = servers.stop;
    auth(ioServer, options);
    client = makeClient(httpServer, { autoConnect: false });
    auth(client);
  };

  afterEach(() => {
    client.close();
    stop();
  });

  test("prevent event when socket not authorized yet", done => {
    init();
    let value: number;

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      socket.auth((_data, done) => {
        setTimeout(() => {
          done(true);
        }, 50);
      });

      socket.on("test", sent => {
        value = sent;
      });

      socket.on("end", () => {
        expect(value).toBe(1);
        done();
      });
    });

    client.open();
    client.on("connect", async () => {
      client.emit("test", 0);

      await (client as Extensor.ClientSocket).auth(123);

      client.emit("test", 1);
      client.emit("end");
    });
  });

  it("allow", done => {
    init();

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      await socket.auth(data => {
        return data.token === 1;
      });

      done();
    });

    client.open();

    client.on("connect", async () => {
      expect(await (client as Extensor.ClientSocket).auth({ token: 1 })).toBe(
        true
      );
    });
  });

  it("deny", done => {
    init();
    const errorMessage = "error message";

    ioServer.on("connection", (socket: Extensor.ServerSocket) => {
      socket
        .auth(() => {
          throw new Error(errorMessage);
        })
        .catch(() => {});
    });

    client.open();
    client.on("connect", () => {
      (client as Extensor.ClientSocket).auth({ token: 1 }).catch(error => {
        expect(error).toBe(errorMessage);
        done();
      });
    });
  });

  it("merge props to client socket", done => {
    init();

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      await socket.auth(async data => {
        return data.token === 1 && { userId: 123 };
      });
    });

    client.open();
    client.on("connect", async () => {
      await (client as Extensor.ClientSocket).auth({ token: 1 });
      expect((client as Extensor.ClientSocket).userId).toBe(123);
      done();
    });
  });

  it("timeout", done => {
    init();

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      socket.auth((_data, done) => done(true), { timeout: 0.2 });
    });

    client.open();

    client.on("connect", () => {
      client.on("authTimeout", () => {
        done();
      });
    });
  });

  it("clear timeout after authentication", done => {
    init();

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      socket.auth((_data, done) => done(true), { timeout: 20000 });
    });

    client.open();
    client.on("connect", async () => {
      await (client as Extensor.ClientSocket).auth({ token: 1 });
      done();
    });
  });

  it("extend authorized events", done => {
    init({ authorizedEvents: ["foo"] });
    let i = 0;

    ioServer.on("connection", async (socket: Extensor.ServerSocket) => {
      socket.auth((_data, done) => done(true));

      socket.on("bar", () => {
        ++i;
      });

      socket.on("foo", () => {
        ++i;
      });
    });

    client.open();
    client.on("connect", async () => {
      client.emit("bar", "");
      client.emit("foo", "");
      await (client as Extensor.ClientSocket).auth({ token: 1 });
      expect(i).toBe(1);
      done();
    });
  });
});
