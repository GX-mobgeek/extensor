import { socketHandler } from "../force-one/server";
import atach from "./atachs";
import { EVENTS } from "../constants";
import { kAuthorized, kNoMutiplicity } from "../symbols";

export const server = (io, socket, next, handler) => {
  handler((result, atachs) => {
    next();

    socket.emit(EVENTS.AUTH_RESULT, result);

    socket[kAuthorized] = result;

    if (!result) {
      return setTimeout(() => socket.disconnect(), 10);
    }

    if (atachs) {
      atach(socket, atachs);
    }

    if (io[kNoMutiplicity]) {
      socketHandler(socket, io[kNoMutiplicity]);
    }
  }, socket);
};

export const client = (socket, handler) => {
  socket.on(EVENTS.AUTH_RESULT, result => handler(result));
};
