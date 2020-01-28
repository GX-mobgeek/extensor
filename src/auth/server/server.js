import { kAuthorized } from "../../symbols";
import { EVENTS } from "../../constants";

export default function ServerAuth(io, socket, handler) {
  let resolved = false;
  return new Promise((resolve, reject) => {
    handler({
      socket,
      done(result) {
        if (resolved) return;
        resolved = true;
        resolver(socket, result, resolve);
      }
    })
      .then(result => {
        if (typeof result === "undefined" || resolved) return;
        resolved = true;
        resolver(socket, result, resolve);
      })
      .catch(reject);
  });
}

function resolver(socket, result, fn) {
  socket.emit(EVENTS.AUTH_RESULT, result);
  if (result) socket[kAuthorized] = true;
  fn();
  return true;
}
