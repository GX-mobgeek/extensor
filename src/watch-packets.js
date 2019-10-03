import { EVENTS } from "./constants";

const defaultAuthorized = [
  EVENTS.AUTHORIZE,
  EVENTS.AUTH_RESULT,
  EVENTS.EVT_MULTIPLE_TRY
];

export default (socket, authorize = defaultAuthorized) => {
  socket.extensorAuthorized = false;

  socket.use((packet, next) => {
    if (!!~authorize.indexOf(packet[0]) || socket.extensorAuthorized)
      return next();
  });
};
