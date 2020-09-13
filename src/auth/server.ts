import watchPackets from "../watch-packets";
import { EVENTS } from "../constants";
import { Server, Namespace, Socket } from "socket.io";
import {
  kExtensorAuthHandling,
  kSocketAuthStatus,
  kSocketAuthTimeout
} from "../symbols";
import { ServerDebug, defer } from "../utils";
import { AuthHandler, AuthOptions, AuthDoneResponse } from "../types";

const debug = ServerDebug.extend("auth");

export default function ServerAuthWrapper(
  io: Server | Namespace,
  handler: AuthHandler,
  options: AuthOptions = {}
) {
  (io as any)[kExtensorAuthHandling] = true;

  io.use(async (socket: Socket, next: (error?: any) => void) => {
    watchPackets(socket, options.authorizedEvents);

    socket[kSocketAuthStatus] = false;
    debug("[socket %s]: watching packets", socket.id);

    next();

    if ("timeout" in options && options.timeout !== false) {
      socket[kSocketAuthTimeout] = (setTimeout(
        (socket: Socket) => {
          socket.emit(EVENTS.AUTH_TIMEOUT);
          debug("[socket %s]: auth timeout", socket.id);
          socket.disconnect(true);
        },
        options.timeout as number,
        socket
      ) as unknown) as NodeJS.Timeout;
    }

    const { resolve, reject, promise } = defer();

    (socket as any).auth = promise;

    socket.on(EVENTS.AUTHORIZE, async (data, ack) => {
      if ("timeout" in options && options.timeout !== false) {
        debug("[socket %s]: clear timeout", socket.id, options.timeout);
        clearTimeout(socket[kSocketAuthTimeout] as NodeJS.Timeout);
      }

      function done(result: AuthDoneResponse) {
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

        socket[kSocketAuthStatus] = true;

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
