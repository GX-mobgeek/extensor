///<reference types="../src/extensor" />
import { auth, unique, withAuth, forceOne, buildParser } from "../src";
import { makeClient, makeServers } from "./mocks";

describe("common", () => {
  it("both auth methods and unique connections", done => {
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

describe("breaking-changes warnings", () => {
  it("warn withAuth", () => {
    expect(withAuth).toThrowError(
      "The things has changed, breaking changes, read the docs again."
    );
  });

  it("warn forceOne", () => {
    expect(forceOne).toThrowError(
      "The things has changed, breaking changes, read the docs again."
    );
  });

  it("warn buildParser", () => {
    expect(buildParser).toThrowError(
      "The things has changed, breaking changes, this method has not get changed but is from an old version of this module, read the docs again."
    );
  });
});
