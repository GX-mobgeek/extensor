import clientHandler from "./client";
import serverHandler from "./server";

export function server(
  io: SocketIO.Server,
  handler: Extensor.AuthHandler,
  options?: Extensor.Options
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
