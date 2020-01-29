import attach from "../../attach";
import { kAuthorized } from "../../symbols";
import { EVENTS } from "../../constants";

export default function ServerAuth(io, socket, handler) {
  let resolved = false;
  socket[kAuthorized] = false;
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
  if (result) {
    socket[kAuthorized] = true;

    if (result instanceof Object) {
      attach(socket, result);
    }
  }
  socket.emit(EVENTS.AUTH_RESULT, !!result);
  fn();
  return true;
}
