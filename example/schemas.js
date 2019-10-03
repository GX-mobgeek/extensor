
const miscStruct = {
    "_id": "string",
    "index": "varuint",
    "guid": "string",
    "isActive": "boolean",
    "balance": "float32",
    "picture": "string",
    "age": "varuint",
    "eyeColor": "string",
    "name": {
        "first": "string",
        "last": "string"
    },
    "range": ["varuint"],
    "friends": [
        {
            "id": "varuint",
            "name": "string"
        }
    ]
}

const messageSchema = {
    content: "string",
    ts: "varuint"
}

module.exports = {
    "___authorize": {
        "id": 0,
        "schema": "string"
    },
    "message": {
        "id": 1,
        "schema": messageSchema
    },
    "sentMessage": {
        "id": 2,
        "schema": {
            ...messageSchema,
            "author": "string"
        }
    },
    "entry": {
        "id": 3,
        "schema": "string"
    },
    "leave": {
        "id": 4,
        "schema": "string"
    },
    "miscStruct": {
        "id": 5,
        "schema": miscStruct
    },
    "computeLength": {
        "id": 1045,
        "schema": "varuint"
    }
}