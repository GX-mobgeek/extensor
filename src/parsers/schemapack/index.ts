import schemaBuilder from "./schema-builder";
import encoder from "./encoder";
import decoder from "./decoder";

import { ParserMapSchemas } from "../../types";

export default function buildSchemapackParser(dataStruct: ParserMapSchemas) {
  const { idmap, packetParser, schemas } = schemaBuilder({ ...dataStruct });

  return {
    parser: {
      Encoder: encoder(dataStruct, packetParser),
      Decoder: decoder(idmap, packetParser)
    },
    idmap,
    schemas
  };
}
