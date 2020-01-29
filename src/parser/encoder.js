/* eslint-disable standard/no-callback-literal */
import { debug as Debug } from "../utils";
import { schema, TYPES } from "./utils";

export const debug = Debug.extend("parser").extend("encoder");

const createEncoder = (map, idmap, schemas) => {
  return class Encoder {
    encode(packet, callback) {
      debug("packet %j", packet);
      switch (packet.type) {
        case TYPES.EVENT:
        case TYPES.BINARY_EVENT:
          if (!(packet.data[0] in map)) {
            return callback([this.json(packet)]);
          }

          return callback([this.pack(packet)]);
        default:
          return callback([this.json(packet)]);
      }
    }

    json(packet) {
      try {
        debug("json packet %j", packet);
        return JSON.stringify(packet);
      } catch (e) {
        debug("json error, packet: %j, error: %s", packet, e.message);
        return `{"type": ${TYPES.ERROR}, "data": "parser error"}`;
      }
    }

    pack(packet) {
      try {
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
        debug("encode binary error: %s", e.message);
        return `{"type": ${TYPES.ERROR}, "data": "parser error"}`;
      }
    }
  };
};

export default createEncoder;
