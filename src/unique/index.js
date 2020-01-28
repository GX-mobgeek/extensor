import createInMemoryStorage from "../in-memory-storage";
import { debug as Debug, slugify } from "../utils";

const debug = Debug.extend("unique");

export default function uniqueConnections(
  io,
  {
    identifier,
    onError = false,
    storage = createInMemoryStorage(),
    aliveTimeout = 60000 * 5
  } = {}
) {
  debug("start");
  io.use(async (socket, next) => {
    try {
      const id = getId(socket, identifier);
      const key = `extensorUniqueState:${id}`;

      debug("handling socket id: %s; identifier: %s", socket.id, id);

      const conn = await storage.get(key);

      if (conn === 1) {
        return next(new Error("multiple attemp"));
      }

      await storage.set(key, 1, aliveTimeout * 1000);

      /**
       * If you use in a cluster and some node get crash,
       * this approach prevent the false positive of an active connection
       */
      const interval = setInterval(
        key => {
          storage.set(key, 1, aliveTimeout * 1000).catch(e => {
            if (onError) {
              const err = new Error(e.message);
              err.local = "renew";
              onError(err, socket);
            }
          });
        },
        aliveTimeout / 2,
        key
      );

      socket.on("disconnect", () => {
        clearInterval(interval);
        storage.del(key).catch(e => {
          if (onError) {
            const err = new Error(e.message);
            err.local = "disconnect";
            onError(err, socket);
          }
        });
      });

      next();
    } catch (e) {
      debug(`error in check of socket id "${socket.id}": ${e.message}`);
      if (typeof onError === "function") {
        const err = new Error(e.message);
        err.local = "middleware";
        onError(err, socket);
      }
      return next(new Error("multiple check fail"));
    }
  });
}

function getId(socket, identifier) {
  if (identifier in socket) {
    return socket[identifier];
  }
  const { headers } = socket.handshake;

  const ip =
    headers["x-real-ip"] ||
    headers["x-forwarded-for"] ||
    socket.handshake.address;

  return `${ip}${slugify(headers["user-agent"])}`;
}
