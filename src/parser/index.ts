import schemaBuilder from "./schema-builder";
import encoder from "./encoder";
import decoder from "./decoder";

export default function buildParser(dataStruct: Extensor.ParserMapSchemas) {
  const { idmap, parsers } = schemaBuilder({ ...dataStruct });

  return {
    Encoder: encoder(dataStruct, parsers),
    Decoder: decoder(idmap, parsers),
    idmap,
    parsers
  };
}
