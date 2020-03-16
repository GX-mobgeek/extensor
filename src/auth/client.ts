import { ClientDebug } from "../utils";
import { EVENTS } from "../constants";

const debug = ClientDebug.extend("auth");

export default function ClientAuthWrapper(socket: SocketIOClient.Socket) {
  function merge(
    socket: Extensor.ClientSocket,
    props: { [prop: string]: any }
  ) {
    debug("[socket %s]: merge socket props: %o", socket.id, props);
    for (const prop in props) {
      socket[prop] = props[prop];
    }
  }

  (socket as Extensor.ClientSocket).auth = (
    data: any
  ): Promise<string | object> => {
    debug("[socket %s]: sending credential", socket.id);
    return new Promise((resolve, reject) => {
      socket.emit(
        EVENTS.AUTHORIZE,
        data,
        (result: Extensor.AuthResultResponse) => {
          debug("[socket %s]: server response %s", socket.id, result);

          if (result.error) {
            debug(
              "[socket %s]: auth failed, error: %s",
              socket.id,
              result.error
            );
            return reject(result.error);
          }

          merge(socket as Extensor.ClientSocket, result.merge);

          return resolve(result.merge);
        }
      );
    });
  };
}
