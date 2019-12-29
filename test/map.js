export default {
  "ackResponse": {
    "id": 0,
    "schema": "boolean"
  },
  "__authorize": {
    "id": 1,
    "schema": {
      "login": "string",
      "pw": "string"
    }
  },
  "chatMsg": {
    "id": 2,
    "schema": {
      "content": "string",
      "ts": "varuint"
    }
  },
  "conState": {
    "id": 3,
    "schema": "uint8"
  },
  "alreadyConnected": {
    "id": 4,
    "schema": "boolean"
  }
};