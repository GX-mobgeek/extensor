///<reference types="../src/extensor" />
import { extend, withAuth, forceOne, buildParser } from "../src";
import * as extendClient from "../src/client";
import * as server from "../src/server";
import { makeClient, makeServers } from "./mocks";

describe("common", () => {
  it("both auth methods and unique connections", done => {
    const { ioServer, httpServer } = makeServers();
    extend(ioServer);

    ioServer.on("connection", (socket: Extensor.ServerSocket) => {
      socket.auth(data => {
        return data.token === 1;
      });
    });

    const client: SocketIOClient.Socket = makeClient(httpServer);

    extend(client);

    client.on("connect", async () => {
      await (client as Extensor.ClientSocket).auth({ token: 1 });
      done();
    });
  });

  it("separated envoriments", () => {
    const { ioServer, httpServer } = makeServers();

    server.extend(ioServer);

    const client: SocketIOClient.Socket = makeClient(httpServer);

    extendClient.auth(client);

    (client as Extensor.ClientSocket).auth(client);
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
