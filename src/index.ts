import parser from "./parser";
import * as auth from "./auth";
import unique from "./unique";
import * as storageAdapters from "./storage-adapters";

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
