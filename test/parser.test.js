import { expect } from "chai";
import { makeClient, makeServers, map } from "./utils";
import parser from "../src/parser";

describe("parser", function() {
  let ioServer;
  let httpServer;
  let stop;
  let client;

  beforeEach(() => {
    const opts = {
      parser: parser(map)
    };
    const servers = makeServers(opts);
    ioServer = servers.ioServer;
    httpServer = servers.httpServer;
    stop = servers.stop;
    client = makeClient(httpServer, { ...opts, autoConnect: false });
  });

  afterEach(() => {
    client.close();
    stop();
  });

  it("should be able to serialize packets", function(done) {
    const intValue = Math.round(Date.now() / 1000);
    const circular = {};
    circular.circular = circular;

    ioServer.on("connection", socket => {
      socket.on("chat_Msg", ({ content, ts }) => {
        expect(content).to.be.equal("perfOnTop");
        expect(ts).to.be.equal(intValue);

        expect(() => socket.emit("cov", circular)).to.throw(
          "Maximum call stack size exceeded"
        );
        done();
      });
    });

    client.open();

    client.on("connect", () => {
      client.emit("chat_Msg", {
        content: "perfOnTop",
        ts: intValue
      });

      // Coverage purpose
      // To check if has binary on packet socket.io use has-binary2 module that use a recursive approach
      // causing "Maximum call stack size exceeded"
      // this happen before call the parser.
      // Think about recursive approachs.
      client.emit("cov", circular);
    });
  });

  it("should be able to serialize maped events", function(done) {
    const intValue = Math.round(Date.now() / 1000);

    ioServer.on("connection", socket => {
      socket.on("chatMsg", ({ content, ts }, ack) => {
        expect(content)
          .to.be.a("string")
          .that.be.equal("perfOnTop");
        expect(ts)
          .to.be.a("number")
          .that.be.equal(intValue);
        done();
      });
    });

    client.open();

    client.on("connect", () => {
      client.emit("chatMsg", {
        content: "perfOnTop",
        ts: Math.round(Date.now() / 1000)
      });
    });
  });

  it("throw if undefined event id", () => {
    expect(() => {
      makeServers({
        parser: parser({
          chatMsg: {
            schema: "string"
          }
        })
      });
    }).to.throw("Undefined ID for event chatMsg");
  });

  it("throw if undefined event schema", () => {
    expect(() => {
      makeServers({
        parser: parser({
          chatMsg: {
            id: 1
          }
        })
      });
    }).to.throw("Undefined schema for event chatMsg");
  });

  it("Binary event thats not defined in event map", done => {
    ioServer.on("connection", socket => {
      socket.on("buffWithouSchema", data => {
        expect(Buffer.from(data).toString()).to.be.equal("foo");
        done();
      });
    });

    client.open();

    client.on("connect", () => {
      client.emit("buffWithouSchema", Buffer.from("foo"));
    });
  });
});
