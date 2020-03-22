import { ClientDebug } from "../utils";
import { EVENTS } from "../constants";
import { AuthResultResponse, ClientSocket } from "../types";

const debug = ClientDebug.extend("auth");

export default function ClientAuthWrapper(
  socket: SocketIOClient.Socket,
  data: any,
  callback?: (error?: Error) => void
) {
  if (callback) {
    return authorize(socket, data, callback, callback);
  }

  return new Promise((resolve, reject) => {
    authorize(socket, data, resolve, reject);
  });
}

function authorize(
  socket: SocketIOClient.Socket,
  data: any,
  onSuccess: () => void,
  onError: (error?: Error) => void
) {
  socket.emit(EVENTS.AUTHORIZE, data, (result: AuthResultResponse) => {
    debug("[socket %s]: server response %s", socket.id, result);

    if (result.error) {
      debug("[socket %s]: auth failed, error: %s", socket.id, result.error);
      onError(new Error(result.error));
    }

    merge(socket as ClientSocket, result.merge);

    onSuccess();
  });
}

function merge(socket: ClientSocket, props: { [prop: string]: any }) {
  debug("[socket %s]: merge socket props: %o", socket.id, props);
  for (const prop in props) {
    socket[prop] = props[prop];
  }
}
