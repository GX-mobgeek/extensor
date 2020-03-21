import { Server } from "http";
import io from "socket.io";
import ioClient from "socket.io-client";

export function makeClient(srv: Server, opts?: SocketIOClient.ConnectOpts) {
  let addr = srv.address();
  if (!addr) addr = srv.listen().address();
  const url = "ws://localhost:" + (addr as any).port;
  return ioClient(url, { ...opts, transports: ["websocket", "polling"] });
}

export function makeServers(opts?: any) {
  const httpServer = new Server();
  const ioServer = io(httpServer, {
    ...opts,
    transports: ["websocket", "polling"]
  });

  return {
    ioServer,
    httpServer,
    stop() {
      ioServer.close();
      httpServer.close();
    }
  };
}

type throwAdapterConfig = {
  [method: string]: {
    count: number;
    msg: string;
  };
};

export function makeThrowAdapter(config: throwAdapterConfig = {}) {
  config = {
    get: { count: Infinity, msg: "get error" },
    set: { count: Infinity, msg: "set error" },
    del: { count: Infinity, msg: "del error" },
    ...config
  };

  const calls = {
    get: 0,
    set: 0,
    del: 0
  };

  return {
    get: async (): Promise<string> => {
      calls.get++;
      if (calls.get === config.get.count) throw new Error(config.get.msg);

      return "";
    },
    set: async (key: string): Promise<string> => {
      calls.set++;
      if (calls.set === config.set.count) throw new Error(config.set.msg);
      return key;
    },
    del: async (): Promise<number> => {
      calls.del++;
      if (calls.del === config.del.count) throw new Error(config.del.msg);
      return 1;
    },
    async deleteAll(keys: string[]) {
      keys.map(this.del);
    }
  };
}

export const map = {
  chatMsg: {
    id: 255,
    schema: {
      content: "string",
      ts: "varuint"
    }
  }
};
