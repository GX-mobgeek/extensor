import watchPackets from "../watch-packets";
import { socketHandler } from "../force-one/server";
import atach from "./atachs";
import { EVENTS } from "../constants";

export const server = (io, socket, next, { timeout = false }, step1, step2) => {
  step1(result => {
    next();
    watchPackets(socket);

    socket.emit(EVENTS.AUTH_RESULT, result);

    if (!result) return setTimeout(() => socket.disconnect(), 10);

    let timer;

    if (timeout !== false) {
      timer = setTimeout(() => {
        socket.disconnect();
      }, timeout);
    }

    socket.on(EVENTS.AUTHORIZE, (data, ack) => {
      step2(
        data,
        (result, atachs) => {
          if (result) {
            socket.extensorAuthorized = true;

            if (timeout !== false) clearTimeout(timer);

            if (atachs) atach(socket, atachs);

            if (io.extensorNoMutiplicity)
              socketHandler(socket, io.extensorNoMutiplicity);
          }

          ack(result);
        },
        socket
      );
    });
  }, socket);
};

export const client = (socket, step1) => {
  socket.on(EVENTS.AUTH_RESULT, result => {
    if (!result) return step1(false);

    step1((data, result) => {
      socket.emit(EVENTS.AUTHORIZE, data, response => {
        result(response);
      });
    });
  });
};
