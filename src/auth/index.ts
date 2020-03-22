import clientHandler from "./client";
import serverHandler from "./server";

import { AuthHandler, AuthOptions } from "../types";

export function server(
  io: SocketIO.Server,
  handler: AuthHandler,
  options?: AuthOptions
) {
  return serverHandler(io, handler, options);
}

export function client(
  socket: SocketIOClient.Socket,
  data: any,
  callback?: (error?: Error) => void
): Promise<unknown> | void {
  return clientHandler(socket, data, callback);
}
