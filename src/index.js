import parser from "./parser";
import auth from "./auth";
import unique from "./unique";
import { isClient } from "./utils";

export default function Extensor(target, options) {
  auth(target, options);
  !isClient(target) && unique(target, options);
}

export { parser, auth, unique };

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
