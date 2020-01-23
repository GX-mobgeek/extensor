"use strict";
import { Server } from "http";
import io from "socket.io";
import ioClient from "socket.io-client";
import expect from "expect.js";
import map from "./map";

import { buildParser, withAuth, forceOne } from "../src";

// Creates a socket.io client for the given server
function client(srv, nsp, opts) {
  if (typeof nsp === "object") {
    opts = nsp;
    nsp = null;
  }
  let addr = srv.address();
  if (!addr) addr = srv.listen().address();
  const url = "ws://localhost:" + addr.port + (nsp || "");
  return ioClient(url, { ...opts, parser: buildParser(map) });
}

function ioServer() {
  const httpSrv = Server();
  const srv = io(httpSrv, {
    parser: buildParser(map)
  });

  return { httpSrv, srv };
}

const adapterStorage = {};

const customAdapter = {
  get: key =>
    new Promise((resolve, reject) => {
      try {
        if (!(key in adapterStorage)) resolve(null);

        const { expire, value } = adapterStorage[key];

        if (expire !== false && expire < Date.now()) {
          delete adapterStorage[key];
          return resolve(null);
        }

        return resolve(value);
      } catch (e) {
        reject(e);
      }
    }),
  set: (key, value, expire = false) =>
    new Promise((resolve, reject) => {
      try {
        if (expire !== false) {
          // expire defined aways in minutes, convert to ms
          expire *= 60000;
          expire += Date.now();
        }

        adapterStorage[key] = { expire, value };
        return resolve(true);
      } catch (e) {
        reject(e);
      }
    }),
  del: key =>
    new Promise((resolve, reject) => {
      try {
        if (key in adapterStorage) delete adapterStorage[key];

        return resolve(true);
      } catch (e) {
        reject(e);
      }
    })
};

describe("standard", function() {
  it("should be able to connect", function(done) {
    const { httpSrv } = ioServer();

    const socket = client(httpSrv);
    socket.on("connect", function() {
      done();
    });
  });
});

describe("parser", function() {
  it("should be able to serialize and acknowledgement packets", function(done) {
    const { srv, httpSrv } = ioServer();

    srv.on("connection", socket => {
      socket.on("chatMsg", ({ content, ts }, ack) => {
        expect(content).to.be.a("string");
        expect(ts).to.be.a("number");
        ack(true);
      });
    });

    const clientSocket = client(httpSrv);

    clientSocket.on("connect", () => {
      clientSocket.emit(
        "chatMsg",
        { content: "perfOnTop", ts: Math.round(Date.now() / 1000) },
        response => {
          try {
            expect(response).to.be.equal(true);
            done();
            clientSocket.disconnect();
            srv.close();
          } catch (e) {
            done(e);
          }
        }
      );
    });
  });
});

describe("authorization", function() {
  it("throw if attempt to attach reserved socket property", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.AUTO,
        timeout: 5000
      },
      next => {
        expect(() => next(true, { id: 1 })).to.throwError(
          /Invalid atach namespace: id/
        );
        done();
      }
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.AUTO }, result => {});
  });

  it("block unauthorized events", function(done) {
    const { srv, httpSrv } = ioServer();

    let watchedValue = "";

    withAuth(
      srv,
      {
        method: withAuth.AUTO,
        timeout: 5000
      },
      next => {
        setTimeout(() => {
          next(true);
        }, 10);
      }
    );

    srv.on("connection", socket => {
      socket.on("customEvent", value => {
        watchedValue = value;
      });
    });

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.AUTO }, result => {
      clientSocket.emit("customEvent", "yes");

      setTimeout(() => {
        expect(watchedValue).to.be("yes");
        done();
      }, 10);
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("customEvent", "no");
      // expect(watchedValue).to.be(false);
    });
  });

  it("should be able to authorize by server condition", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.AUTO,
        timeout: 5000
      },
      next => next(true)
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.AUTO }, result => {
      try {
        expect(result).to.equal(true);

        done();

        clientSocket.disconnect();
        srv.close();
      } catch (e) {
        done(e);
      }
    });
  });

  it("should be able to deny authorization by server condition", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.AUTO,
        timeout: 5000
      },
      next => next(false)
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.AUTO }, result => {
      try {
        expect(result).to.equal(false);

        done();

        clientSocket.disconnect();
        srv.close();
      } catch (e) {
        done(e);
      }
    });
  });

  it("should be able to authorize with request credentials", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.CREDENTIAL,
        timeout: 5000
      },
      (user, response) => response(user.login === "ferco" && user.pw === "123")
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.CREDENTIAL }, authorize => {
      authorize({ login: "ferco", pw: "123" }, result => {
        try {
          expect(result).to.equal(true);

          done();

          clientSocket.disconnect();
          srv.close();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it("should be able to deny authorization with request wrong credentials", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.CREDENTIAL,
        timeout: 5000
      },
      (user, response) => response(user.login === "ferco" && user.pw === "123")
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.CREDENTIAL }, authorize => {
      authorize({ login: "ferco", pw: "1223" }, result => {
        try {
          expect(result).to.equal(false);

          done();

          clientSocket.disconnect();
          srv.close();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it("should be able to authorize with two-steps", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.MIXED,
        timeout: 5000
      },
      next => next(true),
      (user, response) => response(user.login === "ferco" && user.pw === "123")
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.MIXED }, authorize => {
      try {
        expect(authorize).to.not.equal(false);

        authorize({ login: "ferco", pw: "123" }, result => {
          expect(result).to.equal(true);

          done();

          clientSocket.disconnect();
          srv.close();
        });
      } catch (e) {
        done(e);
      }
    });
  });

  it("should be able to deny on first in a two-step authorization", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.MIXED,
        timeout: 5000
      },
      next => next(false),
      (user, response) => response(user.login === "ferco" && user.pw === "123")
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.MIXED }, authorize => {
      try {
        expect(authorize).to.equal(false);

        done();

        clientSocket.disconnect();
        srv.close();
      } catch (e) {
        done(e);
      }
    });
  });

  it("should be able to deny on second in a two-step authorization", function(done) {
    const { srv, httpSrv } = ioServer();

    withAuth(
      srv,
      {
        method: withAuth.MIXED,
        timeout: 5000
      },
      next => next(true),
      (user, response) => response(user.login === "ferco" && user.pw === "123")
    );

    const clientSocket = client(httpSrv);

    withAuth(clientSocket, { method: withAuth.MIXED }, authorize => {
      try {
        expect(authorize).to.not.equal(false);

        authorize({ login: "ferco", pw: "1223" }, result => {
          expect(result).to.equal(false);

          done();

          clientSocket.disconnect();
          srv.close();
        });
      } catch (e) {
        done(e);
      }
    });
  });
});

describe("force one connection", function() {
  it("should be able to deny based on ip", function(done) {
    try {
      const { srv, httpSrv } = ioServer();

      forceOne(srv, {
        adapter: customAdapter,
        id: forceOne.IP
      });

      client(httpSrv);
      const clientSocketConn2 = client(httpSrv);

      forceOne(clientSocketConn2, () => {
        expect(clientSocketConn2.connected).to.be.equal(false);
        done();
      });
    } catch (e) {
      done(e);
    }
  });

  it("should be able to deny on ip and user-agent", function(done) {
    try {
      const { srv, httpSrv } = ioServer();

      forceOne(srv, {
        adapter: customAdapter,
        id: forceOne.IP_UA
      });

      client(httpSrv);
      const clientSocketConn2 = client(httpSrv);

      forceOne(clientSocketConn2, () => {
        expect(clientSocketConn2.connected).to.be.equal(false);
        done();
      });
    } catch (e) {
      done(e);
    }
  });

  it("should be able to deny based with authorization and id namespace provided", function(done) {
    try {
      const { srv, httpSrv } = ioServer();

      withAuth(
        srv,
        {
          method: withAuth.CREDENTIAL,
          timeout: 5000
        },
        (user, response) => {
          response(true, { userId: user.login });
        }
      );

      forceOne(srv, {
        adapter: customAdapter,
        id: "userId"
      });

      const clientSocketConn1 = client(httpSrv);
      const clientSocketConn2 = client(httpSrv);

      withAuth(
        clientSocketConn1,
        { method: withAuth.CREDENTIAL },
        authorize => {
          authorize({ login: "ferco", pw: "" });
        }
      );

      withAuth(
        clientSocketConn2,
        { method: withAuth.CREDENTIAL },
        authorize => {
          authorize({ login: "ferco", pw: "" });
        }
      );

      forceOne(clientSocketConn2, () => {
        expect(clientSocketConn2.connected).to.be.equal(false);
        done();
      });
    } catch (e) {
      done(e);
    }
  });
});
