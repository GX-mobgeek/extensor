# Extensor

[![Build Status](https://travis-ci.org/GX-mob/extensor.svg?branch=master)](https://travis-ci.org/GX-mob/extensor) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![DependenciesSstatus](https://david-dm.org/gx-mob/extensor/status.svg)](https://david-dm.org/gx-mob/extensor)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor?ref=badge_shield)
[![Known Vulnerabilities](https://snyk.io//test/github/GX-mobgeek/extensor/badge.svg?targetFile=package.json)](https://snyk.io//test/github/GX-mobgeek/extensor?targetFile=package.json)

### A javascript library that extend functions to the socket.io, work on server and browser.

**Currently implemented:**

- Authentication with 3 methods options;
  - Server validation also "AUTO";
  - User credential, and:
  - Mixed: Server with credential.
- Block multiple connections of same origin and;
- Made easy the serialization with schemapack.

**Next:**

- Serialization in acknowledge

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

## Examples

### Binary serialization with schemapack

```javascript
import { buildParser } from "extensor";
// or
const { buildParser } = require("extensor");

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

You validate a token provide by any method of socket.io, or another criteria and send the result to client.

```javascript
// Server
import { withAuth } from "extensor";
// or
const { withAuth } = require("extensor");

withAuth(
  ioServer,
  {
    method: withAuth.AUTO
  },
  response => {
    // response( /* status of authentication */, /* atachs props in socket object */ )
    return response(true, { userId: "123" });
  }
);

// Client
withAuth(
  ioClient,
  {
    method: withAuth.AUTO
  },
  result => {
    if (result) {
      alert("Authorized!");
    }
  }
);
```

### With credential

When a client connect, the server wait the event sent from user with credentials

```javascript
// Server
withAuth(
  ioServer,
  {
    method: withAuth.CREDENTIAL,
    timeout: 10000 // optional, default: false
  },
  (user, response) => {
    // user = the data sent by user
    respone(user.login === "ferco" && user.pw === "123");
  }
);

// Client
withAuth(
  ioClient,
  {
    method: withAuth.CREDENTIAL,
    timeout: 10000 // optional, default: false
  },
  authorize => {
    authorize({ login: "ferco", pw: "123" }, result => {
      if (result) {
        alert("Authorized!");
      }
    });
  }
);
```

### Mixed authorization

Combine the two method, automatic is called first.

```javascript
// Server
withAuth(
  ioServer,
  {
    method: withAuth.MIXED,
    timeout: 10000 // optional, default: false
  },
  (response, socket) => {
    response(socket.handshake.address === "myip");
  },
  (user, response) => {
    // user = the data sent by user
    respone(user.login === "ferco" && user.pw === "123");
  }
);

// Client
withAuth(
  ioClient,
  {
    method: withAuth.MIXED
  },
  authorize => {
    if (!authorized) {
      return alert("Fail on first-step¹");
    }

    authorize({ login: "ferco", pw: "123" }, result => {
      if (result) {
        alert("Authorized!");
      }
    });
  }
);
```

## Blocking multiple connections

You need a external storage to ensure the blocking.

```javascript
// Server
import { forceOne } from "extensor";
// or
const { forceOne } = require("extensor");

forceOne(ioServer, {
  adapter: forceOne.adapters.redis(redisClient),
  id: forceOne.IP // identification
});

// Client
forceOne(ioClient, () => {
  alert("We not allow multiple connections.");
});
```

**But you can do some like that.**

```javascript
const adapterStorage = {};

const customAdapter = {
  get: key =>
    new Promise((resolve, reject) => {
      try {
        if (!(key in adapterStorage)) {
          return resolve(null);
        }

        let { expire, value } = adapterStorage[key];

        if (expire !== false && expire < Date.now()) {
          delete adapterStorage[key];
          return resolve(null);
        }

        return resolve(value);
      } catch (e) {
        reject(e);
      }
    }),
  set: (key, value, expire = false) =>
    new Promise((resolve, reject) => {
      try {
        if (expire !== false) {
          // expire defined aways in minutes, convert to ms
          expire *= 60000;
          expire += Date.now();
        }

        adapterStorage[key] = { expire, value };
        return resolve(true);
      } catch (e) {
        reject(e);
      }
    }),
  del: key =>
    new Promise((resolve, reject) => {
      try {
        if (key in adapterStorage) {
          delete adapterStorage[key];
        }

        return resolve(true);
      } catch (e) {
        reject(e);
      }
    })
};
```

#### I think that i don't need to warning, but this approach not work in clusters.

&nbsp;

## Chat example

Simple chat application with a byte counter that create two connections, one using schemapack parser another using the default, for comparison purpose.

```shell
npm run example
```

Navigate to http://localhost:9001

## API

#### `buildParser( Object ): { Encoder, Decoder, parser }`

Create a parser for Socket.io instance and encode/decode functions built by schemapack for each schema.

#### `withAuth( io: Socket.io Engine, options: { method: AUTO | CREDENTIAL | MIXED, timeout?: Number}, step1: Function[, step2: Function ] ): void`

Create a wrapper to handle the authorization

#### Server `forceOne( options: { adapter: redis | ioRedis | memcached | custom , id?: IP | IP_UA | string } )`

```
id: Identification
	disallowMultiplicity.IP: By ip
	disallowMultiplicity.IP_UA: By ip + user agent
	string: By value in socket property with this name
```

#### Client `forceOne( onBlock: Function )`

Create a step to block multiple connections

## License

MIT


[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2FGX-mobgeek%2Fextensor?ref=badge_large)
