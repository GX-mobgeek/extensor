import { debug as Debug } from "../utils";
import Emitter from "component-emitter";
import { schema, TYPES } from "./utils";

const debug = Debug.extend("parser").extend("decoder");

const createDecoder = (map, idmap, schemas) =>
  class Decoder extends Emitter {
    add(obj) {
      debug("packet %j", obj);

      if (typeof obj === "string") {
        this.parseJSON(obj);
      } else {
        this.parseBinary(obj);
      }
    }

    parseJSON(string) {
      try {
        const decoded = JSON.parse(string);
        debug("json packet %j", decoded);
        this.emit("decoded", decoded);
      } catch (e) {
        debug("json error, packet: %j, error: %s", string, e.message);
        this.emit("decoded", {
          type: TYPES.ERROR,
          data: `parser error: ${e.message}`
        });
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

        debug("decoded binary: %j", packet);

        this.emit("decoded", packet);
      } catch (e) {
        debug("decode binary error: %s", e.message);

        this.emit("decoded", {
          type: TYPES.ERROR,
          data: `parser error: ${e.message}`
        });
      }
    }

    destroy() {}
  };

export default createDecoder;
