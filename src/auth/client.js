import { EVENTS } from "../constants";

export function handleAuth(socket) {
  return (data, callback = false) => {
    if (typeof data === "function") return socket.on(EVENTS.AUTH_RESULT, data);

    if (callback && typeof callback === "function") {
      return socket.emit(EVENTS.AUTHORIZE, data, callback);
    }
    return new Promise(resolve => {
      if (!data) {
        return socket.on(EVENTS.AUTH_RESULT, resolve);
      }

      socket.emit(EVENTS.AUTHORIZE, data, resolve);
    });
  };
}

export default function ClientAuthWrapper(socket) {
  socket.auth = handleAuth(socket);
}
