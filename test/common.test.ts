import { auth, unique } from "../dist";
import { makeClient, makeServers } from "./mocks";

describe("common", () => {
  it("both auth method and force unique connections", done => {
    const { ioServer, httpServer } = makeServers();
    auth.server(ioServer, ({ socket, data }) => {
      (socket as any).userId = data.token;
      return data.token === 1;
    });

    unique(ioServer, { identifier: "userId" });

    const conn = makeClient(httpServer);
    const conn2 = makeClient(httpServer);

    conn.on("connect", async () => {
      auth.client(conn, { token: 1 });
    });

    conn2.on("connect", async () => {
      auth.client(conn2, { token: 1 });
    });

    conn2.on("error", (err: string) => {
      if (err === "multiple attemp") {
        done();
      }
    });
  });
});
