import client from "./client";
import * as server from "./server";
import * as adapters from "./adapters";
import { MULTIPLE_IDENTIFY_METHODS } from "../constants";
import { kAuthHandling, kNoMutiplicity } from "../symbols";

export const forceOne = (io, rule) => {
  if ("io" in io) {
    return client(io, rule);
  }

  if (!io[kAuthHandling]) {
    return server.ioHandler(io, rule);
  }

  io[kNoMutiplicity] = rule;
};

forceOne.adapters = adapters;
forceOne.IP = MULTIPLE_IDENTIFY_METHODS.IP;
forceOne.IP_UA = MULTIPLE_IDENTIFY_METHODS.UA;
