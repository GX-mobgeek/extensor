import parser from "./parser";
import auth from "./auth/server";
import unique from "./unique";

export { parser, auth, unique };

export function extend(target: SocketIO.Server, options?: Extensor.Options) {
  auth(target, options);
  unique(target, options);
}
