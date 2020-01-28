const invalidAtachs = [
  "attach",
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

export default function attach(socket, attachs) {
  for (const key in attachs) {
    if (invalidAtachs.indexOf(key) !== -1)
      throw new Error(`Invalid attach key: ${key}`);

    socket[key] = attachs[key];
  }
}

export function addFunction(socket) {
  if (!socket.attach) socket.attach = attachs => attach(socket, attachs);
}
