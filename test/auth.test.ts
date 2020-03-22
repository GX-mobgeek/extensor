import { Server } from "http";
import { makeClient, makeServers } from "./mocks";
import * as auth from "../src/auth";
import { ServerSocket } from "../src/types";

describe("authentication", () => {
  let io: SocketIO.Server;
  let httpServer: Server;
  let stop: () => void;
  let client: SocketIOClient.Socket;

  const init = () => {
    const servers = makeServers();
    io = servers.ioServer;
    httpServer = servers.httpServer;
    stop = servers.stop;
    client = makeClient(httpServer, { autoConnect: false });
  };

  beforeEach(() => init());

  afterEach(() => {
    client.close();
    stop();
  });

  test("prevent event when socket not authorized yet", done => {
    let value: number;

    auth.server(io, ({ data, done }) => {
      setTimeout(() => done(data === 123), 50);
    });

    io.on("connection", async socket => {
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

      await auth.client(client, 123);

      client.emit("test", 1);
      client.emit("end");
    });
  });

  it("allow", done => {
    auth.server(io, ({ data }) => {
      return data.token === 1;
    });

    io.on("connection", async (socket: ServerSocket) => {
      await socket.auth;

      done();
    });

    client.open();

    client.on("connect", async () => {
      expect(await auth.client(client, { token: 1 })).toBe(true);
    });
  });

  it("deny", done => {
    const message = "error message";

    auth.server(io, () => {
      throw new Error(message);
    });

    io.on("connection", socket => {
      (socket as ServerSocket).auth.catch((_err: Error) => {});
    });

    client.open();
    client.on("connect", () => {
      auth.client(client, { token: 1 }, error => {
        if (error) {
          expect((error as any).message).toBe(message);
        }
      });

      client.on("disconnect", () => {
        done();
      });
    });
  });

  it("merge props to client socket", done => {
    auth.server(io, ({ data }) => {
      return data.token === 1 && { userId: 123 };
    });

    client.open();
    client.on("connect", async () => {
      await auth.client(client, { token: 1 });
      expect((client as any).userId).toBe(123);
      done();
    });
  });

  it("timeout", done => {
    auth.server(io, () => true, { timeout: 0.2 });

    client.open();

    client.on("connect", () => {
      client.on("authTimeout", () => {
        done();
      });
    });
  });

  it("clear timeout after authentication", done => {
    auth.server(io, () => true, { timeout: 20000 });

    client.open();
    client.on("connect", async () => {
      await auth.client(client, true);
      done();
    });
  });

  it("extend authorized events", done => {
    let i = 0;

    auth.server(io, () => true, { authorizedEvents: ["foo"] });

    io.on("connection", async (socket: ServerSocket) => {
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
      await auth.client(client, true);
      expect(i).toBe(1);
      done();
    });
  });
});
