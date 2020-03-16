import Debug from "debug";

export const debug = Debug("extensor");

export const ServerDebug = debug.extend("server");
export const ClientDebug = debug.extend("client");

export const slugify = (str: string) => str.replace(/ /g, "").toLowerCase();

export function defer() {
  const defer: any = {};

  defer.resolve = null;
  defer.reject = null;
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });

  return defer;
}
