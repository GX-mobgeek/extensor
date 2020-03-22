const { parsers } = require("../dist/");
const SocketIOParser = require("socket.io-parser");
const Msgpack = require("socket.io-msgpack-parser");
const Benchmark = require("benchmark-util");
const {
  packetSchema,
  simplePacket,
  complexPacket,
  generateGraphic
} = require("./utils");

/**
 * Encoders
 */
const spParser = parsers.schemapack(packetSchema);

const defaultParser = {
  Encoder: new SocketIOParser.Encoder()
};
const schemapackParser = {
  Encoder: new spParser.Encoder()
};
const msgPackParser = {
  Encoder: new Msgpack.Encoder()
};
/**
 * Usefull
 */
function buildPacket(name, data) {
  return {
    type: 2,
    data: [name, data],
    options: { compress: true },
    nsp: "/"
  };
}

const packetEncode = (encoder, packet) =>
  new Promise(resolve => {
    encoder.encode(packet, ([result]) => {
      resolve(result);
    });
  });

const decodePacket = (Decoder, packet) =>
  new Promise(resolve => {
    const decoder = new Decoder();

    decoder.on("decoded", packet => {
      resolve(packet);
    });

    decoder.add(packet);
  });

/**
 * Tests
 */
async function testSize(name, packet) {
  const spPacket = Buffer.from(
    await packetEncode(schemapackParser.Encoder, packet)
  ).byteLength;

  const dfPacket = Buffer.from(
    await packetEncode(defaultParser.Encoder, packet)
  ).byteLength;

  const msgpackPacket = Buffer.from(
    await packetEncode(msgPackParser.Encoder, packet)
  ).byteLength;
  const jsonPacket = Buffer.from(JSON.stringify(packet)).byteLength;

  const sizes = [
    [`Schemapack ${spPacket} bytes`, spPacket],
    [`Default ${dfPacket} bytes`, dfPacket],
    [`Msgpack ${msgpackPacket} bytes`, msgpackPacket],
    [`JSON ${jsonPacket} bytes`, jsonPacket]
  ];

  const fsizes = sizes.sort((a, b) => (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0));

  console.log(`------- Size ${name} -------\n`);
  fsizes.map(([name]) => console.log(name));
  console.log(`\n`);

  await generateGraphic("Packet size", name, fsizes);
}

async function testEncoder(name, packet) {
  console.log(`------- Encoder ${name} -------\n`);

  const benchmark = new Benchmark();

  benchmark
    .add("Schemapack", async () => {
      await packetEncode(schemapackParser.Encoder, packet);
    })
    .add("Default", async () => {
      await packetEncode(defaultParser.Encoder, packet);
    })
    .add("Msgpack", async () => {
      await packetEncode(msgPackParser.Encoder, packet);
    })
    .add("JSON", () => {
      JSON.stringify(packet);
    });

  let results = await benchmark.run({
    onStart: () => console.log(`${name} \n`),
    onCycle: ({ name, totals, samples, warmup }) => {
      console.log(
        `${name} x ${Math.round(totals.avg)} ops/sec ± ${Math.round(
          (totals.stdDev / totals.avg) * 10000
        ) / 100}% (${totals.runs} runs sampled)`
      );
    }
  });

  let fastest = results.sort((a, b) =>
    a.totals.avg > b.totals.avg ? -1 : a.totals.avg < b.totals.avg ? 1 : 0
  )[0].name;

  const opsec = results.map(({ name, totals: { avg } }) => [
    `${name} ${avg}/sec`,
    avg
  ]);

  console.log(`Fastest is: ${fastest}\n\n`);
  await generateGraphic("Encoder Op/sec", name, opsec);
}

function jsonDecode(packet) {
  return new Promise(resolve => {
    resolve(JSON.parse(packet));
  });
}

async function testDecoder(name, packet) {
  const spPacket = await packetEncode(schemapackParser.Encoder, packet);
  const defaultPacket = await packetEncode(defaultParser.Encoder, packet);
  const msgpackPacket = await packetEncode(msgPackParser.Encoder, packet);
  const jsonPacket = JSON.stringify(packet);

  console.log(`------- Decoder ${name} -------\n`);

  const benchmark = new Benchmark();

  benchmark
    .add("Schemapack", async () => {
      await decodePacket(spParser.Decoder, spPacket);
    })
    .add("Default", async () => {
      await decodePacket(SocketIOParser.Decoder, defaultPacket);
    })
    .add("Msgpack", async () => {
      await decodePacket(Msgpack.Decoder, msgpackPacket);
    })
    .add("JSON", async () => {
      await jsonDecode(jsonPacket);
    });

  let results = await benchmark.run({
    onStart: () => console.log(`${name} \n`),
    onCycle: ({ name, totals, samples, warmup }) => {
      console.log(
        `${name} x ${Math.round(totals.avg)} ops/sec ± ${Math.round(
          (totals.stdDev / totals.avg) * 10000
        ) / 100}% (${totals.runs} runs sampled)`
      );
    }
  });

  let fastest = results.sort((a, b) =>
    a.totals.avg > b.totals.avg ? -1 : a.totals.avg < b.totals.avg ? 1 : 0
  )[0].name;

  const opsec = results.map(({ name, totals: { avg } }) => [
    `${name} ${avg}/sec`,
    avg
  ]);

  console.log(`Fastest is: ${fastest}\n\n`);
  await generateGraphic("Decoder Op/sec", name, opsec);
}

(async function() {
  const simple = buildPacket("simplePacket", simplePacket);
  const complex = buildPacket("complexPacket", complexPacket);

  await testSize("simplePacket", simple);
  await testSize("complexPacket", complex);

  await testEncoder("simplePacket", simple);
  await testEncoder("complexPacket", complex);

  await testDecoder("simplePacket", simple);
  await testDecoder("complexPacket", complex);
})();
