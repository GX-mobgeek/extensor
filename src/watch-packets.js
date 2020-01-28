import { kAuthorized } from "./symbols";
import { EVENTS } from "./constants";

const defaultAuthorized = [
  EVENTS.AUTHORIZE,
  EVENTS.AUTH_RESULT,
  EVENTS.MULTIPLE_ATTEMP
];

export default (socket, authorize = defaultAuthorized) => {
  socket[kAuthorized] = false;

  socket.use((packet, next) => {
    if (authorize.indexOf(packet[0]) !== -1 || socket[kAuthorized])
      return next();
  });
};
