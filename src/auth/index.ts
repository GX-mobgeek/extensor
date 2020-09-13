import clientHandler from "./client";
import serverHandler from "./server";
import { Server } from "socket.io";
import { Socket } from "socket.io-client";

import { AuthHandler, AuthOptions } from "../types";

export function server(
  io: Server,
  handler: AuthHandler,
  options?: AuthOptions
) {
  return serverHandler(io, handler, options);
}

export function client(
  socket: typeof Socket,
  data: any,
  callback?: (error?: Error) => void
): Promise<unknown> | void {
  return clientHandler(socket, data, callback);
}
