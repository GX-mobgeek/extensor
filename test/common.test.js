import { expect } from "chai";
import extensor, { withAuth, forceOne, buildParser } from "../src";
import { addFunction } from "../src/attach";
import { makeClient, makeServers } from "./utils";

describe("full usage", () => {
  it("both auth methods", done => {
    const { ioServer, httpServer } = makeServers();
    extensor(ioServer);

    ioServer.auth({
      async server() {
        return true;
      },
      async credential({ data: { token } }) {
        if (token === 1) return { user: 123 };

        return false;
      }
    });

    const client = makeClient(httpServer);

    extensor(client);

    client.auth(async result => {
      if (await client.auth({ token: 1 })) {
        done();
      }
    });
  });
});

describe("breaking-changes warnings", () => {
  it("warn withAuth", () =>
    expect(withAuth).to.throw(
      "The things has changed, breaking changes, read the docs again."
    ));

  it("warn forceOne", () =>
    expect(forceOne).to.throw(
      "The things has changed, breaking changes, read the docs again."
    ));

  it("warn buildParser", () =>
    expect(buildParser).to.throw(
      "The things has changed, breaking changes, this method has not get changed but is from an old version of this module, read the docs again."
    ));
});
describe("attacher", () => {
  it("throw if invalid key", done => {
    const { ioServer, httpServer } = makeServers();
    const client = makeClient(httpServer, { autoConnect: false });

    ioServer.on("connection", socket => {
      addFunction(socket);
      // test: prevent link function redefinition
      addFunction(socket);

      expect(() => {
        socket.attach({ id: 123 });
      }).to.throw("Invalid attach key: id");
      done();
    });

    client.open();
  });
});
