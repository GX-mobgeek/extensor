import { kAuthorized } from "./symbols";
import { EVENTS } from "./constants";

export const defaultAuthorized = [
  EVENTS.AUTHORIZE,
  EVENTS.AUTH_RESULT,
  EVENTS.MULTIPLE_ATTEMP
];

export default function watchPackets(socket, authorize = defaultAuthorized) {
  socket.use((packet, next) => {
    if (authorize.indexOf(packet[0]) !== -1 || socket[kAuthorized])
      return next();
  });
}
