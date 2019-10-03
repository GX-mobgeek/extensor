import Emitter from "component-emitter";
import schemapack from "schemapack";
import ParserError from './error'

const schema = schemapack.build({
  _id: "varuint",
  data: "buffer",
  id: "varint",
  nsp: "string"
});

const TYPES = {
  CONNECT: 0,
  DISCONNECT: 1,
  EVENT: 2,
  ACK: 3,
  ERROR: 4,
  BINARY_EVENT: 5,
  BINARY_ACK: 6
};

const errorPacket = {
  type: TYPES.ERROR,
  data: "parser error"
};

const createDecoder = (map, idmap, schemas) =>
  class Decoder extends Emitter {
    add(obj) {
      if (typeof obj === "string") {
        this.parseJSON(obj);
      } else {
        this.parseBinary(obj);
      }
    }

    parseJSON(obj) {
      try {
        const decoded = JSON.parse(obj);
        this.emit("decoded", decoded);
      } catch (e) {
        this.emit("decoded", errorPacket);
      }
    }

    parseBinary(obj) {
      try {
        const { id, _id, data, nsp } = schema.decode(obj);

        const eventName = idmap[_id];
        const eventSchema = schemas[eventName];

        const packet = {
          type: TYPES.EVENT,
          data: [eventName, eventSchema.decode(data)],
          nsp
        };

        if (id !== -1) packet.id = id;

        this.emit("decoded", packet);
      } catch (e) {
        // this.emit('decoded', errorPacket);
        throw new ParserError("Decode", obj, map, true, e);
      }
    }

    destroy() {}
  };

export default createDecoder;
