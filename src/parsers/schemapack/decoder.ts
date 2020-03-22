import { ParserDebug } from "../../utils";
import Emitter from "component-emitter";
import { TYPES } from "../utils";

const debug = ParserDebug.extend("schemapack").extend("decoder");

const createDecoder = (
  idmap: Extensor.ParserIDMap,
  packetParser: Extensor.ParsersList
) =>
  class Decoder extends Emitter {
    [x: string]: any;
    add(packet: string | Buffer) {
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
        const eventSchema = packetParser[eventName];

        const sent: any = eventSchema.decode(packet);

        const finalPacket: any = {
          type: TYPES.EVENT,
          data: [eventName, sent.data],
          nsp: sent.nsp
        };

        if (sent.id !== -1) {
          finalPacket.id = sent.id;
        }

        debug("binary packet: %j", finalPacket);

        this.emit("decoded", finalPacket);
      } catch (e) {
        debug("binary error: %s", e.message);

        this.emit("decoded", {
          type: TYPES.ERROR,
          data: `parser error: ${e.message}`
        });
      }
    }

    destroy() {}
  };

export default createDecoder;
