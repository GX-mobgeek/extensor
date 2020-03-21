import unique from "./unique";
import * as parsers from "./parsers";
import * as constants from "./constants";
import * as auth from "./auth";
import * as storageAdapters from "./storage-adapters";

export { auth, constants, parsers, storageAdapters, unique };

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
