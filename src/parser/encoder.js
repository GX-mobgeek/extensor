/* eslint-disable standard/no-callback-literal */
import schemapack from "schemapack";
import ParserError from "./error";
import { schema, TYPES } from "./utils";

const createEncoder = (map, idmap, schemas) => {
  return class Encoder {
    encode(packet, callback) {
      switch (packet.type) {
        case TYPES.EVENT:
        case TYPES.BINARY_EVENT:
          if (packet.type === TYPES.EVENT && !(packet.data[0] in map)) {
            return callback([this.json(packet)]);
          }

          return callback([this.pack(packet)]);
        default:
          return callback([this.json(packet)]);
      }
    }

    json(packet) {
      try {
        return JSON.stringify(packet);
      } catch (e) {
        throw new Error(e);
      }
    }

    pack(packet) {
      try {
        if (packet.type === TYPES.BINARY_EVENT && !(packet.data[0] in map))
          throw new Error("Binary event must be specified on schemas");

        const eventName = packet.data[0];
        const eventSchema = schemas[eventName];

        const flatPacket = {
          _id: map[eventName].id,
          data: eventSchema.encode(packet.data[1]),
          nsp: packet.nsp,
          id: !("id" in packet) ? -1 : packet.id
        };

        return schema.encode(flatPacket);
      } catch (e) {
        throw new ParserError("Encode", packet, map, true, e);
        //  return this.json(errorPacket);
      }
    }
  };
};

export default createEncoder;
