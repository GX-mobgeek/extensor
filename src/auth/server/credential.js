import atach from "../../attach";
import {
  kAuthorized,
  // kNoMutiplicity,
  kSocketTimeout
} from "../../symbols";
import { EVENTS } from "../../constants";

export default function CredentialAuth(
  io,
  socket,
  handler,
  { timeout: time = false }
) {
  let resolved = false;
  socket[kAuthorized] = false;
  return new Promise((resolve, reject) => {
    if (time !== false) {
      socket[kSocketTimeout] = setTimeout(() => {
        socket.emit("authTimeout");
        socket.disconnect(true);
      }, time);
    }

    socket.on(EVENTS.AUTHORIZE, (data, ack) => {
      handler({
        data,
        socket,
        done(result) {
          if (resolved) return;
          resolved = resolver({
            socket,
            result,
            ack,
            time
          });
          resolve();
        }
      })
        .then(result => {
          if (typeof result === "undefined" || resolved) return;
          resolved = resolver({
            socket,
            result,
            ack,
            time
          });
          resolve();
        })
        .catch(reject);
    });
  });
}

function resolver({ socket, result, ack, time }) {
  if (result) {
    socket[kAuthorized] = true;

    if (time !== false) {
      clearTimeout(socket[kSocketTimeout]);
    }

    if (result instanceof Object) {
      atach(socket, result);
    }
  }

  ack(result);

  return true;
}
