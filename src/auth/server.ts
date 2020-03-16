import watchPackets from "../watch-packets";
import { EVENTS } from "../constants";
import { kSocketAuthStatus, kSocketAuthTimeout } from "../symbols";
import { ServerDebug } from "../utils";

const debug = ServerDebug.extend("auth");

export default function ServerAuthWrapper(
  io: SocketIO.Server,
  options: Extensor.Options = {}
) {
  io.use(async (socket: SocketIO.Socket, next: (error?: any) => void) => {
    watchPackets(socket, options.authorizedEvents);

    (socket as Extensor.ServerSocket)[kSocketAuthStatus] = false;
    debug("[socket %s]: watching packets", socket.id);

    next();
    (socket as Extensor.ServerSocket).auth = (
      handler: Extensor.AuthHandler,
      { timeout = false }: Extensor.Options = options
    ) => {
      return new Promise((resolve, reject) => {
        if (timeout !== false) {
          (socket as Extensor.ServerSocket)[kSocketAuthTimeout] = setTimeout(
            () => {
              socket.emit("authTimeout");
              debug("[socket %s]: auth timeout", socket.id);
              socket.disconnect(true);
            },
            timeout as number
          );
        }

        debug("[socket %s]: waiting credential", socket.id);

        socket.on(EVENTS.AUTHORIZE, async (data, ack) => {
          if (timeout !== false) {
            debug("[socket %s]: clear timeout", socket.id, timeout);
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
              return ack({ error: result.message });
            }

            debug("[socket %s]: auth successful", socket.id);

            (socket as Extensor.ServerSocket)[kSocketAuthStatus] = true;

            if (result instanceof Object) {
              debug(
                "[socket %s]: send client socket props: %o",
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
            const result = await handler(data, done);
            return typeof result !== "undefined" && done(result);
          } catch (e) {
            done(e);
            reject(e);
          }
        });
      });
    };
  });
}
