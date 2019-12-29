import schemapack from "schemapack";

export const schema = schemapack.build({
  _id: "varuint",
  data: "buffer",
  id: "varint",
  nsp: "string"
});

export const TYPES = {
  CONNECT: 0,
  DISCONNECT: 1,
  EVENT: 2,
  ACK: 3,
  ERROR: 4,
  BINARY_EVENT: 5,
  BINARY_ACK: 6
};