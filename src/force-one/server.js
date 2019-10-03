import slugify from "slugify";
import watchPackets from "../watch-packets";
import { EVENTS, MULTIPLE_IDENTIFY_METHODS } from "../constants";

const refs = [MULTIPLE_IDENTIFY_METHODS.IP, MULTIPLE_IDENTIFY_METHODS.IP_UA];

function getId(socket, ref) {
  if (typeof ref === "number") {
    if (refs.indexOf(ref) === -1)
      throw new Error("Invalid method of multiple connections identify");

    const { headers } = socket.handshake;

    const ip =
      headers["x-real-ip"] ||
      headers["x-forwarded-for"] ||
      socket.handshake.address;

    switch (ref) {
      case MULTIPLE_IDENTIFY_METHODS.IP:
        return ip;
      case MULTIPLE_IDENTIFY_METHODS.IP_UA:
        return `${ip}${slugify(headers["user-agent"])}`;
    }
  }

  if (!(ref in socket)) {
    throw new Error(`Identify "${ref}" not found in socket: ${socket.id}`);
  }

  return socket[ref];
}

function onReject(socket, e) {
  socket.disconnect();
  throw new Error(e);
}

export const socketHandler = (
  socket,
  {
    adapter,
    id = MULTIPLE_IDENTIFY_METHODS.IP,
    onTry,
    storagePrefix = "extensor_CAS",
    connectionTimeout = 2
  }
) => {
  if (connectionTimeout < 2)
    throw new Error("Minimum connection alive state timeout is 2 minutes");

  return new Promise((resolve, reject) => {
    const refId = getId(socket, id);

    adapter
      .get(`${storagePrefix}${refId}`)
      .then(conn => {
        if (conn === 1) {
          socket.emit(EVENTS.MULTIPLE_TRY, 1);
          socket.disconnect();

          resolve();

          return onTry && onTry();
        }

        adapter
          .set(`${storagePrefix}${refId}`, 1, connectionTimeout)
          .then(() => {
            const interval = setInterval(
              (prefix, refId) => {
                adapter.set(`${prefix}${refId}`, 1, connectionTimeout);
              },
              (connectionTimeout - 1) * 60 * 1000,
              storagePrefix,
              refId
            );

            socket.on("disconnect", () => {
              clearInterval(interval);
              adapter.del(`${storagePrefix}${refId}`);
            });

            resolve();
          })
          .catch(e => onReject(socket, e));
      })
      .catch(e => onReject(socket, e));
  });
};

export const ioHandler = (io, rules) => {
  rules.connectionTimeout |= 2;

  if (rules.connectionTimeout < 2) {
    throw new Error("Minimum connection alive state timeout is 2 minutes");
  }

  io.use((socket, next) => {
    next();

    if (!io.extensorAuthHandling) {
      watchPackets(socket);
      socket.extensorAuthorized = true;
    }

    socketHandler(socket, rules);
  });
};
