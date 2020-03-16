import parser from "./parser";
import auth from "./auth";
import unique from "./unique";
import { isClient } from "./utils";
import * as storageAdapters from "./storage-adapters";

export function extend(
  target: SocketIO.Server | SocketIOClient.Socket,
  options?: Extensor.Options
) {
  auth(target, options);
  !isClient(target) && unique(target as SocketIO.Server, options);
}

export { parser, auth, unique, storageAdapters };

export function withAuth() {
  throw new Error(
    "The things has changed, breaking changes, read the docs again."
  );
}

export function forceOne() {
  throw new Error(
    "The things has changed, breaking changes, read the docs again."
  );
}

export function buildParser() {
  throw new Error(
    "The things has changed, breaking changes, this method has not get changed but is from an old version of this module, read the docs again."
  );
}
