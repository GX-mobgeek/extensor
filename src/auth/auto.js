import { socketHandler } from "../force-one/server";
import atach from "./atachs";
import { EVENTS } from "../constants";

export const server = (io, socket, next, handler) => {
  handler((result, atachs) => {
    next();

    socket.emit(EVENTS.AUTH_RESULT, result);

    socket.extensorAuthorized = result;

    if (!result) {
      return setTimeout(() => socket.disconnect(), 10);
    }

    if (atachs) {
      atach(socket, atachs);
    }

    if (io.extensorNoMutiplicity) {
      socketHandler(socket, io.extensorNoMutiplicity);
    }
  }, socket);
};

export const client = (socket, handler) => {
  socket.on(EVENTS.AUTH_RESULT, result => handler(result));
};
