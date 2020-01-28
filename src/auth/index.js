import client from "./client";
import server from "./server";
import { isClient } from "../utils";

export default function authWrapper(target, options) {
  return isClient(target) ? client(target) : server(target, options);
}
