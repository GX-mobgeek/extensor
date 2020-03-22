import ExtensorLocalStorage from "./storage-adapters/local";
import { ServerDebug, slugify } from "./utils";
import { kExtensorAuthHandling } from "./symbols";
import { UniqueOptions } from "./types";

export const debug = ServerDebug.extend("unique");

export default function uniqueConnections(
  io: SocketIO.Server,
  {
    identifier,
    onError = (local: string, e: Error, _socket: SocketIO.Socket) => {
      debug("%s: %s", local, e.message);
    },
    storage = new ExtensorLocalStorage()
  }: UniqueOptions = {}
) {
  debug("start");
  const keys = new Set();

  io.use(async (socket, next) => {
    try {
      if ((io as any)[kExtensorAuthHandling] === true && identifier) {
        await (socket as any).auth;
      }

      const id = getId(socket, identifier);
      const key = `extensorUniqueState:${id}`;

      debug("handling socket id: %s; identifier: %s", socket.id, id);

      if (await storage.get(key)) {
        return next(new Error("multiple attemp"));
      }
      await storage.set(key, 1);
      keys.add(key);

      socket.on("disconnect", () => {
        keys.delete(key);
        storage.del(key).catch(e => {
          onError("disconnect", e, socket);
        });
      });

      next();
    } catch (e) {
      debug(`error in check of socket id "${socket.id}": ${e.message}`);

      onError("middleware", e, socket);

      return next(new Error("multiple check fail"));
    }
  });

  process.on("exit", function() {
    storage.deleteAll(Array.from(keys) as string[]);
  });
}

function getId(
  socket: SocketIO.Socket,
  identifier: UniqueOptions["identifier"]
) {
  if (identifier && identifier in socket) {
    return (socket as any)[identifier as string];
  }
  const { headers } = socket.handshake;
  const ip =
    headers["x-real-ip"] ||
    headers["x-forwarded-for"] ||
    socket.handshake.address;

  return `${ip}${slugify(headers["user-agent"])}`;
}
