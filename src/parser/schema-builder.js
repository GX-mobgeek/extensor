import schemapack from "schemapack";

const simpleSchemas = {};

export default function buildSchemas(map) {
  const schemas = {};
  const idmap = {};

  Object.keys(map).map(event => {
    const item = map[event];

    if (typeof item.id === "undefined")
      throw new Error(`Undefined ID for event ${event}`);

    if (!item.schema) throw new Error(`Undefined schema for event ${event}`);

    if (typeof item.schema === "string" && !(item.schema in simpleSchemas))
      simpleSchemas[item.schema] = schemapack.build(item.schema);

    schemas[event] =
      typeof item.schema === "string"
        ? simpleSchemas[item.schema]
        : schemapack.build(item.schema);

    idmap[item.id] = event;
  });

  return { schemas, idmap };
}
