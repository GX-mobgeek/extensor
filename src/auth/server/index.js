import server from "./server";
import credential from "./credential.js";
import watchPackets from "../../watch-packets";
import { addFunction as addAttachFunction } from "../../attach";

export default function ServerAuthWrapper(io, options = {}) {
  io.auth = function authMiddleware(handlers) {
    throwIfInvalidHandlers(handlers);

    io.use(async (socket, next) => {
      addAttachFunction(socket);
      watchPackets(socket);
      next();

      if (handlers.server) await server(io, socket, handlers.server);

      if (handlers.credential)
        await credential(io, socket, handlers.credential, options);
    });
  };
}

function throwIfInvalidHandlers(handlers) {
  if (!handlers || (!handlers.server && !handlers.credential))
    throw new TypeError("You need a handler at least.");

  if (
    (handlers &&
      handlers.server &&
      handlers.server.constructor.name !== "AsyncFunction") ||
    (handlers &&
      handlers.credential &&
      handlers.credential.constructor.name !== "AsyncFunction")
  )
    throw new TypeError("Authentication handler must be a async function.");
}
