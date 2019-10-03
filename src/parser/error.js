export default class ParserError extends Error {
  constructor(method, object, schemas, print, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParserError);
    }

    let objectView;
    let eventName = false;
    let schema = "";

    if (method === "Encode") {
      eventName = object.data[0];

      objectView = JSON.stringify(object.data[1]);

      if (eventName in schemas)
        schema = `\nSchema: ${JSON.stringify(schemas[eventName].schema)}`;
    } else {
      objectView = JSON.stringify(object);
    }

    this.method = method;
    this.message = `${method}:${eventName &&
      " " + eventName}${schema}\nPacket: ${objectView}\n\n`;

    // for test debug purpose
    if (print) console.log(this.message);
  }
}
