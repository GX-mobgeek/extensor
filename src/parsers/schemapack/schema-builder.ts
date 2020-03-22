// @ts-ignore
import * as schemapack from "schemapack";

export default function buildSchemas(map: Extensor.ParserMapSchemas) {
  const packetParser: Extensor.ParsersList = {};
  const parsers: Extensor.ParsersList = {};
  const idmap: Extensor.ParserIDMap = {};

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

    parsers[event] = schemapack.build(item.schema);

    idmap[item.id] = event;
  });

  return { parsers, packetParser, idmap };
}
