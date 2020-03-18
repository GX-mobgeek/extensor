# Extensor

[![Build Status](https://travis-ci.org/GX-mob/extensor.svg?branch=master)](https://travis-ci.org/GX-mob/extensor)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![DependenciesSstatus](https://david-dm.org/gx-mob/extensor/status.svg)](https://david-dm.org/gx-mob/extensor)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io//test/github/GX-mobgeek/extensor/badge.svg?targetFile=package.json)](https://snyk.io//test/github/GX-mobgeek/extensor?targetFile=package.json)
[![Code Coverage](https://codecov.io/gh/GX-mob/extensor/branch/master/graph/badge.svg)](https://codecov.io/gh/GX-mob/extensor/branch/master)

### Extend functions to the socket.io.

**Currently implemented:**

- Handler authentication;
- Grant unique connections;
- Made easy the serialization with schemapack.

**Next:**

- Serialization in acknowledge

**PR's are welcome.**

## Contents

- [Install](#Install)
- [API](#API)
- [Benchmarks](#Benchmarks)

## Install

```shell
npm install extensor
```

## Examples

### Binary serialization with schemapack

```javascript
import { parser } from "extensor";

// create a schema map
const parser = parser({
  message: {
    // Convert the event name to int
    // it's a method to minimize the packet size
    id: 1,
    schema: {
      content: "string",
      ts: "varuint"
    }
  }
});

// On both, server and client
// initialize socketio with extensor parser
const src = io({
  parser
});
```

- All emitted "message" events are binary, according with the schema;
- For the events that not in list, JSON parser is used.
- Here we not use **2 packets like in socket.io-parser binary event**.
- The encode/decode schemapack functions is accessible in parser.parsers.

**Schemapack are the fastest and smallest JavaScript object serialization library.**

### Packet size comparsion

<details>
  <summary>Packet sample</summary>
{
        "_id": "5d93b9d70cbdf21c0c6f56bb",
        "index": 0,
        "guid": "4c63d6bb-0680-4b2d-9343-919c9892d837",
        "isActive": false,
        "balance": 3312.84,
        "picture": "http://placehold.it/32x32",
        "age": 36,
        "eyeColor": "brown",
        "name": {
            "first": "Clements",
            "last": "Alford"
        },
        "range": [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
        "friends": [
            {
                "id": 0,
                "name": "Caldwell Martin"
            },
            {
                "id": 1,
                "name": "Ora Gould"
            },
            {
                "id": 2,
                "name": "Beryl Haney"
            }
        ]
    }
</details>

- **Schemapack: ~162 bytes**
- Default parser in binary(uses 2 packets): **~211 bytes**
- Default parser: **~375 bytes**

##### All supported types and more info, you find at [schemapack](https://github.com/phretaddin/schemapack#here-is-a-table-of-the-available-data-types-for-use-in-your-schemas)

## Authentication

### Server

```javascript
import SocketIO from "socket.io";
import { auth } from "extensor";

const io = SocketIO();

auth(io, ({ socket, data }) => {
  if (data.token === 1) return { userId: 123 };

  return false;
});

io.on("connection", async socket => {
  await socket.auth;

  socket.on("msg", msg => console.log(msg));
});
```

### Client

```javascript
import SocketIOClient from "socket.io-client";
import { auth } from "extensor".

const socket = SocketIOClient();

socket.on("connect", () => {
  await auth(socket, { token: 1 });

  console.log(socket.userId); // => 123
});
```

&nbsp;
&nbsp;

## Blocking multiple connections

To use in a cluster, you need an external storage, current have adapters for redis and ioredis modules.

### Server

```javascript
import { unique, adapters } from "extensor";

...

unique(io, {
  storage: adapters.IORedis(new Redis()) // default stores in process object
});

```

To catch a multiple attemp on client:

```javascript
socket.on("error", err => {
  if (err === "multiple attemp") {
    alert("you already connected");
  }
});
```

&nbsp;

## Benchmarks

### Schemapack

shcemapack are awesome, more faster serialization and more smallest packet size than any other serializer.

```shell
npm run benchmarks
```

## API

#### `parser( map: Object ): { Encoder, Decoder, parser, idmap }`

Create a parser for Socket.io with schemapack serialization.

#### `auth( io: Socket.io Engine[, options: ExtensorOptions ]): void`

Create a wrapper to handle authentication/authorization

#### `unique( [ options: ExtensorOptions ] )`

Create a step to force a unique connection

## License

MIT

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor?ref=badge_large)
