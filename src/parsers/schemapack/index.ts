import schemaBuilder from "./schema-builder";
import encoder from "./encoder";
import decoder from "./decoder";

export default function buildSchemapackParser(
  dataStruct: Extensor.ParserMapSchemas
) {
  const { idmap, packetParser, parsers } = schemaBuilder({ ...dataStruct });

  return {
    Encoder: encoder(dataStruct, packetParser),
    Decoder: decoder(idmap, packetParser),
    idmap,
    parsers
  };
}
