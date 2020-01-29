import schemaBuilder from "./schema-builder";
import encoder from "./encoder";
import decoder from "./decoder";

const exIoEvents = {
  __multipleAttemp: {
    id: 1212,
    schema: "uint8"
  },
  __authResult: {
    id: 1313,
    schema: "boolean"
  }
};

export default function buildParser(dataStruct) {
  const { idmap, schemas } = schemaBuilder({ ...dataStruct, ...exIoEvents });

  return {
    Encoder: encoder(dataStruct, idmap, schemas),
    Decoder: decoder(dataStruct, idmap, schemas),
    idmap,
    schemas
  };
}
