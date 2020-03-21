import { debug as Debug } from "../../utils";
import Emitter from "component-emitter";
import { TYPES } from "../utils";

const debug = Debug.extend("parser").extend("decoder");

const createDecoder = (
  idmap: Extensor.ParserIDMap,
  parsers: Extensor.ParsersList
) =>
  class Decoder extends Emitter {
    [x: string]: any;
    add(packet: string | Buffer) {
      debug("packet %j", packet);

      if (typeof packet === "string") {
        this.parseJSON(packet);
      } else {
        this.parseBinary(packet);
      }
    }

    parseJSON(packet: string) {
      try {
        const decoded = JSON.parse(packet);
        debug("json packet %j", decoded);
        this.emit("decoded", decoded);
      } catch (e) {
        debug("json error, packet: %s, error: %s", packet, e.message);
        this.emit("decoded", {
          type: TYPES.ERROR,
          data: `parser error: ${e.message}`
        });
      }
    }

    parseBinary(packet: Buffer) {
      try {
        let view = new Uint8Array(packet);

        const _id = view[0];

        const eventName: string = idmap[_id];
        const eventSchema = parsers[eventName];

        const structuredPacket: any = eventSchema.decode(packet);
        structuredPacket.type = TYPES.EVENT;
        structuredPacket.data = [eventName, structuredPacket.data];

        if (structuredPacket.id === -1) {
          delete structuredPacket.id;
        }

        debug("decoded binary: %j", structuredPacket);

        this.emit("decoded", structuredPacket);
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
