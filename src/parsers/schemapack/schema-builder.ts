// @ts-ignore
import * as schemapack from "schemapack";

export default function buildSchemas(map: Extensor.ParserMapSchemas) {
  const parsers: Extensor.ParsersList = {};
  const idmap: Extensor.ParserIDMap = {};

  // eslint-disable-next-line array-callback-return
  Object.keys(map).map(event => {
    const item = map[event];

    if (typeof item.id === "undefined")
      throw new Error(`Undefined ID for event ${event}`);

    if (!item.schema) throw new Error(`Undefined schema for event ${event}`);

    parsers[event] = schemapack.build({
      _id: "varuint",
      data: item.schema,
      id: "varint",
      nsp: "string"
    });

    idmap[item.id] = event;
  });

  return { parsers, idmap };
}
