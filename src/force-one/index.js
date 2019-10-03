import client from "./client";
import * as server from "./server";
import * as adapters from "./adapters";
import { MULTIPLE_IDENTIFY_METHODS } from "../constants";

export const forceOne = (io, rule) => {
  if ("io" in io) {
    return client(io, rule);
  }

  if (!io.extensorAuthHandling) {
    return server.ioHandler(io, rule);
  }

  io.extensorNoMutiplicity = rule;
};

forceOne.adapters = adapters;
forceOne.IP = MULTIPLE_IDENTIFY_METHODS.IP;
forceOne.IP_UA = MULTIPLE_IDENTIFY_METHODS.UA;
