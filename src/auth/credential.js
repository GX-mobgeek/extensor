import watchPackets from "../watch-packets";
import { socketHandler } from "../force-one/server";
import atach from "./atachs";
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
          socket.extensorAuthorized = true;

          if (timeout !== false) {
            clearTimeout(timer);
          }

          if (atachs) {
            atach(socket, atachs);
          }

          if (io.extensorNoMutiplicity) {
            socketHandler(socket, io.extensorNoMutiplicity);
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
