import { Server } from "http";
import io from "socket.io";
import ioClient from "socket.io-client";

export function makeClient(srv, opts) {
  let addr = srv.address();
  if (!addr) addr = srv.listen().address();
  const url = "ws://localhost:" + addr.port;
  return ioClient(url, opts);
}

export function makeServers(opts) {
  const httpServer = Server();
  const ioServer = io(httpServer, opts);

  return {
    ioServer,
    httpServer,
    stop() {
      ioServer.close();
      httpServer.close();
    }
  };
}

export function makeAdapter() {
  const store = {};

  return {
    getAll: () => store,
    get: async key => store[key],
    set: async (key, value) => (store[key] = value),
    del: async key => delete store[key]
  };
}

export function makeThrowAdapter({
  get = { count: Infinity, msg: "get error" },
  set = { count: Infinity, msg: "set error" },
  del = { count: Infinity, msg: "del error" }
} = {}) {
  get.calls = 0;
  set.calls = 0;
  del.calls = 0;
  return {
    get: async () => {
      get.calls++;
      if (get.calls === get.count) throw new Error(get.msg);
      return true;
    },
    set: async () => {
      set.calls++;
      if (set.calls === set.count) throw new Error(set.msg);
      return true;
    },
    del: async () => {
      del.calls++;
      if (del.calls === del.count) throw new Error(del.msg);
      return true;
    }
  };
}

export const map = {
  chatMsg: {
    id: 2,
    schema: {
      content: "string",
      ts: "varuint"
    }
  }
};
