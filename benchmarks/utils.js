const { Server } = require("http");
const SocketIO = require("socket.io");
const SocketIOClient = require("socket.io-client");

module.exports.makeServer = function makeServer(opts) {
  const http = new Server();
  const io = SocketIO(http, {
    ...opts,
    transports: ["websocket", "polling"]
  });

  io.on("connection", socket => {
    socket.on(complexPacketName, (data, ack) => {
      ack && ack();
    });
  });
  return {
    http,
    io
  };
};

module.exports.makeClient = function makeClient(srv, opts) {
  let addr = srv.address();
  if (!addr) addr = srv.listen().address();

  const url = "ws://localhost:" + addr.port;
  return SocketIOClient(url, {
    ...opts,
    transports: ["websocket", "polling"]
  });
};

module.exports.packetSchema = {
  simplePacket: {
    id: 1,
    schema: {
      health: "varuint",
      jumping: "boolean",
      position: ["int16"],
      attributes: { str: "uint8", agi: "uint8", int: "uint8" }
    }
  },
  complexPacket: {
    id: 2,
    schema: {
      _id: "string",
      index: "uint8",
      guid: "string",
      isActive: "boolean",
      balance: "float32",
      picture: "string",
      age: "uint8",
      eyeColor: "string",
      name: {
        first: "string",
        last: "string"
      },
      range: ["uint8"],
      friends: [
        {
          id: "uint8",
          name: "string"
        }
      ]
    }
  }
};

module.exports.simplePacket = {
  health: 4000,
  jumping: false,
  position: [-540, 343, 1201],
  attributes: { str: 87, agi: 42, int: 22 }
};

module.exports.complexPacket = {
  _id: "5d93b9d70cbdf21c0c6f56bb",
  index: 0,
  guid: "4c63d6bb-0680-4b2d-9343-919c9892d837",
  isActive: false,
  balance: 3312.84,
  picture: "http://placehold.it/32x32",
  age: 36,
  eyeColor: "brown",
  name: {
    first: "Clements",
    last: "Alford"
  },
  range: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  friends: [
    {
      id: 0,
      name: "Caldwell Martin"
    },
    {
      id: 1,
      name: "Ora Gould"
    },
    {
      id: 2,
      name: "Beryl Haney"
    }
  ]
};

module.exports.generateGraphic = async function generateGraphic(
  title,
  name,
  data
) {
  const browser = await require("puppeteer").launch({
    defaultViewport: { width: 600, height: 600 }
  });
  const page = await browser.newPage();
  await page.setContent(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html,
          body{
            background: #fff;
            margin: 0;
            width: 600px;
            height: 600px;
          }

          .chart {
            width: 600px;
            height: 600px;
            float: left;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@2.8.0"></script>
      </head>
      <body>
        <canvas id="chart" class="chart"></canvas>
        <script>
          var options = {
            aspectRatio: 1,
            responsive: false,
            tooltips: {
              mode: "index"
            },
            animation: {
              duration: 0 // general animation time
            }
          };

          new Chart("chart", {
            type: "bar",
            data: {
              labels: ${JSON.stringify(data.map(([label]) => label))},
              datasets: [
                {
                  label: "${title}",
                  backgroundColor: "rgba(0, 100, 255,1)",
                  data: ${JSON.stringify(data.map(([, value]) => value))},
                  barThickness: 1
                }
              ]
            },
            options: options
          });
        </script>
      </body>
    </html>
    `,
    {
      waitUntil: ["domcontentloaded", "load"]
    }
  );
  await page.screenshot({
    path: `./benchmarks/charts/${title.replace("/", "-")}-${name}-benchmark.png`
  });

  await browser.close();
};
