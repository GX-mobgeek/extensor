import watchPackets from "../watch-packets";
import { socketHandler } from "../force-one/server";
import atach from "./atachs";
import { kAuthorized, kNoMutiplicity } from "../symbols";
import { EVENTS } from "../constants";

export const server = (io, socket, next, { timeout = false }, handler) => {
  next();

  watchPackets(socket);

  let timer;
  if (timeout !== false) {
    timer = setTimeout(() => {
      socket.disconnect();
    }, timeout);
  }

  socket.on(EVENTS.AUTHORIZE, (data, ack) => {
    handler(
      data,
      (result, atachs) => {
        if (result) {
          socket[kAuthorized] = true;

          if (timeout !== false) {
            clearTimeout(timer);
          }

          if (atachs) {
            atach(socket, atachs);
          }

          if (io[kNoMutiplicity]) {
            socketHandler(socket, io[kNoMutiplicity]);
          }
        }

        ack(result);
      },
      socket
    );
  });
};

export const client = (socket, handler) => {
  handler((data, result) => {
    socket.emit(EVENTS.AUTHORIZE, data, response => {
      result(response);
    });
  });
};
