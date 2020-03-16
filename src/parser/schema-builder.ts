// @ts-ignore
import * as schemapack from "schemapack";

const simpleSchemas: Extensor.ParsersList = {};

export default function buildSchemas(map: Extensor.ParserMapSchemas) {
  const parsers: Extensor.ParsersList = {};
  const idmap: Extensor.ParserIDMap = {};

  // eslint-disable-next-line array-callback-return
  Object.keys(map).map(event => {
    const item = map[event];

    if (typeof item.id === "undefined")
      throw new Error(`Undefined ID for event ${event}`);

    if (!item.schema) throw new Error(`Undefined schema for event ${event}`);

    if (typeof item.schema === "string" && !(item.schema in simpleSchemas))
      simpleSchemas[item.schema] = schemapack.build(item.schema);

    parsers[event] =
      typeof item.schema === "string"
        ? simpleSchemas[item.schema]
        : schemapack.build(item.schema);

    idmap[item.id] = event;
  });

  return { parsers, idmap };
}
