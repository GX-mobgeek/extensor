import Debug from "debug";

export const debug = Debug("extensor");

export const ServerDebug = debug.extend("server");
export const ClientDebug = debug.extend("client");

export function isClient(target: SocketIO.Server | SocketIOClient.Socket) {
  return "io" in target;
}

export const slugify = (str: string) => str.replace(/ /g, "").toLowerCase();
