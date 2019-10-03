const invalidAtachs = [
  "id",
  "rooms",
  "client",
  "conn",
  "request",
  "handshake",
  "use",
  "send",
  "emit",
  "on",
  "once",
  "removeListener",
  "removeAllListeners",
  "eventNames",
  "join",
  "leave",
  "to",
  "in",
  "compress",
  "disconnect",
  "broadcast",
  "volatile",
  "binary"
];

export default function atach(socket, atachs) {
  Object.keys(atachs).map(namespace => {
    if (invalidAtachs.indexOf(namespace) !== -1)
      throw new Error(`Invalid atach namespace: ${namespace}`);

    socket[namespace] = atachs[namespace];
  });
}
