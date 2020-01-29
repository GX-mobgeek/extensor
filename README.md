# Extensor

[![Build Status](https://travis-ci.org/GX-mob/extensor.svg?branch=master)](https://travis-ci.org/GX-mob/extensor)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![DependenciesSstatus](https://david-dm.org/gx-mob/extensor/status.svg)](https://david-dm.org/gx-mob/extensor)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io//test/github/GX-mobgeek/extensor/badge.svg?targetFile=package.json)](https://snyk.io//test/github/GX-mobgeek/extensor?targetFile=package.json)
[![Code Coverage](https://codecov.io/gh/GX-mob/extensor/branch/master/graph/badge.svg)](https://codecov.io/gh/GX-mob/extensor/branch/master)

### A javascript library that extend functions to the socket.io.

**Currently implemented:**

- Handler authentication;
- Grant unique connections;
- Made easy the serialization with schemapack.

**Next:**

- Serialization in acknowledge

v0.1 [see(#http://ww.com.br)]

**PR's are welcome.**

## Contents

- [Install](#Install)
- [Examples](#Examples)
- [Chat](#chat-example)
- [API](#API)

## Install

```shell
npm install extensor
```

## Supporing handshaking

```javascript
// both, server and client
import auth from "extensor/auth";
// or import just the client
import auth from "extensor/auth/client";
```

## Examples

### Binary serialization with schemapack

```javascript
const parser = require("extensor/parser"); // or
const { parser } = require("extensor");

// create a schema map
const parser = buildParser({
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

- All emitted events "message" are binary, according with the schema,
- For the events that not in list, JSON is used.
- Here we not use **2 packets like in socket.io-parser binary event**.
- The encode/decode schemapack functions is accessible in parser.schemas.

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

### "Automatic"

You validate a token provide by handshake request of socket.io, or another criteria and send the result to client.

```javascript
/**
 * Server side
 */
import { auth } from "extensor";

auth(ioServer);

ioServer.auth({
  async server() {
    return true;
  }
});

ioServer.on("connection", socket => {
  // Socket will be connect before allow of auth handler but,
  // blocking the not allowed events.
});

/**
 * Client side
 */

auth(ioClient);

ioClient.auth(result => {
  if (!result) console.log("you should not pass!");
});

// Support to async/await
(async function() {
  const result = await ioClient.auth();
  if (result) console.log("ok, you should pass");
})();
```

### With credential

When a client connect, the server wait the event sent from user with credentials

```javascript
// Server
auth(ioServer);

ioServer.auth({
  async credential(ctx) {
    const { data, socket } = ctx;

    return data.login === "foo" && data.pw === "bar"; //foobar makes cuscuz
  }
});

// Client
auth(ioClient);

ioClient.auth({ login: "foo", pw: "bar" }, result => {
  console.log("nordeste love's cuscuz");
});
```

### Mixed authorization

Combine the two method.

```javascript
// Server
ioServer.auth({
  // this will be called first
  async server(ctx){
    ctx.done(true);
  },
  async credential(ctx){
    const { data } = ctx;
    return { data.nickname };
  }
});

ioServer.on("connection", socket => {
  console.log(socket.nickname); // undefined

  socket.on("message", message => {
    console.log(socket.nickname, message); // foo, hi
  });
});

// Client
ioClient.auth( result => {
  if(result)
  ioClient.auth({ nickname: "foo" }, result => {
    console.log(ioClient.nickname); // foo

    ioClient.emit("message", "hi");
  })
})
```

## Blocking multiple connections

If use in a cluster, you need an external storage like redis or memcached with extensor adapter to work fine.

```javascript
// Server
const extensor = require("extensor").unique;

extensor.unique(ioServer, {
  adapter: extensor.adapters.redis(redisClient),
  id: extensor.unique.IP // identification
});

// Client
ioClient.on("error", err => {
  if (err === "multiple attemp") {
    alert("two connections are not allowed");
  }
});
```

&nbsp;

## Chat example

Simple chat application with a byte counter that create two connections, one using schemapack parser another using the default, for comparison purpose.

```shell
npm run example
```

Navigate to http://localhost:9001

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
