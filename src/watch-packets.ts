import { kSocketAuthStatus } from "./symbols";
import { EVENTS } from "./constants";
import { ServerSocket } from "./types";

export const defaultAuthorized = [
  EVENTS.AUTHORIZE,
  EVENTS.AUTH_RESULT,
  EVENTS.MULTIPLE_ATTEMP
];

export default function watchPackets(
  socket: SocketIO.Socket,
  authorize?: string[]
) {
  const authorizedEvents = authorize
    ? [...authorize, ...defaultAuthorized]
    : defaultAuthorized;

  socket.use((packet, next) => {
    if (
      (socket as ServerSocket)[kSocketAuthStatus] ||
      authorizedEvents.indexOf(packet[0]) !== -1
    )
      return next();
  });
}
