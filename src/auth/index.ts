import client from "./client";
import server from "./server";
import { isClient } from "../utils";

export default function authWrapper(
  target: SocketIO.Server | SocketIOClient.Socket,
  options?: Extensor.Options
) {
  return isClient(target)
    ? client(target as SocketIOClient.Socket)
    : server(target as SocketIO.Server, options);
}
