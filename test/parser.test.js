import { expect } from "chai";
import { makeClient, makeServers, map } from "./utils";
import parser from "../src/parser";

describe("parser", function() {
  const packet = {
    content: "perfOnTop",
    ts: Math.round(Date.now() / 1000)
  };

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

  it("serialize non mapped events", function(done) {
    ioServer.on("connection", socket => {
      socket.on("chat_Msg", ({ content, ts }, ack) => {
        expect(content).to.be.eq(packet.content);
        expect(ts).to.be.eq(packet.ts);

        ack();
      });
    });

    client.open();

    client.on("connect", () => {
      client.emit("chat_Msg", packet, done);
    });
  });

  it("serialize maped events", function(done) {
    ioServer.on("connection", socket => {
      socket.on("chatMsg", ({ content, ts }, ack) => {
        expect(content).to.be.eq(packet.content);
        expect(ts).to.be.eq(packet.ts);

        return ack ? ack() : done();
      });
    });

    client.open();

    client.on("connect", () => {
      client.emit("chatMsg", packet, () => {
        client.emit("chatMsg", packet);
      });
    });
  });

  describe("throws", () => {
    const circular = {};
    circular.circular = circular;

    const encoderJsonErrorPacket = {
      type: 2,
      data: ["bar", circular],
      options: { compress: true },
      nsp: "/"
    };

    const mappedErrorPacket = {
      type: 2,
      data: ["chatMsg", false],
      options: { compress: true },
      nsp: "/"
    };

    function createParser() {
      const { Encoder, Decoder, schemas } = parser({
        chatMsg: {
          id: 2,
          schema: {
            content: "string",
            ts: "varuint"
          }
        },
        foo: {
          id: 1,
          schema: "boolean"
        }
      });

      const encoder = new Encoder();
      const decoder = new Decoder();

      return { encoder, decoder, schemas };
    }
    describe("encoder", () => {
      it("throws invalid json", done => {
        createParser().encoder.encode(encoderJsonErrorPacket, ([packet]) => {
          expect(packet).to.be.eq('{"type": 4, "data": "parser error"}');
          done();
        });
      });

      it("throws invalid binary", done => {
        createParser().encoder.encode(mappedErrorPacket, ([packet]) => {
          expect(packet).to.be.eq('{"type": 4, "data": "parser error"}');
          done();
        });
      });
    });

    describe("decoder", () => {
      it("throws invalid json", done => {
        const { decoder } = createParser();
        decoder.on("decoded", packet => {
          expect(packet.type).to.be.eq(4);
          expect(packet.data).to.be.eq(
            "parser error: Unexpected token ; in JSON at position 0"
          );
          done();
        });
        decoder.add(";{}");
      });

      it("throws invalid binary", done => {
        const { decoder } = createParser();

        decoder.on("decoded", packet => {
          expect(packet.type).to.be.eq(4);
          expect(packet.data).to.be.eq(
            "parser error: Cannot read property 'decode' of undefined"
          );
          done();
        });

        decoder.add(Buffer.from(""));
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

  it("binary event thats not defined in event map", done => {
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
