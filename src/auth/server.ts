import watchPackets from "../watch-packets";
import { EVENTS } from "../constants";
import {
  kExtensorAuthHandling,
  kSocketAuthStatus,
  kSocketAuthTimeout
} from "../symbols";
import { ServerDebug, defer } from "../utils";

const debug = ServerDebug.extend("auth");

export default function ServerAuthWrapper(
  io: SocketIO.Server,
  handler: Extensor.AuthHandler,
  options: Extensor.Options = {}
) {
  (io as any)[kExtensorAuthHandling] = true;

  io.use(async (socket: SocketIO.Socket, next: (error?: any) => void) => {
    watchPackets(socket, options.authorizedEvents);

    (socket as Extensor.ServerSocket)[kSocketAuthStatus] = false;
    debug("[socket %s]: watching packets", socket.id);

    next();

    if ("timeout" in options && options.timeout !== false) {
      (socket as Extensor.ServerSocket)[kSocketAuthTimeout] = setTimeout(
        (socket: SocketIO.Socket) => {
          socket.emit("authTimeout");
          debug("[socket %s]: auth timeout", socket.id);
          socket.disconnect(true);
        },
        options.timeout as number,
        socket
      );
    }

    const { resolve, reject, promise } = defer();

    (socket as Extensor.ServerSocket).auth = promise;

    socket.on(EVENTS.AUTHORIZE, async (data, ack) => {
      if ("timeout" in options && options.timeout !== false) {
        debug("[socket %s]: clear timeout", socket.id, options.timeout);
        clearTimeout((socket as Extensor.ServerSocket)[kSocketAuthTimeout]);
      }

      function done(result: Extensor.AuthDoneResponse) {
        let merge = {};

        if (result instanceof Error) {
          debug(
            "[socket %s]: auth failed, error: %s",
            socket.id,
            result.message
          );
          reject(result);
          ack({ error: result.message });

          socket.disconnect();
          return;
        }

        debug("[socket %s]: auth successful", socket.id);

        (socket as Extensor.ServerSocket)[kSocketAuthStatus] = true;

        if (result instanceof Object) {
          debug(
            "[socket %s]: send props to client socket: %o",
            socket.id,
            result
          );
          merge = { ...result };
        }

        resolve();

        ack({ merge });
      }

      debug("[socket %s]: waiting handler result", socket.id);

      try {
        const result = await handler({ socket, data, done });
        return typeof result !== "undefined" && done(result);
      } catch (e) {
        done(e);
      }
    });
  });
}
