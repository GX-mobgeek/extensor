# Parsers benchmarks

Smallest packet size than any other serializer and fastest in some cases.

## Packet samples:

<details>
  <summary>Simple packet</summary>

```json
{
  "health": 4000,
  "jumping": false,
  "position": [-540, 343, 1201],
  "attributes": { "str": 87, "agi": 42, "int": 22 }
}
```

</details>

<details>
  <summary>Complex packet</summary>

```json
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
  "range": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
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
```

</details>

```shell
npm run benchmarks
```

# Packet size

_Less is better_

## Simple packet:

![size-simple](./charts/Packet%20size-simplePacket-benchmark.png)

## Complex packet:

![size-complex](./charts/Packet%20size-complexPacket-benchmark.png)

# Encoder

_High is better_

## Simple packet:

![encoder-simple](./charts/Encoder%20Op-sec-simplePacket-benchmark.png)

## Complex packet

![decoder-simple](./charts/Encoder%20Op-sec-complexPacket-benchmark.png)

# Decoder

_High is better_

## Simple packet:

![encoder-simple](./charts/Decoder%20Op-sec-simplePacket-benchmark.png)

## Complex packet:

![decoder-simple](./charts/Decoder%20Op-sec-complexPacket-benchmark.png)
