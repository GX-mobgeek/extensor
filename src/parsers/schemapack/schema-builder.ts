// @ts-ignore
import * as schemapack from "schemapack";

import { ParserMapSchemas, ParserIDMap, ParsersList } from "../../types";

export default function buildSchemas(map: ParserMapSchemas) {
  const packetParser: ParsersList = {};
  const schemas: ParsersList = {};
  const idmap: ParserIDMap = {};

  Object.keys(map).forEach(event => {
    const item = map[event];

    if (typeof item.id === "undefined")
      throw new Error(`Undefined ID for event ${event}`);

    if (!item.schema) throw new Error(`Undefined schema for event ${event}`);

    packetParser[event] = schemapack.build({
      _id: "varuint",
      data: item.schema,
      id: "varint",
      nsp: "string"
    });

    schemas[event] = schemapack.build(item.schema);

    idmap[item.id] = event;
  });

  return { schemas, packetParser, idmap };
}
